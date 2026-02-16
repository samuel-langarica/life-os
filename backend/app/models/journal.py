"""Journal entry model."""
from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class JournalEntry(Base):
    """Journal entry model for morning pages, daily reflections, and weekly reviews."""
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    entry_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # morning_pages, daily_reflection, weekly_review
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)

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

    def __repr__(self) -> str:
        return f"<JournalEntry(id={self.id}, type={self.entry_type}, date={self.entry_date})>"
