from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import EntryRequest, ExitOut, ExitRequest, QuoteOut, TicketOut, TicketStatus
from app.security import Principal, get_current_user
from app.services import parking_service

router = APIRouter(prefix="/api/parking", tags=["tickets"])


@router.get("/tickets", response_model=list[TicketOut])
def list_tickets(
    status: TicketStatus | None = None,
    plate: str | None = Query(default=None, max_length=10),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.list_tickets(db, status, plate, limit)


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.get_ticket(db, ticket_id)


@router.get("/tickets/{ticket_id}/quote", response_model=QuoteOut)
def quote_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.quote_ticket(db, ticket_id)


@router.post("/entries", response_model=TicketOut, status_code=201)
def register_entry(
    data: EntryRequest,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.register_entry(db, data.plate, data.vehicle_type, data.space_id, principal.subject)


@router.post("/exits", response_model=ExitOut)
def register_exit(
    data: ExitRequest,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.register_exit(db, data.ticket_id, data.plate)
