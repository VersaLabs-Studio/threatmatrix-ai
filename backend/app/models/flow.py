"""
ThreatMatrix AI — Network Flow Model
SQLAlchemy ORM model for the network_flows table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import BigInteger, Boolean, DateTime, Index, Integer, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class NetworkFlow(Base):
    """
    Network flow record with ML-ready features.
    
    Stores aggregated network flow data with 40+ features for ML inference.
    Each flow represents a bidirectional communication session.
    """
    
    __tablename__ = "network_flows"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique flow identifier"
    )
    
    # Timestamp
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Flow start timestamp"
    )
    
    # 5-Tuple
    src_ip: Mapped[str] = mapped_column(
        INET,
        nullable=False,
        index=True,
        comment="Source IP address"
    )
    
    dst_ip: Mapped[str] = mapped_column(
        INET,
        nullable=False,
        index=True,
        comment="Destination IP address"
    )
    
    src_port: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Source port number"
    )
    
    dst_port: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Destination port number"
    )
    
    protocol: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        comment="IP protocol: 6=TCP, 17=UDP, 1=ICMP"
    )
    
    # Flow Statistics
    duration: Mapped[float | None] = mapped_column(
        nullable=True,
        comment="Flow duration in seconds"
    )
    
    total_bytes: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        comment="Total bytes transferred"
    )
    
    total_packets: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Total packets in flow"
    )
    
    src_bytes: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        comment="Bytes from source to destination"
    )
    
    dst_bytes: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        comment="Bytes from destination to source"
    )
    
    # ML Features
    features: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment="Full 40+ feature vector for ML inference"
    )
    
    # ML Scoring
    anomaly_score: Mapped[float | None] = mapped_column(
        nullable=True,
        index=True,
        comment="ML-assigned anomaly score (0.0-1.0)"
    )
    
    is_anomaly: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Whether flow was classified as anomalous"
    )
    
    ml_model: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="ML model that classified this flow"
    )
    
    label: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Attack type label if classified"
    )
    
    # Source
    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="live",
        comment="Flow source: live, pcap, agent"
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Record creation timestamp"
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_flows_timestamp", "timestamp", postgresql_using="btree", postgresql_ops={"timestamp": "DESC"}),
        Index("idx_flows_anomaly", "is_anomaly", postgresql_where="is_anomaly = true"),
        Index("idx_flows_score", "anomaly_score", postgresql_using="btree", postgresql_ops={"anomaly_score": "DESC"}),
    )
    
    def __repr__(self) -> str:
        return f"<NetworkFlow(id={self.id}, src={self.src_ip}:{self.src_port}, dst={self.dst_ip}:{self.dst_port}, anomaly={self.is_anomaly})>"
