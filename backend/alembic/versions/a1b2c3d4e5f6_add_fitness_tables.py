"""add_fitness_tables

Revision ID: a1b2c3d4e5f6
Revises: e0cd2c3c631c
Create Date: 2026-02-16 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e0cd2c3c631c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Exercises
    op.create_table('exercises',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('muscle_group', sa.String(length=100), nullable=True),
        sa.Column('demo_url', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_exercises_user_name'),
    )
    op.create_index('ix_exercises_muscle_group', 'exercises', ['muscle_group'])

    # Workout Programs
    op.create_table('workout_programs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_workout_programs_user_name'),
    )

    # Program Exercises
    op.create_table('program_exercises',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('program_id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('day_label', sa.String(length=100), nullable=False),
        sa.Column('sort_order', sa.SmallInteger(), nullable=False, server_default='0'),
        sa.Column('target_sets', sa.SmallInteger(), nullable=False, server_default='3'),
        sa.Column('target_reps_min', sa.SmallInteger(), nullable=False, server_default='8'),
        sa.Column('target_reps_max', sa.SmallInteger(), nullable=False, server_default='12'),
        sa.Column('rest_seconds', sa.SmallInteger(), nullable=False, server_default='90'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['program_id'], ['workout_programs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('program_id', 'exercise_id', 'day_label', name='uq_program_exercise_day'),
        sa.CheckConstraint('target_sets BETWEEN 1 AND 20', name='ck_target_sets'),
        sa.CheckConstraint('target_reps_min BETWEEN 1 AND 100', name='ck_target_reps_min'),
        sa.CheckConstraint('target_reps_max BETWEEN 1 AND 100', name='ck_target_reps_max'),
        sa.CheckConstraint('target_reps_max >= target_reps_min', name='ck_reps_max_gte_min'),
        sa.CheckConstraint('rest_seconds BETWEEN 0 AND 600', name='ck_rest_seconds'),
    )
    op.create_index('idx_program_exercises_program_day', 'program_exercises', ['program_id', 'day_label', 'sort_order'])

    # Workout Sessions
    op.create_table('workout_sessions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('program_id', sa.UUID(), nullable=True),
        sa.Column('day_label', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='in_progress'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['program_id'], ['workout_programs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_workout_sessions_user_date', 'workout_sessions', ['user_id', sa.text('started_at DESC')])

    # Workout Logs
    op.create_table('workout_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('set_number', sa.SmallInteger(), nullable=False),
        sa.Column('reps', sa.SmallInteger(), nullable=False),
        sa.Column('weight_kg', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'exercise_id', 'set_number', name='uq_workout_log_set'),
        sa.CheckConstraint('set_number BETWEEN 1 AND 20', name='ck_set_number'),
        sa.CheckConstraint('reps BETWEEN 0 AND 200', name='ck_reps'),
    )
    op.create_index('idx_workout_logs_session', 'workout_logs', ['session_id'])
    op.create_index('idx_workout_logs_exercise', 'workout_logs', ['exercise_id', sa.text('created_at DESC')])


def downgrade() -> None:
    op.drop_index('idx_workout_logs_exercise', table_name='workout_logs')
    op.drop_index('idx_workout_logs_session', table_name='workout_logs')
    op.drop_table('workout_logs')
    op.drop_index('idx_workout_sessions_user_date', table_name='workout_sessions')
    op.drop_table('workout_sessions')
    op.drop_index('idx_program_exercises_program_day', table_name='program_exercises')
    op.drop_table('program_exercises')
    op.drop_table('workout_programs')
    op.drop_index('ix_exercises_muscle_group', table_name='exercises')
    op.drop_table('exercises')
