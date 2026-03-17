"""
ThreatMatrix AI — Auth Pydantic Schemas
Request/response schemas for authentication endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Request schema for user registration."""
    
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    """Request schema for user login."""
    
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response schema for user data."""
    
    id: UUID
    email: str
    full_name: str
    role: str
    language: str
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime


class TokenResponse(BaseModel):
    """Response schema for JWT tokens."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Request schema for token refresh."""
    
    refresh_token: str
