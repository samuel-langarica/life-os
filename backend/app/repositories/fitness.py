"""Fitness repository for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, distinct, delete
from sqlalchemy.orm import selectinload
from app.models.fitness import (
    Exercise, WorkoutProgram, ProgramExercise,
    WorkoutSession, WorkoutLog, SessionStatus
)
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional


class FitnessRepository:
    """Repository for all fitness database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Exercises ──

    async def list_exercises(
        self,
        user_id: UUID,
        muscle_group: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Exercise]:
        query = select(Exercise).where(Exercise.user_id == user_id)
        if muscle_group:
            query = query.where(Exercise.muscle_group == muscle_group)
        if search:
            query = query.where(Exercise.name.ilike(f"%{search}%"))
        query = query.order_by(Exercise.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_exercise(self, exercise_id: UUID, user_id: UUID) -> Optional[Exercise]:
        result = await self.db.execute(
            select(Exercise).where(
                and_(Exercise.id == exercise_id, Exercise.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_exercise_by_name(self, name: str, user_id: UUID) -> Optional[Exercise]:
        result = await self.db.execute(
            select(Exercise).where(
                and_(Exercise.name == name, Exercise.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    async def create_exercise(self, user_id: UUID, **kwargs) -> Exercise:
        exercise = Exercise(user_id=user_id, **kwargs)
        self.db.add(exercise)
        await self.db.commit()
        await self.db.refresh(exercise)
        return exercise

    async def update_exercise(self, exercise: Exercise) -> Exercise:
        await self.db.commit()
        await self.db.refresh(exercise)
        return exercise

    async def delete_exercise(self, exercise: Exercise) -> None:
        await self.db.delete(exercise)
        await self.db.commit()

    async def count_exercise_program_usage(self, exercise_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(distinct(ProgramExercise.program_id))).where(
                ProgramExercise.exercise_id == exercise_id
            )
        )
        return result.scalar() or 0

    # ── Programs ──

    async def list_programs(self, user_id: UUID) -> list[WorkoutProgram]:
        result = await self.db.execute(
            select(WorkoutProgram)
            .where(WorkoutProgram.user_id == user_id)
            .options(selectinload(WorkoutProgram.program_exercises))
            .order_by(WorkoutProgram.created_at)
        )
        return list(result.scalars().all())

    async def get_program(
        self,
        program_id: UUID,
        user_id: UUID,
        load_exercises: bool = False,
    ) -> Optional[WorkoutProgram]:
        query = select(WorkoutProgram).where(
            and_(
                WorkoutProgram.id == program_id,
                WorkoutProgram.user_id == user_id,
            )
        )
        if load_exercises:
            query = query.options(
                selectinload(WorkoutProgram.program_exercises)
                .selectinload(ProgramExercise.exercise)
            )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_active_program(self, user_id: UUID) -> Optional[WorkoutProgram]:
        result = await self.db.execute(
            select(WorkoutProgram)
            .where(
                and_(
                    WorkoutProgram.user_id == user_id,
                    WorkoutProgram.is_active == True,
                )
            )
            .options(
                selectinload(WorkoutProgram.program_exercises)
                .selectinload(ProgramExercise.exercise)
            )
        )
        return result.scalar_one_or_none()

    async def create_program(self, user_id: UUID, **kwargs) -> WorkoutProgram:
        program = WorkoutProgram(user_id=user_id, **kwargs)
        self.db.add(program)
        await self.db.commit()
        await self.db.refresh(program)
        return program

    async def update_program(self, program: WorkoutProgram) -> WorkoutProgram:
        await self.db.commit()
        await self.db.refresh(program)
        return program

    async def deactivate_all_programs(self, user_id: UUID) -> None:
        result = await self.db.execute(
            select(WorkoutProgram).where(
                and_(
                    WorkoutProgram.user_id == user_id,
                    WorkoutProgram.is_active == True,
                )
            )
        )
        for program in result.scalars().all():
            program.is_active = False

    async def delete_program(self, program: WorkoutProgram) -> None:
        await self.db.delete(program)
        await self.db.commit()

    # ── Program Exercises ──

    async def get_program_exercise(
        self,
        entry_id: UUID,
        program_id: UUID,
    ) -> Optional[ProgramExercise]:
        result = await self.db.execute(
            select(ProgramExercise)
            .where(
                and_(
                    ProgramExercise.id == entry_id,
                    ProgramExercise.program_id == program_id,
                )
            )
            .options(selectinload(ProgramExercise.exercise))
        )
        return result.scalar_one_or_none()

    async def create_program_exercise(self, **kwargs) -> ProgramExercise:
        pe = ProgramExercise(**kwargs)
        self.db.add(pe)
        await self.db.commit()
        await self.db.refresh(pe, ["exercise"])
        return pe

    async def update_program_exercise(self, pe: ProgramExercise) -> ProgramExercise:
        await self.db.commit()
        await self.db.refresh(pe, ["exercise"])
        return pe

    async def delete_program_exercise(self, pe: ProgramExercise) -> None:
        await self.db.delete(pe)
        await self.db.commit()

    async def reorder_program_exercises(
        self,
        program_id: UUID,
        day_label: str,
        ordered_ids: list[UUID],
    ) -> None:
        for idx, pe_id in enumerate(ordered_ids):
            result = await self.db.execute(
                select(ProgramExercise).where(
                    and_(
                        ProgramExercise.id == pe_id,
                        ProgramExercise.program_id == program_id,
                        ProgramExercise.day_label == day_label,
                    )
                )
            )
            pe = result.scalar_one_or_none()
            if pe:
                pe.sort_order = idx
        await self.db.commit()

    # ── Workout Sessions ──

    async def get_active_session(self, user_id: UUID) -> Optional[WorkoutSession]:
        result = await self.db.execute(
            select(WorkoutSession)
            .where(
                and_(
                    WorkoutSession.user_id == user_id,
                    WorkoutSession.status == SessionStatus.IN_PROGRESS.value,
                )
            )
            .options(
                selectinload(WorkoutSession.logs).selectinload(WorkoutLog.exercise),
                selectinload(WorkoutSession.program)
                .selectinload(WorkoutProgram.program_exercises)
                .selectinload(ProgramExercise.exercise),
            )
        )
        return result.scalar_one_or_none()

    async def get_session(
        self,
        session_id: UUID,
        user_id: UUID,
    ) -> Optional[WorkoutSession]:
        result = await self.db.execute(
            select(WorkoutSession)
            .where(
                and_(
                    WorkoutSession.id == session_id,
                    WorkoutSession.user_id == user_id,
                )
            )
            .options(
                selectinload(WorkoutSession.logs).selectinload(WorkoutLog.exercise),
                selectinload(WorkoutSession.program),
            )
        )
        return result.scalar_one_or_none()

    async def create_session(self, user_id: UUID, **kwargs) -> WorkoutSession:
        session = WorkoutSession(user_id=user_id, **kwargs)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def update_session(self, session: WorkoutSession) -> WorkoutSession:
        await self.db.commit()
        await self.db.refresh(session)
        return session

    # ── Workout Logs ──

    async def create_log(self, **kwargs) -> WorkoutLog:
        log = WorkoutLog(**kwargs)
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get_session_logs(self, session_id: UUID) -> list[WorkoutLog]:
        result = await self.db.execute(
            select(WorkoutLog)
            .where(WorkoutLog.session_id == session_id)
            .options(selectinload(WorkoutLog.exercise))
            .order_by(WorkoutLog.exercise_id, WorkoutLog.set_number)
        )
        return list(result.scalars().all())

    # ── History ──

    async def list_sessions(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[WorkoutSession], int]:
        base = select(WorkoutSession).where(
            and_(
                WorkoutSession.user_id == user_id,
                WorkoutSession.status == SessionStatus.COMPLETED.value,
            )
        )
        if date_from:
            base = base.where(WorkoutSession.started_at >= date_from)
        if date_to:
            base = base.where(WorkoutSession.started_at <= date_to)

        # Count
        count_q = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        # Items
        query = (
            base
            .options(selectinload(WorkoutSession.logs), selectinload(WorkoutSession.program))
            .order_by(WorkoutSession.started_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_week_sessions(
        self,
        user_id: UUID,
        week_start: datetime,
        week_end: datetime,
    ) -> list[WorkoutSession]:
        result = await self.db.execute(
            select(WorkoutSession).where(
                and_(
                    WorkoutSession.user_id == user_id,
                    WorkoutSession.status == SessionStatus.COMPLETED.value,
                    WorkoutSession.started_at >= week_start,
                    WorkoutSession.started_at <= week_end,
                )
            ).order_by(WorkoutSession.started_at)
        )
        return list(result.scalars().all())
