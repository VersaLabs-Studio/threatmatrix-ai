"""
ThreatMatrix AI — System Configuration Model
SQLAlchemy ORM model for the system_config table.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SystemConfig(Base):
    """
    System configuration key-value store.
    
    Stores application-wide configuration settings.
    """
    
    __tablename__ = "system_config"
    
    # Primary Key (key-based)
    key: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
        comment="Configuration key"
    )
    
    # Value
    value: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        comment="Configuration value (JSON)"
    )
    
    # Metadata
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Configuration description"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last update timestamp"
    )
    
    def __repr__(self) -> str:
        return f"<SystemConfig(key={self.key})>"
