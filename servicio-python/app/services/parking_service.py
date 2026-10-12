from datetime import datetime, timezone
from decimal import Decimal
from math import ceil
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import clients
from app.errors import ApiError
from app.models import ParkingSpace, Rate, Ticket
from app.schemas import (
    ExitOut,
    QuoteOut,
    RateOut,
    RateUpdate,
    SpaceCreate,
    SpaceOut,
    SpaceUpdate,
    TicketOut,
)
from app.services.fee_calculator import calculate_fee


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def elapsed_minutes(start: datetime, end: datetime) -> int:
    return max(ceil((end - start).total_seconds() / 60), 0)


def space_view(space: ParkingSpace, plate: str | None = None) -> SpaceOut:
    return SpaceOut(
        id=space.id,
        code=space.code,
        zone=space.zone,
        row_index=space.row_index,
        col_index=space.col_index,
        vehicle_type=space.vehicle_type,
        status=space.status,
        plate=plate,
    )


def notify_space_change(event_type: str, space: ParkingSpace, plate: str | None, occurred_at: datetime | None = None) -> None:
    moment = occurred_at or utc_now()
    clients.notify_space_event(
        {
            "type": event_type,
            "spaceId": space.id,
            "spaceCode": space.code,
            "zone": space.zone,
            "rowIndex": space.row_index,
            "colIndex": space.col_index,
            "status": space.status,
            "plate": plate,
            "vehicleType": space.vehicle_type,
            "occurredAt": moment.isoformat().replace("+00:00", "Z"),
        }
    )


def open_plates_by_space(db: Session) -> dict[int, str]:
    rows = db.execute(select(Ticket.space_id, Ticket.plate).where(Ticket.status == "OPEN", Ticket.space_id.is_not(None))).all()
    return {space_id: plate for space_id, plate in rows}


def list_spaces(db: Session, status: str | None = None, vehicle_type: str | None = None) -> list[SpaceOut]:
    statement = select(ParkingSpace).order_by(ParkingSpace.row_index, ParkingSpace.col_index, ParkingSpace.id)
    if status:
        statement = statement.where(ParkingSpace.status == status)
    if vehicle_type:
        statement = statement.where(ParkingSpace.vehicle_type == vehicle_type)
    plates = open_plates_by_space(db)
    return [space_view(space, plates.get(space.id)) for space in db.scalars(statement)]


def get_space_or_404(db: Session, space_id: int, lock: bool = False) -> ParkingSpace:
    statement = select(ParkingSpace).where(ParkingSpace.id == space_id)
    if lock:
        statement = statement.with_for_update()
    space = db.scalars(statement).first()
    if space is None:
        raise ApiError(404, "SPACE_NOT_FOUND", "Parking space not found")
    return space


def create_space(db: Session, data: SpaceCreate) -> SpaceOut:
    space = ParkingSpace(
        code=data.code,
        zone=data.zone,
        row_index=data.row_index,
        col_index=data.col_index,
        vehicle_type=data.vehicle_type,
        status=data.status,
    )
    db.add(space)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "SPACE_CODE_TAKEN", "A parking space with this code already exists")
    notify_space_change("SPACE_CREATED", space, None)
    return space_view(space)


def update_space(db: Session, space_id: int, data: SpaceUpdate) -> SpaceOut:
    space = get_space_or_404(db, space_id, lock=True)
    changes = data.model_dump(exclude_unset=True)
    if space.status == "OCCUPIED" and ("status" in changes or "vehicle_type" in changes):
        db.rollback()
        raise ApiError(409, "SPACE_OCCUPIED", "An occupied space cannot change status or vehicle type")
    for field, value in changes.items():
        if value is not None:
            setattr(space, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "SPACE_CODE_TAKEN", "A parking space with this code already exists")
    plate = open_plates_by_space(db).get(space.id)
    notify_space_change("SPACE_UPDATED", space, plate)
    return space_view(space, plate)


