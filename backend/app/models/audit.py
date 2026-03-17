"""
ThreatMatrix AI — Audit Log Model
SQLAlchemy ORM model for the audit_log table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AuditLog(Base):
    """
    Audit log for tracking user actions.
    
    Records all significant actions for compliance and debugging.
    """
    
    __tablename__ = "audit_log"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique audit log entry identifier"
    )
    
    # User Reference
    user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
        comment="User who performed the action"
    )
    
    # Action
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Action performed (e.g., login, create_alert, update_config)"
    )
    
    # Entity
    entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Entity type (e.g., alert, user, flow)"
    )
    
    entity_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="Entity ID"
    )
    
    # Details
    details: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Additional action details"
    )
    
    # Network Context
    ip_address: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
        comment="Client IP address"
    )
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Action timestamp"
    )
    
    # Relationships
    user = relationship(
        "User",
        back_populates="audit_logs",
        lazy="selectin"
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_audit_created", "created_at", postgresql_using="btree", postgresql_ops={"created_at": "DESC"}),
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
