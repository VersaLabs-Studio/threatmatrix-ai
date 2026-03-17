"""
ThreatMatrix AI — PCAP Upload Model
SQLAlchemy ORM model for the pcap_uploads table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import BigInteger, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PCAPUpload(Base, TimestampMixin):
    """
    PCAP file upload for forensic analysis.
    
    Status: pending, processing, complete, error
    """
    
    __tablename__ = "pcap_uploads"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique upload identifier"
    )
    
    # File Info
    filename: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Original filename"
    )
    
    file_size: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        comment="File size in bytes"
    )
    
    file_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Storage path"
    )
    
    # Processing Status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        comment="Processing status: pending, processing, complete, error"
    )
    
    # Results
    packets_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Total packets in PCAP"
    )
    
    flows_extracted: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Flows extracted from PCAP"
    )
    
    anomalies_found: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Anomalies detected in PCAP"
    )
    
    # User Reference
    uploaded_by: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="User ID who uploaded the file"
    )
    
    # Timestamps
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Processing completion timestamp"
    )
    
    # Relationships
    uploader = relationship(
        "User",
        back_populates="pcap_uploads",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<PCAPUpload(id={self.id}, filename={self.filename}, status={self.status})>"
