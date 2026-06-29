"""User Pydantic v2 schemas — MongoDB edition (no UUID, uses str IDs)."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Shared user fields."""
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)


class UserCreateRequest(UserBase):
    """Schema for creating a new user account."""
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit.")
        return value


class UserUpdateRequest(BaseModel):
    """Schema for updating user profile fields."""
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)


class UserResponse(BaseModel):
    """Public user profile response schema."""
    model_config = {"from_attributes": True}

    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: str | None
    department: str | None
    job_title: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_user(cls, user: "User") -> "UserResponse":  # type: ignore[name-defined]  # noqa: F821
        """Build a UserResponse from a User dataclass.

        Args:
            user: User model dataclass.

        Returns:
            UserResponse: Serialised schema.
        """
        return cls(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            department=user.department,
            job_title=user.job_title,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class UserSummaryResponse(BaseModel):
    """Compact user summary for embedding in other responses."""
    model_config = {"from_attributes": True}

    id: str
    email: EmailStr
    full_name: str
    role: str
    avatar_url: str | None
