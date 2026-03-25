"""
ThreatMatrix AI — Alert Model
SQLAlchemy ORM model for the alerts table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, INET, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Alert(Base, TimestampMixin):
    """
    Security alert with ML scoring and LLM-generated narratives.
    
    Severity levels: critical, high, medium, low, info
    Status workflow: open -> acknowledged -> investigating -> resolved | false_positive
    """
    
    __tablename__ = "alerts"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique alert identifier"
    )
    
    # Alert ID (human-readable)
    alert_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        comment="Human-readable alert ID (e.g., TM-20260325-A1B2C3D4)"
    )
    
    # Severity & Classification
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="Severity: critical, high, medium, low, info"
    )
    
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Alert title"
    )
    
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Detailed alert description"
    )
    
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Alert category: ddos, port_scan, c2, dns_tunnel, brute_force"
    )
    
    # Network Context
    source_ip: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
        index=True,
        comment="Source IP address"
    )
    
    dest_ip: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
        index=True,
        comment="Destination IP address"
    )
    
    # ML Confidence
    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="ML confidence score (0.0-1.0)"
    )

    # ML Model Scores (per-model breakdown)
    composite_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Ensemble composite score (0.30*IF + 0.45*RF + 0.25*AE)"
    )

    if_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Isolation Forest anomaly score"
    )

    rf_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Random Forest attack confidence"
    )

    ae_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Autoencoder reconstruction error score"
    )
    
    # Status & Assignment
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="open",
        index=True,
        comment="Status: open, acknowledged, investigating, resolved, false_positive"
    )
    
    assigned_to: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="User ID of assigned analyst"
    )
    
    # Related Flows
    flow_ids: Mapped[list | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True,
        comment="Array of related network flow IDs"
    )
    
    # ML Model Reference
    ml_model: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="ML model that generated this alert"
    )
    
    # LLM-Generated Content
    ai_narrative: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="LLM-generated threat explanation"
    )
    
    ai_playbook: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="LLM-generated response playbook"
    )
    
    # Resolution
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when alert was resolved"
    )
    
    resolved_by: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="User ID who resolved the alert"
    )
    
    resolution_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Resolution notes"
    )
    
    # Relationships
    assignee = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_alerts",
        lazy="selectin"
    )
    
    resolver = relationship(
        "User",
        foreign_keys=[resolved_by],
        back_populates="resolved_alerts",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Alert(id={self.alert_id}, severity={self.severity}, status={self.status})>"
