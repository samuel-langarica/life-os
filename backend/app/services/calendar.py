"""Calendar service for business logic."""
from app.repositories.calendar import CalendarRepository
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate
from uuid import UUID, uuid4
from datetime import date, timedelta
from app.exceptions import NotFoundError


class CalendarService:
    """Service layer for calendar operations."""

    def __init__(self, repository: CalendarRepository):
        self.repository = repository

    async def create_event(self, user_id: UUID, data: CalendarEventCreate):
        """Create event(s). If recurring, creates multiple instances."""
        if not data.is_recurring:
            # Single event
            return await self.repository.create(
                user_id=user_id,
                title=data.title,
                description=data.description,
                event_date=data.event_date,
                start_time=data.start_time,
                end_time=data.end_time,
                is_recurring=False
            )

        # Recurring event - create all instances
        series_id = uuid4()
        events = []

        # Convert recurrence_days list to comma-separated string
        recurrence_days_str = ",".join(map(str, data.recurrence_days)) if data.recurrence_days else None

        current_date = data.event_date
        end_date = data.recurrence_end_date or (current_date + timedelta(days=365))

        while current_date <= end_date:
            weekday = current_date.isoweekday()  # 1=Monday, 7=Sunday

            if data.recurrence_days and weekday in data.recurrence_days:
                event = await self.repository.create(
                    user_id=user_id,
                    title=data.title,
                    description=data.description,
                    event_date=current_date,
                    start_time=data.start_time,
                    end_time=data.end_time,
                    is_recurring=True,
                    recurrence_pattern=data.recurrence_pattern,
                    recurrence_end_date=data.recurrence_end_date,
                    recurrence_days=recurrence_days_str,
                    series_id=series_id
                )
                events.append(event)

            current_date += timedelta(days=1)

        return events[0] if events else None

    async def get_event(self, event_id: UUID, user_id: UUID):
        """Get a specific calendar event."""
        event = await self.repository.get_by_id(event_id, user_id)
        if not event:
            raise NotFoundError("Event not found")
        return event

    async def list_events(self, user_id: UUID, start_date: date, end_date: date):
        """List events in a date range."""
        events = await self.repository.get_by_date_range(user_id, start_date, end_date)
        return {
            "events": events,
            "total": len(events)
        }

    async def update_event(
        self,
        event_id: UUID,
        user_id: UUID,
        data: CalendarEventUpdate,
        update_scope: str = "single"  # single, future, all
    ):
        """Update event. If recurring, handles scope (single/future/all)."""
        event = await self.get_event(event_id, user_id)

        if not event.is_recurring or update_scope == "single":
            # Update single event
            if data.title is not None:
                event.title = data.title
            if data.description is not None:
                event.description = data.description
            if data.event_date is not None:
                event.event_date = data.event_date
            if data.start_time is not None:
                event.start_time = data.start_time
            if data.end_time is not None:
                event.end_time = data.end_time

            return await self.repository.update(event)

        # Update recurring series
        series_events = await self.repository.get_by_series_id(event.series_id, user_id)

        if update_scope == "all":
            # Update all events in series
            for e in series_events:
                if data.title is not None:
                    e.title = data.title
                if data.description is not None:
                    e.description = data.description
                if data.start_time is not None:
                    e.start_time = data.start_time
                if data.end_time is not None:
                    e.end_time = data.end_time
                await self.repository.update(e)

        elif update_scope == "future":
            # Update this and all future events
            for e in series_events:
                if e.event_date >= event.event_date:
                    if data.title is not None:
                        e.title = data.title
                    if data.description is not None:
                        e.description = data.description
                    if data.start_time is not None:
                        e.start_time = data.start_time
                    if data.end_time is not None:
                        e.end_time = data.end_time
                    await self.repository.update(e)

        return event

    async def delete_event(
        self,
        event_id: UUID,
        user_id: UUID,
        delete_scope: str = "single"  # single, future, all
    ):
        """Delete event. If recurring, handles scope."""
        event = await self.get_event(event_id, user_id)

        if not event.is_recurring or delete_scope == "single":
            await self.repository.delete(event)
            return

        series_events = await self.repository.get_by_series_id(event.series_id, user_id)

        if delete_scope == "all":
            await self.repository.delete_many(series_events)
        elif delete_scope == "future":
            future_events = [e for e in series_events if e.event_date >= event.event_date]
            await self.repository.delete_many(future_events)
