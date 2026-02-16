"""Calendar repository for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.calendar import CalendarEvent
from uuid import UUID
from datetime import date, time
from typing import Optional


class CalendarRepository:
    """Repository for CalendarEvent database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        title: str,
        event_date: date,
        start_time: time,
        end_time: time,
        description: Optional[str] = None,
        is_recurring: bool = False,
        recurrence_pattern: Optional[str] = None,
        recurrence_end_date: Optional[date] = None,
        recurrence_days: Optional[str] = None,
        series_id: Optional[UUID] = None
    ) -> CalendarEvent:
        """Create a new calendar event."""
        event = CalendarEvent(
            user_id=user_id,
            title=title,
            description=description,
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern,
            recurrence_end_date=recurrence_end_date,
            recurrence_days=recurrence_days,
            series_id=series_id
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_by_id(self, event_id: UUID, user_id: UUID) -> Optional[CalendarEvent]:
        """Get a calendar event by ID for a specific user."""
        result = await self.db.execute(
            select(CalendarEvent).where(
                and_(
                    CalendarEvent.id == event_id,
                    CalendarEvent.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_by_date_range(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date
    ) -> list[CalendarEvent]:
        """Get all events within a date range for a user."""
        result = await self.db.execute(
            select(CalendarEvent).where(
                and_(
                    CalendarEvent.user_id == user_id,
                    CalendarEvent.event_date >= start_date,
                    CalendarEvent.event_date <= end_date
                )
            ).order_by(CalendarEvent.event_date, CalendarEvent.start_time)
        )
        return list(result.scalars().all())

    async def get_by_series_id(self, series_id: UUID, user_id: UUID) -> list[CalendarEvent]:
        """Get all events in a recurring series."""
        result = await self.db.execute(
            select(CalendarEvent).where(
                and_(
                    CalendarEvent.series_id == series_id,
                    CalendarEvent.user_id == user_id
                )
            ).order_by(CalendarEvent.event_date)
        )
        return list(result.scalars().all())

    async def update(self, event: CalendarEvent) -> CalendarEvent:
        """Update a calendar event."""
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def delete(self, event: CalendarEvent) -> None:
        """Delete a calendar event."""
        await self.db.delete(event)
        await self.db.commit()

    async def delete_many(self, events: list[CalendarEvent]) -> None:
        """Delete multiple calendar events."""
        for event in events:
            await self.db.delete(event)
        await self.db.commit()
