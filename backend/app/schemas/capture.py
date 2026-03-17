"""
ThreatMatrix AI — Capture Pydantic Schemas
Request/response schemas for capture and PCAP endpoints.
"""

from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel, Field


class CaptureSessionResponse(BaseModel):
    """Response schema for capture session data."""
    
    id: UUID
    interface: str | None = None
    status: str
    packets_total: int
    flows_total: int
    anomalies_total: int
    started_at: datetime
    stopped_at: datetime | None = None
    config: dict[str, Any] | None = None


class CaptureStartRequest(BaseModel):
    """Request schema for starting capture."""
    
    interface: str = Field(description="Network interface to capture on")
    bpf_filter: str | None = Field(default=None, description="BPF filter expression")
    timeout: int | None = Field(default=30, description="Flow timeout in seconds")


class PCAPUploadResponse(BaseModel):
    """Response schema for PCAP upload."""
    
    id: UUID
    filename: str
    file_size: int | None = None
    file_path: str | None = None
    status: str
    packets_count: int | None = None
    flows_extracted: int | None = None
    anomalies_found: int | None = None
    uploaded_by: UUID | None = None
    processed_at: datetime | None = None
    created_at: datetime
