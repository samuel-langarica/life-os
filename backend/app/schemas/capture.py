"""Capture schemas for validation and serialization."""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


class CaptureBase(BaseModel):
    """Base capture schema."""
    text: str = Field(..., min_length=1, max_length=5000, description="Capture text content")
    source: Optional[str] = Field("manual", description="Source of the capture (manual, siri, shortcut, api)")


class CaptureCreate(CaptureBase):
    """Schema for creating a capture."""
    pass


class CaptureUpdate(BaseModel):
    """Schema for updating a capture."""
    text: Optional[str] = Field(None, min_length=1, max_length=5000)
    processed: Optional[bool] = None
    deleted: Optional[bool] = None


class CaptureResponse(CaptureBase):
    """Schema for capture response."""
    id: UUID
    processed: bool
    deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaptureListResponse(BaseModel):
    """Schema for list of captures."""
    captures: list[CaptureResponse]
    total: int
    unprocessed_count: int
