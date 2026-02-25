"""
ThreatMatrix AI — Authentication Endpoints
JWT-based authentication with access/refresh tokens.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter()


# ── Request/Response Schemas ─────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool


# ── Endpoints ────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account."""
    # TODO: Implement with auth_service
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Registration endpoint — implementation pending (Day 3)",
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate and receive JWT tokens."""
    # TODO: Implement with auth_service
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login endpoint — implementation pending (Day 3)",
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token():
    """Refresh access token using refresh token."""
    # TODO: Implement with auth_service
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh endpoint — implementation pending (Day 3)",
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current authenticated user profile."""
    # TODO: Implement with auth dependency
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Profile endpoint — implementation pending (Day 3)",
    )
