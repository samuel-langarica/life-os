"""Fitness models for workout tracking."""
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Integer, SmallInteger, DateTime, ForeignKey, Text, Boolean, Numeric, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from app.database import Base


class SessionStatus(str, enum.Enum):
    """Workout session status."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Exercise(Base):
    """Global exercise catalog."""
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    muscle_group: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    demo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="exercises")
    program_exercises: Mapped[list["ProgramExercise"]] = relationship(
        "ProgramExercise",
        back_populates="exercise",
        cascade="all, delete-orphan"
    )
    workout_logs: Mapped[list["WorkoutLog"]] = relationship(
        "WorkoutLog",
        back_populates="exercise",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_exercises_user_name"),
    )

    def __repr__(self) -> str:
        return f"<Exercise(id={self.id}, name={self.name})>"


class WorkoutProgram(Base):
    """Named workout program."""
    __tablename__ = "workout_programs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workout_programs")
    program_exercises: Mapped[list["ProgramExercise"]] = relationship(
        "ProgramExercise",
        back_populates="program",
        cascade="all, delete-orphan",
        order_by="ProgramExercise.sort_order"
    )
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        "WorkoutSession",
        back_populates="program"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_workout_programs_user_name"),
    )

    def __repr__(self) -> str:
        return f"<WorkoutProgram(id={self.id}, name={self.name}, active={self.is_active})>"


class ProgramExercise(Base):
    """Junction table linking exercises to programs."""
    __tablename__ = "program_exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_programs.id", ondelete="CASCADE"),
        nullable=False
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercises.id", ondelete="RESTRICT"),
        nullable=False
    )

    day_label: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    target_sets: Mapped[int] = mapped_column(SmallInteger, default=3, nullable=False)
    target_reps_min: Mapped[int] = mapped_column(SmallInteger, default=8, nullable=False)
    target_reps_max: Mapped[int] = mapped_column(SmallInteger, default=12, nullable=False)
    rest_seconds: Mapped[int] = mapped_column(SmallInteger, default=90, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    program: Mapped["WorkoutProgram"] = relationship("WorkoutProgram", back_populates="program_exercises")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="program_exercises")

    __table_args__ = (
        UniqueConstraint("program_id", "exercise_id", "day_label", name="uq_program_exercise_day"),
        CheckConstraint("target_sets BETWEEN 1 AND 20", name="ck_target_sets"),
        CheckConstraint("target_reps_min BETWEEN 1 AND 100", name="ck_target_reps_min"),
        CheckConstraint("target_reps_max BETWEEN 1 AND 100", name="ck_target_reps_max"),
        CheckConstraint("target_reps_max >= target_reps_min", name="ck_reps_max_gte_min"),
        CheckConstraint("rest_seconds BETWEEN 0 AND 600", name="ck_rest_seconds"),
        Index("idx_program_exercises_program_day", "program_id", "day_label", "sort_order"),
    )

    def __repr__(self) -> str:
        return f"<ProgramExercise(id={self.id}, day={self.day_label})>"


class WorkoutSession(Base):
    """Records each workout session."""
    __tablename__ = "workout_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    program_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_programs.id", ondelete="SET NULL"),
        nullable=True
    )

    day_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        String(20),
        default=SessionStatus.IN_PROGRESS,
        nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workout_sessions")
    program: Mapped["WorkoutProgram | None"] = relationship("WorkoutProgram", back_populates="workout_sessions")
    logs: Mapped[list["WorkoutLog"]] = relationship(
        "WorkoutLog",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkoutLog.created_at"
    )

    __table_args__ = (
        Index("idx_workout_sessions_user_date", "user_id", started_at.desc()),
        Index("idx_workout_sessions_in_progress", "status", postgresql_where=(status == SessionStatus.IN_PROGRESS.value)),
    )

    def __repr__(self) -> str:
        return f"<WorkoutSession(id={self.id}, status={self.status})>"


class WorkoutLog(Base):
    """Individual set logs within a workout session."""
    __tablename__ = "workout_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercises.id", ondelete="RESTRICT"),
        nullable=False
    )

    set_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    reps: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    session: Mapped["WorkoutSession"] = relationship("WorkoutSession", back_populates="logs")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="workout_logs")

    __table_args__ = (
        UniqueConstraint("session_id", "exercise_id", "set_number", name="uq_workout_log_set"),
        CheckConstraint("set_number BETWEEN 1 AND 20", name="ck_set_number"),
        CheckConstraint("reps BETWEEN 0 AND 200", name="ck_reps"),
        Index("idx_workout_logs_session", "session_id"),
        Index("idx_workout_logs_exercise", "exercise_id", created_at.desc()),
    )

    def __repr__(self) -> str:
        return f"<WorkoutLog(id={self.id}, set={self.set_number}, reps={self.reps})>"
