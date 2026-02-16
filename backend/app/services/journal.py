"""Journal service layer for business logic."""
from app.repositories.journal import JournalRepository
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate, EntryType
from app.models.journal import JournalEntry
from app.exceptions import NotFoundError, DuplicateEntryError
from uuid import UUID
from datetime import date, timedelta
from typing import Optional


class JournalService:
    """Service for journal entry business logic."""

    def __init__(self, repository: JournalRepository):
        self.repository = repository

    async def create_entry(self, user_id: UUID, data: JournalEntryCreate) -> JournalEntry:
        """Create a new journal entry."""
        # Check if entry already exists
        existing = await self.repository.get_by_type_and_date(
            user_id, data.entry_type.value, data.entry_date
        )
        if existing:
            raise DuplicateEntryError(
                f"Entry already exists for {data.entry_type.value} on {data.entry_date}"
            )

        return await self.repository.create(
            user_id=user_id,
            entry_type=data.entry_type.value,
            entry_date=data.entry_date,
            content=data.content
        )

    async def get_entry(self, entry_id: UUID, user_id: UUID) -> JournalEntry:
        """Get a journal entry by ID."""
        entry = await self.repository.get_by_id(entry_id, user_id)
        if not entry:
            raise NotFoundError("Journal entry not found")
        return entry

    async def get_entry_by_type_and_date(
        self,
        user_id: UUID,
        entry_type: EntryType,
        entry_date: date
    ) -> Optional[JournalEntry]:
        """Get an entry by type and date."""
        return await self.repository.get_by_type_and_date(
            user_id, entry_type.value, entry_date
        )

    async def list_entries(
        self,
        user_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        entry_type: Optional[EntryType] = None,
        limit: int = 50
    ) -> dict:
        """List journal entries with optional filtering."""
        if start_date and end_date:
            entries = await self.repository.list_by_date_range(
                user_id,
                start_date,
                end_date,
                entry_type.value if entry_type else None
            )
        else:
            entries = await self.repository.list_recent(user_id, limit)

        return {
            "entries": entries,
            "total": len(entries)
        }

    async def update_entry(
        self,
        entry_id: UUID,
        user_id: UUID,
        data: JournalEntryUpdate
    ) -> JournalEntry:
        """Update a journal entry."""
        entry = await self.get_entry(entry_id, user_id)
        entry.content = data.content
        return await self.repository.update(entry)

    async def delete_entry(self, entry_id: UUID, user_id: UUID) -> None:
        """Delete a journal entry."""
        entry = await self.get_entry(entry_id, user_id)
        await self.repository.delete(entry)

    async def get_journal_status(self, user_id: UUID) -> dict:
        """Get journal status (streaks and weekly progress)."""
        # Calculate streaks
        morning_streak = await self.repository.calculate_streak(
            user_id, EntryType.MORNING_PAGES.value
        )
        reflection_streak = await self.repository.calculate_streak(
            user_id, EntryType.DAILY_REFLECTION.value
        )

        # Check this week's entries
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)  # Sunday

        entries_count = await self.repository.count_entries_in_range(
            user_id, week_start, week_end
        )

        # Check if weekly review completed for this week
        weekly_review = await self.repository.get_by_type_and_date(
            user_id, EntryType.WEEKLY_REVIEW.value, week_start
        )

        return {
            "morning_pages_streak": morning_streak,
            "daily_reflection_streak": reflection_streak,
            "entries_this_week": entries_count,
            "weekly_review_completed": weekly_review is not None
        }
