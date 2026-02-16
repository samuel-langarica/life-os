"""Project schemas for request/response validation."""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enum."""
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# Project schemas
class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=50)
    objective: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    objective: Optional[str] = None


class ProjectResponse(ProjectBase):
    """Schema for project response."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Task schemas
class TaskBase(BaseModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.BACKLOG


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    sort_order: Optional[int] = None


class TaskMoveRequest(BaseModel):
    """Schema for moving a task to a different status."""
    new_status: TaskStatus
    sort_order: int = Field(..., ge=0)


class TaskReorderRequest(BaseModel):
    """Schema for reordering tasks within a status column."""
    status: TaskStatus
    task_order: list[UUID] = Field(..., min_length=1)


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: UUID
    project_id: UUID
    sort_order: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Note schemas
class NoteBase(BaseModel):
    """Base note schema."""
    content: str = Field(..., min_length=1)


class NoteCreate(NoteBase):
    """Schema for creating a note."""
    pass


class NoteUpdate(NoteBase):
    """Schema for updating a note."""
    pass


class NoteResponse(NoteBase):
    """Schema for note response."""
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Combined response
class TasksByStatus(BaseModel):
    """Tasks grouped by status."""
    in_progress: list[TaskResponse] = []
    backlog: list[TaskResponse] = []
    completed: list[TaskResponse] = []


class ProjectDetailResponse(ProjectResponse):
    """Detailed project response with tasks and notes."""
    tasks: TasksByStatus
    notes: list[NoteResponse]


class ProjectListResponse(BaseModel):
    """Schema for list of projects."""
    projects: list[ProjectDetailResponse]
    total: int


class TaskCountsResponse(BaseModel):
    """Task counts by status."""
    in_progress: int = 0
    backlog: int = 0
    completed: int = 0


class ProjectSummaryResponse(BaseModel):
    """Lightweight project summary for dashboard."""
    id: UUID
    name: str
    slug: str
    objective: Optional[str]
    task_counts: TaskCountsResponse

    class Config:
        from_attributes = True


class ClearCompletedResponse(BaseModel):
    """Response for clearing completed tasks."""
    deleted_count: int
