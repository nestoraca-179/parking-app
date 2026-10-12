from dataclasses import dataclass

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.errors import ApiError

KNOWN_ROLES = ("ADMIN", "OPERATOR", "SERVICE")

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Principal:
    subject: str
    username: str | None
    role: str


def get_principal(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> Principal:
    if credentials is None:
        raise ApiError(401, "UNAUTHORIZED", "Authentication required")
    try:
        claims = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise ApiError(401, "INVALID_TOKEN", "Invalid or expired token")
    role = claims.get("role")
    subject = claims.get("sub")
    if role not in KNOWN_ROLES or not subject:
        raise ApiError(401, "INVALID_TOKEN", "Invalid or expired token")
    return Principal(subject=subject, username=claims.get("username"), role=role)


def require_roles(*roles: str):
    def dependency(principal: Principal = Depends(get_principal)) -> Principal:
        if principal.role not in roles:
            raise ApiError(403, "FORBIDDEN", "Insufficient permissions")
        return principal

    return dependency


get_current_user = require_roles("ADMIN", "OPERATOR")
require_admin = require_roles("ADMIN")
require_service = require_roles("SERVICE")
