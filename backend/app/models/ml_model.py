"""
ThreatMatrix AI — ML Model Registry
SQLAlchemy ORM model for the ml_models table.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MLModel(Base, TimestampMixin):
    """
    ML Model registry for tracking trained models.
    
    Model types: isolation_forest, random_forest, autoencoder
    Status: training, active, retired, failed
    """
    
    __tablename__ = "ml_models"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique model identifier"
    )
    
    # Model Identity
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Model name (e.g., isolation_forest_v1)"
    )
    
    model_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Model type: isolation_forest, random_forest, autoencoder"
    )
    
    version: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Model version"
    )
    
    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="training",
        index=True,
        comment="Status: training, active, retired, failed"
    )
    
    # Training Data
    dataset: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Training dataset: NSL-KDD, CICIDS2017"
    )
    
    # Performance Metrics
    metrics: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Performance metrics: {accuracy, precision, recall, f1, auc, confusion_matrix}"
    )
    
    hyperparams: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Training hyperparameters"
    )
    
    # Model Storage
    file_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Path to serialized model file"
    )
    
    # Performance
    training_time: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Training time in seconds"
    )
    
    inference_time: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Average inference time in milliseconds"
    )
    
    # Active Flag
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Whether this model is currently used for inference"
    )
    
    # Training Timestamp
    trained_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when training completed"
    )
    
    def __repr__(self) -> str:
        return f"<MLModel(name={self.name}, type={self.model_type}, version={self.version}, status={self.status})>"
