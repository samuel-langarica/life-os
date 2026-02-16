"""Fitness API endpoints."""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.fitness import (
    ExerciseCreate, ExerciseUpdate, ExerciseResponse, ExerciseListResponse,
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramListResponse, ProgramDetailResponse,
    ProgramExerciseCreate, ProgramExerciseUpdate, ProgramExerciseResponse,
    ExerciseReorderRequest,
    SessionStartRequest, SessionStartResponse, SessionActiveResponse,
    WorkoutLogCreate, WorkoutLogResponse,
    SessionCompleteRequest, SessionCompleteResponse, SessionCancelResponse,
    HistoryResponse, FitnessSummary,
)
from app.repositories.fitness import FitnessRepository
from app.services.fitness import FitnessService

router = APIRouter(tags=["Fitness"])


def get_fitness_service(db: AsyncSession = Depends(get_db)) -> FitnessService:
    repository = FitnessRepository(db)
    return FitnessService(repository)


# ── Exercises ──

@router.get("/v1/exercises", response_model=ExerciseListResponse)
async def list_exercises(
    muscle_group: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.list_exercises(current_user.id, muscle_group, search)


@router.post("/v1/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    data: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.create_exercise(current_user.id, data)


@router.patch("/v1/exercises/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: UUID,
    data: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.update_exercise(exercise_id, current_user.id, data)


@router.delete("/v1/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    await service.delete_exercise(exercise_id, current_user.id)


# ── Programs ──

@router.get("/v1/programs", response_model=ProgramListResponse)
async def list_programs(
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.list_programs(current_user.id)


@router.get("/v1/programs/{program_id}", response_model=ProgramDetailResponse)
async def get_program(
    program_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.get_program_detail(program_id, current_user.id)


@router.post("/v1/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    data: ProgramCreate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.create_program(current_user.id, data)


@router.patch("/v1/programs/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: UUID,
    data: ProgramUpdate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.update_program(program_id, current_user.id, data)


@router.delete("/v1/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    await service.delete_program(program_id, current_user.id)


# ── Program Exercises ──

@router.post(
    "/v1/programs/{program_id}/exercises",
    response_model=ProgramExerciseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_program_exercise(
    program_id: UUID,
    data: ProgramExerciseCreate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.add_program_exercise(program_id, current_user.id, data)


@router.patch(
    "/v1/programs/{program_id}/exercises/{entry_id}",
    response_model=ProgramExerciseResponse,
)
async def update_program_exercise(
    program_id: UUID,
    entry_id: UUID,
    data: ProgramExerciseUpdate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.update_program_exercise(program_id, entry_id, current_user.id, data)


@router.delete(
    "/v1/programs/{program_id}/exercises/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_program_exercise(
    program_id: UUID,
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    await service.delete_program_exercise(program_id, entry_id, current_user.id)


@router.put("/v1/programs/{program_id}/exercises/reorder")
async def reorder_exercises(
    program_id: UUID,
    data: ExerciseReorderRequest,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    await service.reorder_exercises(program_id, current_user.id, data.day_label, data.exercise_order)
    return {"message": "Exercises reordered"}


# ── Workout Sessions ──

@router.post("/v1/workouts/sessions", response_model=SessionStartResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    data: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.start_session(current_user.id, data)


@router.get("/v1/workouts/sessions/active", response_model=SessionActiveResponse)
async def get_active_session(
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.get_active_session(current_user.id)


@router.post("/v1/workouts/sessions/{session_id}/logs", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def log_set(
    session_id: UUID,
    data: WorkoutLogCreate,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.log_set(session_id, current_user.id, data)


@router.patch("/v1/workouts/sessions/{session_id}/complete", response_model=SessionCompleteResponse)
async def complete_session(
    session_id: UUID,
    data: SessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.complete_session(session_id, current_user.id, data)


@router.patch("/v1/workouts/sessions/{session_id}/cancel", response_model=SessionCancelResponse)
async def cancel_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.cancel_session(session_id, current_user.id)


# ── History ──

@router.get("/v1/workouts/history", response_model=HistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.get_history(current_user.id, page, per_page, date_from, date_to)


# ── Dashboard Summary ──

@router.get("/v1/workouts/summary", response_model=FitnessSummary)
async def get_fitness_summary(
    current_user: User = Depends(get_current_user),
    service: FitnessService = Depends(get_fitness_service),
):
    return await service.get_fitness_summary(current_user.id)
