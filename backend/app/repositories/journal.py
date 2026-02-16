"""Journal repository for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from app.models.journal import JournalEntry
from app.schemas.journal import EntryType
from uuid import UUID
from datetime import date, timedelta
from typing import Optional


class JournalRepository:
    """Repository for journal entry database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        entry_type: str,
        entry_date: date,
        content: dict
    ) -> JournalEntry:
        """Create a new journal entry."""
        entry = JournalEntry(
            user_id=user_id,
            entry_type=entry_type,
            entry_date=entry_date,
            content=content
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def get_by_id(self, entry_id: UUID, user_id: UUID) -> Optional[JournalEntry]:
        """Get a journal entry by ID."""
        result = await self.db.execute(
            select(JournalEntry).where(
                and_(
                    JournalEntry.id == entry_id,
                    JournalEntry.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_by_type_and_date(
        self,
        user_id: UUID,
        entry_type: str,
        entry_date: date
    ) -> Optional[JournalEntry]:
        """Get an entry by type and date."""
        result = await self.db.execute(
            select(JournalEntry).where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.entry_type == entry_type,
                    JournalEntry.entry_date == entry_date
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_by_date_range(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date,
        entry_type: Optional[str] = None
    ) -> list[JournalEntry]:
        """List entries within a date range."""
        query = select(JournalEntry).where(
            and_(
                JournalEntry.user_id == user_id,
                JournalEntry.entry_date >= start_date,
                JournalEntry.entry_date <= end_date
            )
        )

        if entry_type:
            query = query.where(JournalEntry.entry_type == entry_type)

        query = query.order_by(desc(JournalEntry.entry_date))

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_recent(
        self,
        user_id: UUID,
        limit: int = 50
    ) -> list[JournalEntry]:
        """List recent entries."""
        result = await self.db.execute(
            select(JournalEntry)
            .where(JournalEntry.user_id == user_id)
            .order_by(desc(JournalEntry.entry_date))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, entry: JournalEntry) -> JournalEntry:
        """Update a journal entry."""
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def delete(self, entry: JournalEntry) -> None:
        """Delete a journal entry."""
        await self.db.delete(entry)
        await self.db.commit()

    async def calculate_streak(
        self,
        user_id: UUID,
        entry_type: str
    ) -> int:
        """Calculate consecutive days with entries of this type."""
        today = date.today()
        streak = 0
        current_date = today

        # Check backwards from today
        while True:
            entry = await self.get_by_type_and_date(user_id, entry_type, current_date)
            if entry:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break

        return streak

    async def count_entries_in_range(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date
    ) -> int:
        """Count entries in a date range."""
        result = await self.db.execute(
            select(func.count(JournalEntry.id)).where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.entry_date >= start_date,
                    JournalEntry.entry_date <= end_date
                )
            )
        )
        return result.scalar_one()
