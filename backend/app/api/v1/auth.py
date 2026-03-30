"""
ThreatMatrix AI — Authentication Endpoints
JWT-based authentication with access/refresh tokens.

Endpoints:
- POST /auth/register - Create new user (admin only)
- POST /auth/login - Login and get token pair
- POST /auth/refresh - Refresh access token
- GET /auth/me - Get current user profile
- POST /auth/logout - Logout user
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.auth import TokenRefresh, TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.auth_service import AuthService
from app.services.audit_service import log_audit_event_sync

router = APIRouter()


# ── Endpoints ─────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account. Requires admin role.",
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
) -> UserResponse:
    """
    Register a new user account.
    
    - **email**: Valid email address (unique)
    - **password**: Minimum 8 characters
    - **full_name**: User's full name
    
    Requires admin role to create new accounts.
    """
    auth_service = AuthService(db)
    
    try:
        user_response = await auth_service.register(user_data)
        return user_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate with email and password to receive JWT tokens.",
)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user and return JWT token pair.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access_token (15 min) and refresh_token (7 days).
    No authentication required.
    """
    auth_service = AuthService(db)

    try:
        token_response = await auth_service.login(login_data)
        # Audit log (fire-and-forget)
        log_audit_event_sync(
            action="login",
            entity_type="user",
            user_id=str(token_response.user_id) if hasattr(token_response, 'user_id') else None,
            details={"email": login_data.email},
        )
        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a valid refresh token.",
)
async def refresh_token(
    refresh_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid JWT refresh token
    
    Returns new access_token and refresh_token pair.
    """
    auth_service = AuthService(db)
    
    try:
        token_response = await auth_service.refresh(refresh_data.refresh_token)
        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the profile of the currently authenticated user.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get current authenticated user profile.
    
    Requires valid JWT access token in Authorization header.
    """
    return UserResponse(
        id=current_user.id,  # type: ignore[arg-type]
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        language=current_user.language,
        is_active=current_user.is_active,
        last_login=current_user.last_login,
        created_at=current_user.created_at,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Logout the current user (invalidate session).",
)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Logout current user.
    
    Requires valid JWT access token in Authorization header.
    With stateless JWT, client should discard tokens after logout.
    """
    auth_service = AuthService(db)
    result = await auth_service.logout(current_user.id)  # type: ignore[arg-type]
    return result
