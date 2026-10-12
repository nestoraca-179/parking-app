import os
from dataclasses import dataclass


def _required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable {name}")
    return value


@dataclass(frozen=True)
class Settings:
    database_url: str
    jwt_secret: str
    billing_url: str
    realtime_url: str
    seed_demo_data: bool
    service_name: str = "parking-service"


def load_settings() -> Settings:
    jwt_secret = _required("JWT_SECRET")
    if len(jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must have at least 32 characters")
    return Settings(
        database_url=_required("DATABASE_URL"),
        jwt_secret=jwt_secret,
        billing_url=os.environ.get("BILLING_URL", "http://billing-service:8080"),
        realtime_url=os.environ.get("REALTIME_URL", "http://realtime-service:8081"),
        seed_demo_data=os.environ.get("SEED_DEMO_DATA", "true").lower() == "true",
    )


settings = load_settings()