def delete_space(db: Session, space_id: int) -> None:
    space = get_space_or_404(db, space_id, lock=True)
    has_open_ticket = db.scalars(
        select(Ticket.id).where(Ticket.space_id == space.id, Ticket.status == "OPEN")
    ).first()
    if has_open_ticket is not None or space.status == "OCCUPIED":
        db.rollback()
        raise ApiError(409, "SPACE_HAS_OPEN_TICKET", "The space has an open ticket")
    snapshot = ParkingSpace(
        id=space.id,
        code=space.code,
        zone=space.zone,
        row_index=space.row_index,
        col_index=space.col_index,
        vehicle_type=space.vehicle_type,
        status=space.status,
    )
    db.delete(space)
    db.commit()
    notify_space_change("SPACE_DELETED", snapshot, None)


def list_rates(db: Session) -> list[RateOut]:
    rates = db.scalars(select(Rate).order_by(Rate.id))
    return [RateOut.model_validate(rate) for rate in rates]


def get_rate_or_404(db: Session, vehicle_type: str) -> Rate:
    rate = db.scalars(select(Rate).where(Rate.vehicle_type == vehicle_type)).first()
    if rate is None:
        raise ApiError(404, "RATE_NOT_FOUND", "Rate not found for the vehicle type")
    return rate


def update_rate(db: Session, vehicle_type: str, data: RateUpdate) -> RateOut:
    rate = get_rate_or_404(db, vehicle_type)
    rate.first_hour = data.first_hour
    rate.extra_hour = data.extra_hour
    rate.daily_cap = data.daily_cap
    rate.grace_minutes = data.grace_minutes
    db.commit()
    return RateOut.model_validate(rate)


def list_tickets(db: Session, status: str | None, plate: str | None, limit: int) -> list[TicketOut]:
    statement = select(Ticket).options(selectinload(Ticket.space)).order_by(Ticket.entry_at.desc()).limit(limit)
    if status:
        statement = statement.where(Ticket.status == status)
    if plate:
        statement = statement.where(Ticket.plate.contains(plate.strip().upper(), autoescape=True))
    return [TicketOut.model_validate(ticket) for ticket in db.scalars(statement)]


def get_ticket_or_404(db: Session, ticket_id: UUID) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise ApiError(404, "TICKET_NOT_FOUND", "Ticket not found")
    return ticket


def get_ticket(db: Session, ticket_id: UUID) -> TicketOut:
    return TicketOut.model_validate(get_ticket_or_404(db, ticket_id))


def quote_ticket(db: Session, ticket_id: UUID) -> QuoteOut:
    ticket = get_ticket_or_404(db, ticket_id)
    if ticket.status != "OPEN":
        raise ApiError(409, "TICKET_NOT_OPEN", "The ticket is already closed")
    rate = get_rate_or_404(db, ticket.vehicle_type)
    quoted_at = utc_now()
    total_minutes = elapsed_minutes(ticket.entry_at, quoted_at)
    return QuoteOut(
        ticket_id=ticket.id,
        plate=ticket.plate,
        vehicle_type=ticket.vehicle_type,
        entry_at=ticket.entry_at,
        quoted_at=quoted_at,
        total_minutes=total_minutes,
        fee=calculate_fee(total_minutes, rate),
    )


def _lock_requested_space(db: Session, space_id: int, vehicle_type: str) -> ParkingSpace:
    space = get_space_or_404(db, space_id, lock=True)
    if space.status != "FREE":
        db.rollback()
        raise ApiError(409, "SPACE_NOT_AVAILABLE", "The requested space is not available")
    if space.vehicle_type != vehicle_type:
        db.rollback()
        raise ApiError(409, "SPACE_TYPE_MISMATCH", "The space does not accept this vehicle type")
    return space


