import logging
from decimal import Decimal

from sqlalchemy import func, select

from app.config import settings
from app.database import SessionLocal
from app.models import ParkingSpace, Rate

logger = logging.getLogger("parking.seed")

DEFAULT_RATES = (
    ("CAR", Decimal("2.00"), Decimal("1.50"), Decimal("12.00"), 10),
    ("MOTORCYCLE", Decimal("1.00"), Decimal("0.75"), Decimal("6.00"), 10),
    ("TRUCK", Decimal("4.00"), Decimal("3.00"), Decimal("24.00"), 10),
)

ROW_LAYOUT = (("A", "CAR"), ("B", "CAR"), ("C", "MOTORCYCLE"), ("D", "TRUCK"))
COLUMNS_PER_ROW = 8


def seed_rates(db) -> None:
    existing = set(db.scalars(select(Rate.vehicle_type)))
    for vehicle_type, first_hour, extra_hour, daily_cap, grace_minutes in DEFAULT_RATES:
        if vehicle_type not in existing:
            db.add(
                Rate(
                    vehicle_type=vehicle_type,
                    first_hour=first_hour,
                    extra_hour=extra_hour,
                    daily_cap=daily_cap,
                    grace_minutes=grace_minutes,
                )
            )


def seed_spaces(db) -> None:
    if db.scalar(select(func.count()).select_from(ParkingSpace)) > 0:
        return
    for row_index, (zone, vehicle_type) in enumerate(ROW_LAYOUT):
        for col_index in range(COLUMNS_PER_ROW):
            db.add(
                ParkingSpace(
                    code=f"{zone}-{col_index + 1:02d}",
                    zone=zone,
                    row_index=row_index,
                    col_index=col_index,
                    vehicle_type=vehicle_type,
                    status="FREE",
                )
            )


def seed_database() -> None:
    with SessionLocal() as db:
        seed_rates(db)
        if settings.seed_demo_data:
            seed_spaces(db)
        db.commit()
    logger.info("Seed completed")
