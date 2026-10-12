import logging
import time

from sqlalchemy import create_engine
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
            logger.info("Database schema ready")
            return
        except OperationalError as error:
            logger.warning("Database attempt %s/%s failed: %s", attempt, MAX_ATTEMPTS, error.orig)
            if attempt == MAX_ATTEMPTS:
                raise
            time.sleep(RETRY_DELAY_SECONDS)
