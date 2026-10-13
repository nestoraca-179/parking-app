import logging
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

logger = logging.getLogger("parking.database")

MAX_ATTEMPTS = 30
RETRY_DELAY_SECONDS = 2

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"options": "-c timezone=utc"},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            Base.metadata.create_all(engine)
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE parking_spaces ALTER COLUMN vehicle_type DROP NOT NULL"))
                connection.execute(text("ALTER TABLE parking_spaces DROP CONSTRAINT IF EXISTS ck_spaces_vehicle_type"))
                connection.execute(text("UPDATE parking_spaces SET vehicle_type = NULL WHERE status <> 'OCCUPIED'"))
            logger.info("Database schema ready")
            return
        except OperationalError as error:
            logger.warning("Database attempt %s/%s failed: %s", attempt, MAX_ATTEMPTS, error.orig)
            if attempt == MAX_ATTEMPTS:
                raise
            time.sleep(RETRY_DELAY_SECONDS)