def _lock_first_free_space(db: Session, vehicle_type: str) -> ParkingSpace:
    statement = (
        select(ParkingSpace)
        .where(ParkingSpace.status == "FREE", ParkingSpace.vehicle_type == vehicle_type)
        .order_by(ParkingSpace.row_index, ParkingSpace.col_index, ParkingSpace.id)
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    space = db.scalars(statement).first()
    if space is None:
        db.rollback()
        raise ApiError(409, "NO_SPACE_AVAILABLE", "No free space is available for this vehicle type")
    return space


def register_entry(db: Session, plate: str, vehicle_type: str, space_id: int | None, operator_id: str) -> TicketOut:
    already_parked = db.scalars(select(Ticket.id).where(Ticket.plate == plate, Ticket.status == "OPEN")).first()
    if already_parked is not None:
        raise ApiError(409, "PLATE_ALREADY_PARKED", "The vehicle already has an open ticket")
    if space_id is not None:
        space = _lock_requested_space(db, space_id, vehicle_type)
    else:
        space = _lock_first_free_space(db, vehicle_type)
    entry_at = utc_now()
    ticket = Ticket(
        plate=plate,
        vehicle_type=vehicle_type,
        space=space,
        entry_at=entry_at,
        status="OPEN",
        operator_id=operator_id,
    )
    space.status = "OCCUPIED"
    db.add(ticket)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        if "uq_tickets_open_plate" in str(error.orig):
            raise ApiError(409, "PLATE_ALREADY_PARKED", "The vehicle already has an open ticket")
        raise ApiError(409, "SPACE_NOT_AVAILABLE", "The requested space is not available")
    notify_space_change("ENTRY", space, plate, entry_at)
    return TicketOut.model_validate(ticket)


def _find_open_ticket_for_update(db: Session, ticket_id: UUID | None, plate: str | None) -> Ticket:
    statement = select(Ticket).where(Ticket.status == "OPEN")
    if ticket_id is not None:
        statement = statement.where(Ticket.id == ticket_id)
    else:
        statement = statement.where(Ticket.plate == plate)
    ticket = db.scalars(statement.with_for_update(of=Ticket)).first()
    if ticket is None:
        db.rollback()
        raise ApiError(404, "TICKET_NOT_FOUND", "No open ticket was found")
    return ticket


def _request_invoice(db: Session, ticket: Ticket, exit_at: datetime, total_minutes: int, fee: Decimal) -> dict:
    payload = {
        "ticketId": str(ticket.id),
        "plate": ticket.plate,
        "vehicleType": ticket.vehicle_type,
        "entryAt": ticket.entry_at.isoformat().replace("+00:00", "Z"),
        "exitAt": exit_at.isoformat().replace("+00:00", "Z"),
        "totalMinutes": total_minutes,
        "subtotal": f"{fee:.2f}",
        "operatorId": ticket.operator_id,
    }
    try:
        return clients.create_invoice(payload)
    except clients.BillingUnavailable:
        db.rollback()
        raise ApiError(502, "BILLING_UNAVAILABLE", "The billing service is unavailable")


def register_exit(db: Session, ticket_id: UUID | None, plate: str | None) -> ExitOut:
    ticket = _find_open_ticket_for_update(db, ticket_id, plate)
    rate = get_rate_or_404(db, ticket.vehicle_type)
    exit_at = utc_now()
    total_minutes = elapsed_minutes(ticket.entry_at, exit_at)
    fee = calculate_fee(total_minutes, rate)
    invoice = _request_invoice(db, ticket, exit_at, total_minutes, fee)
    try:
        ticket.exit_at = datetime.fromisoformat(invoice["exitAt"])
        ticket.total_minutes = int(invoice["totalMinutes"])
        ticket.fee = Decimal(str(invoice["subtotal"]))
        ticket.invoice_number = str(invoice["number"])
    except (KeyError, ValueError, ArithmeticError):
        db.rollback()
        raise ApiError(502, "BILLING_UNAVAILABLE", "The billing service returned an invalid response")
    ticket.status = "CLOSED"
    space = ticket.space
    if space is not None and space.status == "OCCUPIED":
        space.status = "FREE"
    db.commit()
    if space is not None:
        notify_space_change("EXIT", space, ticket.plate, ticket.exit_at)
    ticket_view = TicketOut.model_validate(ticket)
    return ExitOut(**ticket_view.model_dump(), invoice=invoice)
