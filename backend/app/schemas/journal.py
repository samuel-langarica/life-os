"""Journal entry schemas."""
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID
from typing import Dict, Any
from enum import Enum


class EntryType(str, Enum):
    """Journal entry types."""
    MORNING_PAGES = "morning_pages"
    DAILY_REFLECTION = "daily_reflection"
    WEEKLY_REVIEW = "weekly_review"


class MorningPagesContent(BaseModel):
    """Content structure for morning pages."""
    content: str = Field(..., min_length=1, description="Free-form morning pages text")


class DailyReflectionContent(BaseModel):
    """Content structure for daily reflections."""
    went_well: str = Field(default="", description="What went well today")
    improve: str = Field(default="", description="What could be improved")
    grateful: str = Field(default="", description="What am I grateful for")


class WeeklyReviewContent(BaseModel):
    """Content structure for weekly reviews."""
    wins: str = Field(default="", description="Big wins this week")
    challenges: str = Field(default="", description="Challenges faced")
    learnings: str = Field(default="", description="Key learnings")
    focus: str = Field(default="", description="Focus for next week")


class JournalEntryCreate(BaseModel):
    """Schema for creating a journal entry."""
    entry_type: EntryType
    entry_date: date
    content: Dict[str, Any] = Field(..., description="Entry content (structure depends on entry_type)")


class JournalEntryUpdate(BaseModel):
    """Schema for updating a journal entry."""
    content: Dict[str, Any] = Field(..., description="Updated entry content")


class JournalEntryResponse(BaseModel):
    """Schema for journal entry response."""
    id: UUID
    entry_type: EntryType
    entry_date: date
    content: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JournalEntryListResponse(BaseModel):
    """Schema for list of journal entries."""
    entries: list[JournalEntryResponse]
    total: int


class JournalStatusResponse(BaseModel):
    """Schema for journal status (streaks and weekly progress)."""
    morning_pages_streak: int = Field(..., description="Current morning pages streak")
    daily_reflection_streak: int = Field(..., description="Current daily reflection streak")
    entries_this_week: int = Field(..., description="Total entries written this week")
    weekly_review_completed: bool = Field(..., description="Whether this week's review is done")
