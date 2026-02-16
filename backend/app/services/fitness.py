"""Fitness service layer for business logic."""
from app.repositories.fitness import FitnessRepository
from app.schemas.fitness import (
    ExerciseCreate, ExerciseUpdate,
    ProgramCreate, ProgramUpdate,
    ProgramExerciseCreate, ProgramExerciseUpdate,
    SessionStartRequest, SessionCompleteRequest,
    WorkoutLogCreate,
    ExerciseResponse, ExerciseListResponse,
    ProgramListItem, ProgramListResponse,
    ProgramExerciseResponse, ProgramDetailResponse,
    SessionStartResponse, SessionActiveResponse, SessionExerciseInfo,
    SessionCompleteResponse, SessionCancelResponse,
    WorkoutLogResponse, ExerciseSummary,
    HistoryItem, HistoryResponse,
    FitnessSummary,
)
from app.exceptions import NotFoundError, DuplicateEntryError, ConflictError, ValidationError
from app.models.fitness import SessionStatus
from uuid import UUID
from datetime import datetime, timezone, timedelta
from collections import defaultdict


class FitnessService:
    """Service for fitness business logic."""

    def __init__(self, repository: FitnessRepository):
        self.repo = repository

    # ── Exercises ──

    async def list_exercises(self, user_id: UUID, muscle_group=None, search=None):
        exercises = await self.repo.list_exercises(user_id, muscle_group, search)
        return ExerciseListResponse(
            items=[ExerciseResponse.model_validate(e) for e in exercises],
            total=len(exercises),
        )

    async def create_exercise(self, user_id: UUID, data: ExerciseCreate):
        existing = await self.repo.get_exercise_by_name(data.name, user_id)
        if existing:
            raise DuplicateEntryError(f"Exercise with name '{data.name}' already exists")
        return await self.repo.create_exercise(
            user_id=user_id,
            name=data.name,
            muscle_group=data.muscle_group,
            demo_url=data.demo_url,
            notes=data.notes,
        )

    async def update_exercise(self, exercise_id: UUID, user_id: UUID, data: ExerciseUpdate):
        exercise = await self.repo.get_exercise(exercise_id, user_id)
        if not exercise:
            raise NotFoundError("Exercise not found")
        if data.name is not None and data.name != exercise.name:
            existing = await self.repo.get_exercise_by_name(data.name, user_id)
            if existing:
                raise DuplicateEntryError(f"Exercise with name '{data.name}' already exists")
            exercise.name = data.name
        if data.muscle_group is not None:
            exercise.muscle_group = data.muscle_group
        if data.demo_url is not None:
            exercise.demo_url = data.demo_url
        if data.notes is not None:
            exercise.notes = data.notes
        return await self.repo.update_exercise(exercise)

    async def delete_exercise(self, exercise_id: UUID, user_id: UUID):
        exercise = await self.repo.get_exercise(exercise_id, user_id)
        if not exercise:
            raise NotFoundError("Exercise not found")
        usage_count = await self.repo.count_exercise_program_usage(exercise_id)
        if usage_count > 0:
            raise ConflictError(
                f"Exercise is used in {usage_count} program(s). Remove it from programs first."
            )
        await self.repo.delete_exercise(exercise)

    # ── Programs ──

    async def list_programs(self, user_id: UUID):
        programs = await self.repo.list_programs(user_id)
        items = []
        for p in programs:
            day_labels = sorted(set(pe.day_label for pe in p.program_exercises))
            items.append(ProgramListItem(
                id=p.id,
                name=p.name,
                description=p.description,
                is_active=p.is_active,
                day_labels=day_labels,
                exercise_count=len(p.program_exercises),
                created_at=p.created_at,
            ))
        return ProgramListResponse(items=items)

    async def get_program_detail(self, program_id: UUID, user_id: UUID):
        program = await self.repo.get_program(program_id, user_id, load_exercises=True)
        if not program:
            raise NotFoundError("Program not found")
        return self._build_program_detail(program)

    async def create_program(self, user_id: UUID, data: ProgramCreate):
        if data.is_active:
            await self.repo.deactivate_all_programs(user_id)
        return await self.repo.create_program(
            user_id=user_id,
            name=data.name,
            description=data.description,
            is_active=data.is_active,
        )

    async def update_program(self, program_id: UUID, user_id: UUID, data: ProgramUpdate):
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        if data.is_active is True:
            await self.repo.deactivate_all_programs(user_id)
            program.is_active = True
        elif data.is_active is False:
            program.is_active = False
        if data.name is not None:
            program.name = data.name
        if data.description is not None:
            program.description = data.description
        return await self.repo.update_program(program)

    async def delete_program(self, program_id: UUID, user_id: UUID):
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        await self.repo.delete_program(program)

    # ── Program Exercises ──

    async def add_program_exercise(self, program_id: UUID, user_id: UUID, data: ProgramExerciseCreate):
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        exercise = await self.repo.get_exercise(data.exercise_id, user_id)
        if not exercise:
            raise NotFoundError("Exercise not found")
        if data.target_reps_max < data.target_reps_min:
            raise ValidationError("target_reps_max must be >= target_reps_min")
        return await self.repo.create_program_exercise(
            program_id=program_id,
            exercise_id=data.exercise_id,
            day_label=data.day_label,
            sort_order=data.sort_order,
            target_sets=data.target_sets,
            target_reps_min=data.target_reps_min,
            target_reps_max=data.target_reps_max,
            rest_seconds=data.rest_seconds,
        )

    async def update_program_exercise(
        self, program_id: UUID, entry_id: UUID, user_id: UUID, data: ProgramExerciseUpdate
    ):
        # Verify ownership
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        pe = await self.repo.get_program_exercise(entry_id, program_id)
        if not pe:
            raise NotFoundError("Program exercise entry not found")
        if data.sort_order is not None:
            pe.sort_order = data.sort_order
        if data.target_sets is not None:
            pe.target_sets = data.target_sets
        if data.target_reps_min is not None:
            pe.target_reps_min = data.target_reps_min
        if data.target_reps_max is not None:
            pe.target_reps_max = data.target_reps_max
        if data.rest_seconds is not None:
            pe.rest_seconds = data.rest_seconds
        return await self.repo.update_program_exercise(pe)

    async def delete_program_exercise(self, program_id: UUID, entry_id: UUID, user_id: UUID):
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        pe = await self.repo.get_program_exercise(entry_id, program_id)
        if not pe:
            raise NotFoundError("Program exercise entry not found")
        await self.repo.delete_program_exercise(pe)

    async def reorder_exercises(self, program_id: UUID, user_id: UUID, day_label: str, ordered_ids: list[UUID]):
        program = await self.repo.get_program(program_id, user_id)
        if not program:
            raise NotFoundError("Program not found")
        await self.repo.reorder_program_exercises(program_id, day_label, ordered_ids)

    # ── Workout Sessions ──

    async def start_session(self, user_id: UUID, data: SessionStartRequest):
        # Check no active session
        active = await self.repo.get_active_session(user_id)
        if active:
            raise ConflictError("A workout session is already in progress")

        exercises_info = []
        program_name = None

        if data.program_id and data.day_label:
            program = await self.repo.get_program(data.program_id, user_id, load_exercises=True)
            if not program:
                raise NotFoundError("Program not found")
            program_name = program.name
            for pe in program.program_exercises:
                if pe.day_label == data.day_label:
                    exercises_info.append(SessionExerciseInfo(
                        exercise_id=pe.exercise.id,
                        exercise_name=pe.exercise.name,
                        target_sets=pe.target_sets,
                        target_reps_min=pe.target_reps_min,
                        target_reps_max=pe.target_reps_max,
                        rest_seconds=pe.rest_seconds,
                    ))

        session = await self.repo.create_session(
            user_id=user_id,
            program_id=data.program_id,
            day_label=data.day_label,
            status=SessionStatus.IN_PROGRESS.value,
        )

        return SessionStartResponse(
            id=session.id,
            program_name=program_name,
            day_label=data.day_label,
            status=session.status,
            started_at=session.started_at,
            exercises=exercises_info,
        )

    async def get_active_session(self, user_id: UUID):
        session = await self.repo.get_active_session(user_id)
        if not session:
            raise NotFoundError("No active workout session")

        exercises_info = []
        if session.program and session.day_label:
            for pe in session.program.program_exercises:
                if pe.day_label == session.day_label:
                    exercises_info.append(SessionExerciseInfo(
                        exercise_id=pe.exercise.id,
                        exercise_name=pe.exercise.name,
                        target_sets=pe.target_sets,
                        target_reps_min=pe.target_reps_min,
                        target_reps_max=pe.target_reps_max,
                        rest_seconds=pe.rest_seconds,
                    ))

        return SessionActiveResponse(
            id=session.id,
            program_name=session.program.name if session.program else None,
            day_label=session.day_label,
            status=session.status,
            started_at=session.started_at,
            exercises=exercises_info,
            logs=[WorkoutLogResponse.model_validate(log) for log in session.logs],
        )

    async def log_set(self, session_id: UUID, user_id: UUID, data: WorkoutLogCreate):
        session = await self.repo.get_session(session_id, user_id)
        if not session:
            raise NotFoundError("Workout session not found")
        if session.status != SessionStatus.IN_PROGRESS.value:
            raise ConflictError("Workout session is not in progress")

        log = await self.repo.create_log(
            session_id=session_id,
            exercise_id=data.exercise_id,
            set_number=data.set_number,
            reps=data.reps,
            weight_kg=data.weight_kg,
        )
        return log

    async def complete_session(self, session_id: UUID, user_id: UUID, data: SessionCompleteRequest):
        session = await self.repo.get_session(session_id, user_id)
        if not session:
            raise NotFoundError("Workout session not found")
        if session.status != SessionStatus.IN_PROGRESS.value:
            raise ConflictError("Workout session is not in progress")

        now = datetime.now(timezone.utc)
        session.status = SessionStatus.COMPLETED.value
        session.completed_at = now
        session.duration_seconds = int((now - session.started_at).total_seconds())
        if data.notes:
            session.notes = data.notes
        await self.repo.update_session(session)

        # Build summary
        logs = await self.repo.get_session_logs(session_id)
        summary = self._build_session_summary(logs)

        return SessionCompleteResponse(
            id=session.id,
            program_name=session.program.name if session.program else None,
            day_label=session.day_label,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            duration_seconds=session.duration_seconds,
            notes=session.notes,
            summary=summary,
        )

    async def cancel_session(self, session_id: UUID, user_id: UUID):
        session = await self.repo.get_session(session_id, user_id)
        if not session:
            raise NotFoundError("Workout session not found")
        if session.status != SessionStatus.IN_PROGRESS.value:
            raise ConflictError("Workout session is not in progress")

        session.status = SessionStatus.CANCELLED.value
        await self.repo.update_session(session)

        return SessionCancelResponse(
            id=session.id,
            status=session.status,
            message="Workout session cancelled",
        )

    async def get_history(self, user_id: UUID, page=1, per_page=20, date_from=None, date_to=None):
        sessions, total = await self.repo.list_sessions(
            user_id, page, per_page, date_from, date_to
        )
        items = []
        for s in sessions:
            items.append(HistoryItem(
                id=s.id,
                program_name=s.program.name if s.program else None,
                day_label=s.day_label,
                status=s.status,
                started_at=s.started_at,
                completed_at=s.completed_at,
                duration_seconds=s.duration_seconds,
                exercise_count=len(set(log.exercise_id for log in s.logs)),
            ))
        return HistoryResponse(items=items, total=total, page=page, per_page=per_page)

    async def get_fitness_summary(self, user_id: UUID):
        active_program = await self.repo.get_active_program(user_id)
        active_session = await self.repo.get_active_session(user_id)

        # Week boundaries (Monday-Sunday)
        now = datetime.now(timezone.utc)
        monday = now - timedelta(days=now.weekday())
        week_start = monday.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        week_sessions = await self.repo.get_week_sessions(user_id, week_start, week_end)

        # Determine next day label
        next_day_label = None
        if active_program and active_program.program_exercises:
            day_labels = []
            seen = set()
            for pe in active_program.program_exercises:
                if pe.day_label not in seen:
                    day_labels.append(pe.day_label)
                    seen.add(pe.day_label)

            completed_labels = [s.day_label for s in week_sessions if s.day_label]
            for label in day_labels:
                if label not in completed_labels:
                    next_day_label = label
                    break

        return FitnessSummary(
            active_program_name=active_program.name if active_program else None,
            active_program_id=active_program.id if active_program else None,
            next_day_label=next_day_label,
            workouts_this_week=[s.started_at for s in week_sessions],
            has_active_session=active_session is not None,
        )

    # ── Helpers ──

    def _build_program_detail(self, program) -> ProgramDetailResponse:
        days: dict[str, list] = defaultdict(list)
        for pe in program.program_exercises:
            days[pe.day_label].append(ProgramExerciseResponse(
                id=pe.id,
                exercise=ExerciseResponse.model_validate(pe.exercise),
                sort_order=pe.sort_order,
                target_sets=pe.target_sets,
                target_reps_min=pe.target_reps_min,
                target_reps_max=pe.target_reps_max,
                rest_seconds=pe.rest_seconds,
            ))
        # Sort within each day by sort_order
        for day in days:
            days[day].sort(key=lambda x: x.sort_order)

        return ProgramDetailResponse(
            id=program.id,
            name=program.name,
            description=program.description,
            is_active=program.is_active,
            days=dict(days),
            created_at=program.created_at,
        )

    def _build_session_summary(self, logs) -> list[ExerciseSummary]:
        grouped = defaultdict(list)
        for log in logs:
            grouped[log.exercise.name].append(log.reps)
        return [
            ExerciseSummary(
                exercise_name=name,
                sets_completed=len(reps_list),
                reps_per_set=reps_list,
            )
            for name, reps_list in grouped.items()
        ]
