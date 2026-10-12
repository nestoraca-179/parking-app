import logging
from datetime import datetime, timedelta, timezone

import httpx
import jwt

from app.config import settings

logger = logging.getLogger("parking.clients")

SERVICE_TOKEN_TTL_SECONDS = 60
REALTIME_TIMEOUT_SECONDS = 3
BILLING_TIMEOUT_SECONDS = 5


class BillingUnavailable(Exception):
    pass


def create_service_token() -> str:
    issued_at = datetime.now(timezone.utc)
    claims = {
        "sub": settings.service_name,
        "iss": settings.service_name,
        "role": "SERVICE",
        "iat": issued_at,
        "exp": issued_at + timedelta(seconds=SERVICE_TOKEN_TTL_SECONDS),
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm="HS256")


def _auth_headers() -> dict:
    return {"Authorization": f"Bearer {create_service_token()}"}


def create_invoice(payload: dict) -> dict:
    try:
        with httpx.Client(timeout=BILLING_TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{settings.billing_url}/internal/billing/invoices",
                json=payload,
                headers=_auth_headers(),
            )
        if response.status_code not in (200, 201):
            logger.error("Billing responded with status %s", response.status_code)
            raise BillingUnavailable()
        return response.json()
    except (httpx.HTTPError, ValueError) as error:
        logger.error("Billing call failed: %s", error)
        raise BillingUnavailable() from error


def notify_space_event(payload: dict) -> None:
    try:
        with httpx.Client(timeout=REALTIME_TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{settings.realtime_url}/internal/realtime/events",
                json=payload,
                headers=_auth_headers(),
            )
        if response.status_code not in (200, 201, 202, 204):
            logger.warning("Realtime responded with status %s", response.status_code)
    except httpx.HTTPError as error:
        logger.warning("Realtime notification failed: %s", error)
