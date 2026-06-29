"""JWT token creation and verification utilities.

Provides functions to create and verify access/refresh tokens using
``python-jose`` with HS256 signing.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from core.config import get_settings
from core.exceptions import AuthenticationError, TokenExpiredError
from core.logging import get_logger

logger = get_logger(__name__)

_ALGORITHM = "HS256"
_ACCESS_TOKEN_TYPE = "access"
_REFRESH_TOKEN_TYPE = "refresh"


def _get_secret() -> str:
    """Return the JWT signing secret from application settings."""
    return get_settings().jwt.secret_key


def create_access_token(
    subject: str,
    role: str,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime]:
    """Create a signed JWT access token.

    Args:
        subject: The token subject (typically the user UUID as a string).
        role: The user's RBAC role to embed as a claim.
        extra_claims: Optional additional claims to embed in the payload.

    Returns:
        tuple[str, datetime]: The encoded JWT string and its expiry datetime.
    """
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.jwt.access_token_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": _ACCESS_TOKEN_TYPE,
        "iat": datetime.now(UTC),
        "exp": expires_at,
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, _get_secret(), algorithm=_ALGORITHM)
    return token, expires_at


def create_refresh_token(subject: str) -> tuple[str, datetime]:
    """Create a signed JWT refresh token.

    Args:
        subject: The token subject (typically the user UUID as a string).

    Returns:
        tuple[str, datetime]: The encoded JWT string and its expiry datetime.
    """
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(
        days=settings.jwt.refresh_token_expire_days
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "type": _REFRESH_TOKEN_TYPE,
        "iat": datetime.now(UTC),
        "exp": expires_at,
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, _get_secret(), algorithm=_ALGORITHM)
    return token, expires_at


def verify_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT access token.

    Args:
        token: The raw JWT string.

    Returns:
        dict[str, Any]: The decoded payload claims.

    Raises:
        TokenExpiredError: If the token has expired.
        AuthenticationError: If the token is malformed or has an invalid type.
    """
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=[_ALGORITHM])
    except ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except JWTError as exc:
        raise AuthenticationError("Invalid access token.") from exc

    if payload.get("type") != _ACCESS_TOKEN_TYPE:
        raise AuthenticationError("Token type mismatch.")

    return payload


def verify_refresh_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT refresh token.

    Args:
        token: The raw JWT string.

    Returns:
        dict[str, Any]: The decoded payload claims.

    Raises:
        TokenExpiredError: If the token has expired.
        AuthenticationError: If the token is malformed or has an invalid type.
    """
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=[_ALGORITHM])
    except ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except JWTError as exc:
        raise AuthenticationError("Invalid refresh token.") from exc

    if payload.get("type") != _REFRESH_TOKEN_TYPE:
        raise AuthenticationError("Token type mismatch.")

    return payload
