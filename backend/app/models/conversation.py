"""
ThreatMatrix AI — LLM Conversation Model
SQLAlchemy ORM model for the llm_conversations table.
"""

from uuid import uuid4

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class LLMConversation(Base, TimestampMixin):
    """
    LLM conversation history for AI Analyst.
    
    Context types: alert_analysis, threat_hunt, report, general
    Providers: deepseek, glm, groq
    """
    
    __tablename__ = "llm_conversations"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique conversation identifier"
    )
    
    # User Reference
    user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="User ID who initiated the conversation"
    )
    
    # Messages
    messages: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        comment="Message history: [{role, content, timestamp}]"
    )
    
    # Context
    context_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="Context type: alert_analysis, threat_hunt, report, general"
    )
    
    context_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="Related entity ID (alert, flow, report)"
    )
    
    # Usage Tracking
    tokens_used: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Total tokens used"
    )
    
    cost_usd: Mapped[float | None] = mapped_column(
        nullable=True,
        comment="Cost in USD"
    )
    
    provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="LLM provider: deepseek, glm, groq"
    )
    
    # Relationships
    user = relationship(
        "User",
        back_populates="llm_conversations",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<LLMConversation(id={self.id}, user_id={self.user_id}, context_type={self.context_type})>"
