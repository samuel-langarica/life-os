"""Fitness schemas for request/response validation."""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal


# Exercise schemas
class ExerciseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    muscle_group: Optional[str] = Field(None, max_length=100)
    demo_url: Optional[str] = None
    notes: Optional[str] = None


class ExerciseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    muscle_group: Optional[str] = Field(None, max_length=100)
    demo_url: Optional[str] = None
    notes: Optional[str] = None


class ExerciseResponse(BaseModel):
    id: UUID
    name: str
    muscle_group: Optional[str] = None
    demo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExerciseListResponse(BaseModel):
    items: list[ExerciseResponse]
    total: int


# Program schemas
class ProgramCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    is_active: bool = False


class ProgramUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProgramResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramListItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    day_labels: list[str]
    exercise_count: int
    created_at: datetime


class ProgramListResponse(BaseModel):
    items: list[ProgramListItem]


# Program Exercise schemas
class ProgramExerciseCreate(BaseModel):
    exercise_id: UUID
    day_label: str = Field(..., min_length=1, max_length=100)
    sort_order: int = Field(0, ge=0)
    target_sets: int = Field(3, ge=1, le=20)
    target_reps_min: int = Field(8, ge=1, le=100)
    target_reps_max: int = Field(12, ge=1, le=100)
    rest_seconds: int = Field(90, ge=0, le=600)


class ProgramExerciseUpdate(BaseModel):
    sort_order: Optional[int] = Field(None, ge=0)
    target_sets: Optional[int] = Field(None, ge=1, le=20)
    target_reps_min: Optional[int] = Field(None, ge=1, le=100)
    target_reps_max: Optional[int] = Field(None, ge=1, le=100)
    rest_seconds: Optional[int] = Field(None, ge=0, le=600)


class ProgramExerciseResponse(BaseModel):
    id: UUID
    exercise: ExerciseResponse
    sort_order: int
    target_sets: int
    target_reps_min: int
    target_reps_max: int
    rest_seconds: int

    class Config:
        from_attributes = True


class ProgramDetailResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    days: dict[str, list[ProgramExerciseResponse]]
    created_at: datetime


class ExerciseReorderRequest(BaseModel):
    day_label: str = Field(..., min_length=1)
    exercise_order: list[UUID] = Field(..., min_length=1)


# Workout Session schemas
class SessionStartRequest(BaseModel):
    program_id: Optional[UUID] = None
    day_label: Optional[str] = None


class SessionExerciseInfo(BaseModel):
    exercise_id: UUID
    exercise_name: str
    target_sets: int
    target_reps_min: int
    target_reps_max: int
    rest_seconds: int


class SessionStartResponse(BaseModel):
    id: UUID
    program_name: Optional[str] = None
    day_label: Optional[str] = None
    status: str
    started_at: datetime
    exercises: list[SessionExerciseInfo]


class SessionActiveResponse(BaseModel):
    id: UUID
    program_name: Optional[str] = None
    day_label: Optional[str] = None
    status: str
    started_at: datetime
    exercises: list[SessionExerciseInfo]
    logs: list["WorkoutLogResponse"]


# Workout Log schemas
class WorkoutLogCreate(BaseModel):
    exercise_id: UUID
    set_number: int = Field(..., ge=1, le=20)
    reps: int = Field(..., ge=0, le=200)
    weight_kg: Optional[Decimal] = None


class WorkoutLogResponse(BaseModel):
    id: UUID
    session_id: UUID
    exercise_id: UUID
    set_number: int
    reps: int
    weight_kg: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionCompleteRequest(BaseModel):
    notes: Optional[str] = None


class ExerciseSummary(BaseModel):
    exercise_name: str
    sets_completed: int
    reps_per_set: list[int]


class SessionCompleteResponse(BaseModel):
    id: UUID
    program_name: Optional[str] = None
    day_label: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: datetime
    duration_seconds: int
    notes: Optional[str] = None
    summary: list[ExerciseSummary]


class SessionCancelResponse(BaseModel):
    id: UUID
    status: str
    message: str


# History
class HistoryItem(BaseModel):
    id: UUID
    program_name: Optional[str] = None
    day_label: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    exercise_count: int


class HistoryResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    per_page: int


# Dashboard summary
class FitnessSummary(BaseModel):
    active_program_name: Optional[str] = None
    active_program_id: Optional[UUID] = None
    next_day_label: Optional[str] = None
    workouts_this_week: list[datetime]
    has_active_session: bool
