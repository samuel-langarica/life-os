"""Calendar event models."""
from datetime import datetime, timezone, date, time
from sqlalchemy import String, Boolean, DateTime, Date, Time, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class CalendarEvent(Base):
    """Calendar event model with optional recurring support."""
    __tablename__ = "calendar_events"

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

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Event timing
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    # Recurrence
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recurrence_pattern: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'weekly'
    recurrence_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    series_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # Groups recurring events

    # Days of week for weekly recurrence (comma-separated: "1,3,5" for Mon/Wed/Fri)
    recurrence_days: Mapped[str | None] = mapped_column(String(20), nullable=True)

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
    user: Mapped["User"] = relationship("User", back_populates="calendar_events")

    def __repr__(self) -> str:
        return f"<CalendarEvent(id={self.id}, title={self.title}, date={self.event_date})>"
