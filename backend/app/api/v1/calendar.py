"""Calendar API endpoints."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.calendar import (
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse, CalendarEventListResponse
)
from app.repositories.calendar import CalendarRepository
from app.services.calendar import CalendarService

router = APIRouter(prefix="/v1/calendar", tags=["Calendar"])


def get_calendar_service(db: AsyncSession = Depends(get_db)) -> CalendarService:
    """Dependency to get calendar service."""
    repository = CalendarRepository(db)
    return CalendarService(repository)


@router.get("/events", response_model=CalendarEventListResponse)
async def list_events(
    start_date: date = Query(..., description="Start date (inclusive)"),
    end_date: date = Query(..., description="End date (inclusive)"),
    current_user: User = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service)
):
    """List events in date range."""
    return await service.list_events(current_user.id, start_date, end_date)


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service)
):
    """Create event (single or recurring)."""
    return await service.create_event(current_user.id, data)


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service)
):
    """Get specific event."""
    return await service.get_event(event_id, current_user.id)


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: UUID,
    data: CalendarEventUpdate,
    update_scope: str = Query("single", regex="^(single|future|all)$"),
    current_user: User = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service)
):
    """Update event (single, future, or all in series)."""
    return await service.update_event(event_id, current_user.id, data, update_scope)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: UUID,
    delete_scope: str = Query("single", regex="^(single|future|all)$"),
    current_user: User = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service)
):
    """Delete event (single, future, or all in series)."""
    await service.delete_event(event_id, current_user.id, delete_scope)
