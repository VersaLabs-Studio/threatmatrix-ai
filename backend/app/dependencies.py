"""
ThreatMatrix AI — FastAPI Dependencies
Authentication and authorization dependencies for protected endpoints.

Implements:
- JWT token extraction and validation
- Current user retrieval from token
- Active user verification
- Role-based access control (RBAC) decorator
- DEV MODE bypass for visual verification (logged)
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token

# ── Security Scheme ────────────────────────────────────────────
security = HTTPBearer()

# ── Dev Mode Mock User ────────────────────────────────────────
DEV_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
DEV_USER_EMAIL = "dev@threatmatrix.local"
DEV_USER_NAME = "Dev Admin"
DEV_USER_ROLE = "admin"


def _get_dev_user() -> User:
    """Create a mock admin user for DEV_MODE bypass."""
    print(f"[⚠️  DEV_MODE] Auth bypassed — using mock admin user ({DEV_USER_EMAIL})")
    return User(
        id=DEV_USER_ID,
        email=DEV_USER_EMAIL,
        password_hash="dev-bypass-no-hash",
        full_name=DEV_USER_NAME,
        role=DEV_USER_ROLE,
        language="en",
        is_active=True,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate user from JWT token.
    
    This dependency:
    1. Checks if DEV_MODE is enabled → returns mock admin user
    2. Extracts the Bearer token from the Authorization header
    3. Decodes and validates the JWT token
    4. Retrieves the user from the database
    5. Returns the User model
    
    Args:
        credentials: HTTP Bearer credentials from Authorization header
        db: Database session
        
    Returns:
        User model for the authenticated user
        
    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
    """
    settings = get_settings()
    
    # ── DEV MODE BYPASS ──────────────────────────────────────
    # Returns a mock admin user without JWT validation
    # Logged for audit trail — disable DEV_MODE in production!
    if settings.DEV_MODE:
        return _get_dev_user()
    
    # ── Normal JWT Validation ────────────────────────────────
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Decode and validate token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify it's an access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user ID from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Retrieve user from database
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is active.
    
    This dependency builds on get_current_user and adds
    an additional check for the is_active flag.
    
    In DEV_MODE, the mock user is always active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User model if user is active
        
    Raises:
        HTTPException 403: If user account is deactivated
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return current_user


def require_role(allowed_roles: list[str]):
    """
    Dependency factory for role-based access control (RBAC).
    
    Creates a dependency that checks if the current user's role
    is in the list of allowed roles.
    
    Usage:
        @app.get("/admin/users", dependencies=[Depends(require_role(["admin"]))])
        async def list_users():
            ...
    
    Or as a dependency parameter:
        async def admin_endpoint(
            current_user: User = Depends(require_role(["admin", "soc_manager"]))
        ):
            ...
    
    Args:
        allowed_roles: List of role strings that are permitted
        
    Returns:
        Dependency function that validates user role
        
    Raises:
        HTTPException 403: If user's role is not in allowed_roles
    
    Role Permissions (from MASTER_DOC_PART2 §7.2):
        - admin: Full access to all features
        - soc_manager: Most features except user management and system config
        - analyst: View, acknowledge alerts, use AI Analyst, upload PCAP, generate reports
        - viewer: View dashboard and alerts only
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """Check if current user has an allowed role."""
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {', '.join(allowed_roles)}",
            )
        return current_user
    
    return role_checker
