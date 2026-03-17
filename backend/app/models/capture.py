"""
ThreatMatrix AI — Capture Session Model
SQLAlchemy ORM model for the capture_sessions table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import BigInteger, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CaptureSession(Base, TimestampMixin):
    """
    Packet capture session tracking.
    
    Status: running, stopped, error
    """
    
    __tablename__ = "capture_sessions"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique session identifier"
    )
    
    # Interface
    interface: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Network interface being captured"
    )
    
    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="running",
        index=True,
        comment="Session status: running, stopped, error"
    )
    
    # Statistics
    packets_total: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        comment="Total packets captured"
    )
    
    flows_total: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        comment="Total flows generated"
    )
    
    anomalies_total: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Total anomalies detected"
    )
    
    # Timestamps
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Session start timestamp"
    )
    
    stopped_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Session stop timestamp"
    )
    
    # Configuration
    config: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Capture configuration: BPF filter, timeout settings"
    )
    
    def __repr__(self) -> str:
        return f"<CaptureSession(id={self.id}, interface={self.interface}, status={self.status})>"
