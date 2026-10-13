import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

VEHICLE_TYPES = ("CAR", "MOTORCYCLE", "TRUCK")
SPACE_STATUSES = ("FREE", "OCCUPIED", "MAINTENANCE")
TICKET_STATUSES = ("OPEN", "CLOSED")


class ParkingSpace(Base):
    __tablename__ = "parking_spaces"
    __table_args__ = (
        CheckConstraint("status IN ('FREE', 'OCCUPIED', 'MAINTENANCE')", name="ck_spaces_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    zone: Mapped[str] = mapped_column(CHAR(1), nullable=False)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    col_index: Mapped[int] = mapped_column(Integer, nullable=False)
    vehicle_type: Mapped[str | None] = mapped_column(String(15), nullable=True)
    status: Mapped[str] = mapped_column(String(15), nullable=False, default="FREE", server_default="FREE")
    status_since: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Rate(Base):
    __tablename__ = "rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_type: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    first_hour: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    extra_hour: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    daily_cap: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    grace_minutes: Mapped[int] = mapped_column(Integer, nullable=False)


class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        CheckConstraint("status IN ('OPEN', 'CLOSED')", name="ck_tickets_status"),
        Index("uq_tickets_open_plate", "plate", unique=True, postgresql_where=text("status = 'OPEN'")),
        Index("uq_tickets_open_space", "space_id", unique=True, postgresql_where=text("status = 'OPEN'")),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate: Mapped[str] = mapped_column(String(10), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(15), nullable=False)
    space_id: Mapped[int | None] = mapped_column(ForeignKey("parking_spaces.id", ondelete="SET NULL"))
    entry_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    exit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_minutes: Mapped[int | None] = mapped_column(Integer)
    fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="OPEN")
    operator_id: Mapped[str] = mapped_column(String(24), nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(String(30))

    space: Mapped[ParkingSpace | None] = relationship(lazy="select")

    @property
    def space_code(self) -> str | None:
        return self.space.code if self.space is not None else None
