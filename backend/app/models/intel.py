"""
ThreatMatrix AI — Threat Intelligence IOC Model
SQLAlchemy ORM model for the threat_intel_iocs table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ThreatIntelIOC(Base, TimestampMixin):
    """
    Threat Intelligence Indicator of Compromise (IOC).
    
    Aggregated from multiple sources: OTX, AbuseIPDB, VirusTotal, manual.
    IOC types: ip, domain, url, hash, email
    """
    
    __tablename__ = "threat_intel_iocs"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique IOC identifier"
    )
    
    # IOC Data
    ioc_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="IOC type: ip, domain, url, hash, email"
    )
    
    ioc_value: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        index=True,
        comment="IOC value (IP address, domain, URL, hash, etc.)"
    )
    
    # Threat Classification
    threat_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Threat type: malware, phishing, c2, scanner, botnet"
    )
    
    severity: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Severity level: critical, high, medium, low, info"
    )
    
    # Source Information
    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Source: otx, abuseipdb, virustotal, manual"
    )
    
    source_ref: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Reference URL to source"
    )
    
    # Temporal Data
    first_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="First seen timestamp"
    )
    
    last_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last seen timestamp"
    )
    
    # Confidence & Tags
    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Confidence score (0.0-1.0)"
    )
    
    tags: Mapped[list | None] = mapped_column(
        ARRAY(String),
        nullable=True,
        comment="Associated tags"
    )
    
    # Raw Data
    raw_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Raw response data from source"
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this IOC is currently active"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("ioc_type", "ioc_value", "source", name="uq_ioc_type_value_source"),
        Index("idx_iocs_value", "ioc_value"),
        Index("idx_iocs_type", "ioc_type"),
    )
    
    def __repr__(self) -> str:
        return f"<ThreatIntelIOC(type={self.ioc_type}, value={self.ioc_value}, source={self.source})>"
