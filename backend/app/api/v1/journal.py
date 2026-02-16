"""Journal API endpoints."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date
from typing import Optional

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.journal import (
    EntryType,
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalEntryListResponse,
    JournalStatusResponse
)
from app.repositories.journal import JournalRepository
from app.services.journal import JournalService

router = APIRouter(prefix="/v1/journal", tags=["Journal"])


def get_journal_service(db: AsyncSession = Depends(get_db)) -> JournalService:
    """Dependency to get journal service."""
    repository = JournalRepository(db)
    return JournalService(repository)


@router.get("/entries", response_model=JournalEntryListResponse)
async def list_entries(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    entry_type: Optional[EntryType] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """List journal entries with optional filtering."""
    return await service.list_entries(
        current_user.id, start_date, end_date, entry_type, limit
    )


@router.post("/entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    data: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Create a new journal entry."""
    return await service.create_entry(current_user.id, data)


@router.get("/entries/{entry_id}", response_model=JournalEntryResponse)
async def get_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Get a specific journal entry."""
    return await service.get_entry(entry_id, current_user.id)


@router.get("/entries/type/{entry_type}/date/{entry_date}", response_model=Optional[JournalEntryResponse])
async def get_entry_by_type_date(
    entry_type: EntryType,
    entry_date: date,
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Get a journal entry by type and date."""
    return await service.get_entry_by_type_and_date(
        current_user.id, entry_type, entry_date
    )


@router.patch("/entries/{entry_id}", response_model=JournalEntryResponse)
async def update_entry(
    entry_id: UUID,
    data: JournalEntryUpdate,
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Update a journal entry."""
    return await service.update_entry(entry_id, current_user.id, data)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Delete a journal entry."""
    await service.delete_entry(entry_id, current_user.id)


@router.get("/status", response_model=JournalStatusResponse)
async def get_status(
    current_user: User = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    """Get journal status (streaks, weekly progress)."""
    return await service.get_journal_status(current_user.id)
