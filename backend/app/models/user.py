"""
ThreatMatrix AI — User Model
SQLAlchemy ORM model for the users table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    User model for authentication and RBAC.
    
    Roles: admin, soc_manager, analyst, viewer
    Languages: en (English), am (Amharic)
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique user identifier"
    )
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User email address (unique)"
    )
    
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Bcrypt password hash"
    )
    
    # Profile
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="User's full name"
    )
    
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="viewer",
        comment="User role: admin, soc_manager, analyst, viewer"
    )
    
    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
        comment="Preferred language: en, am"
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether the user account is active"
    )
    
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of last successful login"
    )
    
    # Relationships
    assigned_alerts = relationship(
        "Alert",
        foreign_keys="Alert.assigned_to",
        back_populates="assignee",
        lazy="selectin"
    )
    
    resolved_alerts = relationship(
        "Alert",
        foreign_keys="Alert.resolved_by",
        back_populates="resolver",
        lazy="selectin"
    )
    
    pcap_uploads = relationship(
        "PCAPUpload",
        back_populates="uploader",
        lazy="selectin"
    )
    
    llm_conversations = relationship(
        "LLMConversation",
        back_populates="user",
        lazy="selectin"
    )
    
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
