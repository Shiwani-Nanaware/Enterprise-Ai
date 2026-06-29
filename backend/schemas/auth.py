"""Authentication Pydantic v2 schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for user login credentials."""

    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    """Schema for JWT token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer")
    expires_in: int = Field(description="Access token TTL in seconds")


class RefreshTokenRequest(BaseModel):
    """Schema for access token refresh using a refresh token."""

    refresh_token: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    """Schema for changing the authenticated user's password."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
