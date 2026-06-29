"""Password hashing and verification utilities.

Uses passlib with bcrypt for industry-standard password hashing.
"""

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt.

    Args:
        plain_password: The raw password string to hash.

    Returns:
        str: The bcrypt-hashed password string.
    """
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its hash.

    Args:
        plain_password: The raw password to verify.
        hashed_password: The stored bcrypt hash to compare against.

    Returns:
        bool: ``True`` if the password matches the hash.
    """
    return _pwd_context.verify(plain_password, hashed_password)
