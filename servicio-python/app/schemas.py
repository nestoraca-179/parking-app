import re
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator, model_validator
from pydantic.alias_generators import to_camel

VehicleType = Literal["CAR", "MOTORCYCLE", "TRUCK"]
SpaceStatus = Literal["FREE", "OCCUPIED", "MAINTENANCE"]
EditableSpaceStatus = Literal["FREE", "MAINTENANCE"]
TicketStatus = Literal["OPEN", "CLOSED"]

MoneyOut = Annotated[Decimal, PlainSerializer(lambda value: f"{value:.2f}", return_type=str, when_used="always")]
MoneyIn = Annotated[Decimal, Field(ge=0, max_digits=8, decimal_places=2)]

PLATE_PATTERN = re.compile(r"^[A-Z0-9-]{4,10}$")
SPACE_CODE_PATTERN = re.compile(r"^[A-Z0-9-]{1,10}$")


def _normalize_plate(value: str) -> str:
    normalized = value.strip().upper()
    if not PLATE_PATTERN.match(normalized):
        raise ValueError("Plate must contain 4 to 10 letters, numbers or hyphens")
    return normalized


def _normalize_code(value: str) -> str:
    normalized = value.strip().upper()
    if not SPACE_CODE_PATTERN.match(normalized):
        raise ValueError("Code must contain 1 to 10 letters, numbers or hyphens")
    return normalized


def _normalize_zone(value: str) -> str:
    normalized = value.upper()
    if not normalized.isalpha():
        raise ValueError("Zone must be a letter")
    return normalized


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class SpaceOut(CamelModel):
    id: int
    code: str
    zone: str
    row_index: int
    col_index: int
    vehicle_type: VehicleType
    status: SpaceStatus
    plate: str | None = None


class SpaceCreate(CamelModel):
    code: str
    zone: str = Field(min_length=1, max_length=1)
    row_index: int = Field(ge=0)
    col_index: int = Field(ge=0)
    vehicle_type: VehicleType
    status: EditableSpaceStatus = "FREE"

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        return _normalize_code(value)

    @field_validator("zone")
    @classmethod
    def validate_zone(cls, value: str) -> str:
        return _normalize_zone(value)


class SpaceUpdate(CamelModel):
    code: str | None = None
    zone: str | None = Field(default=None, min_length=1, max_length=1)
    row_index: int | None = Field(default=None, ge=0)
    col_index: int | None = Field(default=None, ge=0)
    vehicle_type: VehicleType | None = None
    status: EditableSpaceStatus | None = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_code(value)

    @field_validator("zone")
    @classmethod
    def validate_zone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_zone(value)

    @model_validator(mode="after")
    def require_any_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field is required")
        return self


VEHICLE_TYPE_PATTERN = re.compile(r"^[A-Z0-9_-]{2,15}$")


def _normalize_vehicle_type(value: str) -> str:
    normalized = value.strip().upper()
    if not VEHICLE_TYPE_PATTERN.match(normalized):
        raise ValueError("Vehicle type must contain 2 to 15 uppercase letters, numbers, hyphens or underscores")
    return normalized


class RateOut(CamelModel):
    vehicle_type: str
    first_hour: MoneyOut
    extra_hour: MoneyOut
    daily_cap: MoneyOut
    grace_minutes: int


class RateCreate(CamelModel):
    vehicle_type: str = Field(min_length=2, max_length=15)
    first_hour: MoneyIn
    extra_hour: MoneyIn
    daily_cap: MoneyIn
    grace_minutes: int = Field(ge=0, le=1440)

    @field_validator("vehicle_type")
    @classmethod
    def validate_vehicle_type(cls, value: str) -> str:
        return _normalize_vehicle_type(value)


class RateUpdate(CamelModel):
    first_hour: MoneyIn
    extra_hour: MoneyIn
    daily_cap: MoneyIn
    grace_minutes: int = Field(ge=0, le=1440)


class EntryRequest(CamelModel):
    plate: str
    vehicle_type: VehicleType
    space_id: int | None = None

    @field_validator("plate")
    @classmethod
    def validate_plate(cls, value: str) -> str:
        return _normalize_plate(value)


class ExitRequest(CamelModel):
    ticket_id: UUID | None = None
    plate: str | None = None

    @field_validator("plate")
    @classmethod
    def validate_plate(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_plate(value)

    @model_validator(mode="after")
    def require_identifier(self):
        if self.ticket_id is None and self.plate is None:
            raise ValueError("Either ticketId or plate is required")
        return self


class TicketOut(CamelModel):
    id: UUID
    plate: str
    vehicle_type: VehicleType
    space_id: int | None
    space_code: str | None
    entry_at: datetime
    exit_at: datetime | None
    total_minutes: int | None
    fee: MoneyOut | None
    status: TicketStatus
    operator_id: str
    invoice_number: str | None


class ExitOut(TicketOut):
    invoice: dict


class QuoteOut(CamelModel):
    ticket_id: UUID
    plate: str
    vehicle_type: VehicleType
    entry_at: datetime
    quoted_at: datetime
    total_minutes: int
    fee: MoneyOut
