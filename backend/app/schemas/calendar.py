"""Calendar schemas for validation and serialization."""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date, time
from uuid import UUID
from typing import Optional


class CalendarEventBase(BaseModel):
    """Base calendar event schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_date: date
    start_time: time
    end_time: time


class CalendarEventCreate(CalendarEventBase):
    """Schema for creating a calendar event."""
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # 'weekly'
    recurrence_end_date: Optional[date] = None
    recurrence_days: Optional[list[int]] = None  # [1, 3, 5] for Mon/Wed/Fri


class CalendarEventUpdate(BaseModel):
    """Schema for updating a calendar event."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    recurrence_end_date: Optional[date] = None


class CalendarEventResponse(CalendarEventBase):
    """Schema for calendar event response."""
    id: UUID
    is_recurring: bool
    recurrence_pattern: Optional[str]
    recurrence_end_date: Optional[date]
    series_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarEventListResponse(BaseModel):
    """Schema for list of calendar events."""
    events: list[CalendarEventResponse]
    total: int
