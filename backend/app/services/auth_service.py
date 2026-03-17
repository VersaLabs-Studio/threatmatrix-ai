"""
ThreatMatrix AI — Authentication Service
JWT authentication with bcrypt password hashing and RBAC support.

Implements:
- Password hashing with bcrypt (salt rounds=12)
- JWT access tokens (15 min expiry)
- JWT refresh tokens (7 day expiry)
- User registration, login, refresh, logout
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserResponse

settings = get_settings()

# ── Password Hashing Context ───────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


# ── Password Utilities ─────────────────────────────────────────
def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with salt rounds=12.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Utilities ────────────────────────────────────────
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode (must include 'sub' for user ID)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Payload data to encode (must include 'sub' for user ID)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> dict | None:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def get_token_payload(token: str) -> dict | None:
    """
    Extract payload from token without validation (for debugging).
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict (unverified)
    """
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False},
        )
        return payload
    except JWTError:
        return None


# ── Auth Service Class ─────────────────────────────────────────
class AuthService:
    """
    Authentication service for user management and JWT operations.
    
    Provides methods for:
    - User registration
    - User login
    - Token refresh
    - User logout
    - Password hashing/verification
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize AuthService with database session.
        
        Args:
            db: Async SQLAlchemy database session
        """
        self.db = db
    
    async def register(self, user_data: UserCreate) -> UserResponse:
        """
        Register a new user.
        
        Args:
            user_data: UserCreate schema with email, password, full_name
            
        Returns:
            UserResponse schema with created user data
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError(f"Email {user_data.email} already registered")
        
        # Create new user
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            full_name=user_data.full_name,
            role="viewer",  # Default role
            language="en",
            is_active=True,
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return UserResponse(
            id=user.id,  # type: ignore[arg-type]
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            language=user.language,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
        )
    
    async def login(self, login_data: UserLogin) -> TokenResponse:
        """
        Authenticate user and return token pair.
        
        Args:
            login_data: UserLogin schema with email and password
            
        Returns:
            TokenResponse with access_token, refresh_token, expires_in
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Get user by email
        user = await self.get_user_by_email(login_data.email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()
        
        # Create token payload
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
        
        # Generate tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        )
    
    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Refresh access token using a valid refresh token.
        
        Args:
            refresh_token: Valid JWT refresh token
            
        Returns:
            TokenResponse with new access_token and refresh_token
            
        Raises:
            ValueError: If refresh token is invalid or expired
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload:
            raise ValueError("Invalid or expired refresh token")
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        
        # Get user
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        
        user = await self.get_user_by_id(UUID(user_id))
        if not user:
            raise ValueError("User not found")
        
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Create new token pair
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
        
        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    async def logout(self, user_id: UUID) -> dict:
        """
        Logout user (invalidate session).
        
        Note: With stateless JWT, logout is handled client-side by
        discarding tokens. This method provides a server-side hook
        for future token blacklisting if needed.
        
        Args:
            user_id: User UUID
            
        Returns:
            Success message dict
        """
        # Future: Add token to blacklist in Redis
        # For now, client-side token discard is sufficient
        return {"message": "Successfully logged out", "user_id": str(user_id)}
    
    async def get_user_by_email(self, email: str) -> User | None:
        """
        Get user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User model if found, None otherwise
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """
        Get user by UUID.
        
        Args:
            user_id: User UUID
            
        Returns:
            User model if found, None otherwise
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_current_user(self, token: str) -> User | None:
        """
        Get current user from JWT token.
        
        Args:
            token: JWT access token
            
        Returns:
            User model if token is valid, None otherwise
        """
        payload = decode_token(token)
        if not payload:
            return None
        
        if payload.get("type") != "access":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        return await self.get_user_by_id(UUID(user_id))
