"""Captures API endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, require_api_key
from app.models.user import User
from app.schemas.capture import (
    CaptureCreate, CaptureUpdate, CaptureResponse, CaptureListResponse
)
from app.repositories.capture import CaptureRepository
from app.services.capture import CaptureService

router = APIRouter(prefix="/v1/captures", tags=["Captures"])


def get_capture_service(db: AsyncSession = Depends(get_db)) -> CaptureService:
    """Dependency to get capture service."""
    repository = CaptureRepository(db)
    return CaptureService(repository)


# User-facing endpoints (cookie auth)
@router.get("", response_model=CaptureListResponse)
async def list_captures(
    include_processed: bool = True,
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """List all captures for the current user."""
    result = await service.list_captures(current_user.id, include_processed)
    return result


@router.post("", response_model=CaptureResponse, status_code=status.HTTP_201_CREATED)
async def create_capture(
    data: CaptureCreate,
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """Create a new capture."""
    return await service.create_capture(current_user.id, data)


@router.get("/count")
async def get_inbox_count(
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """Get count of unprocessed captures."""
    count = await service.get_inbox_count(current_user.id)
    return {"count": count}


@router.get("/{capture_id}", response_model=CaptureResponse)
async def get_capture(
    capture_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """Get a specific capture."""
    return await service.get_capture(capture_id, current_user.id)


@router.patch("/{capture_id}", response_model=CaptureResponse)
async def update_capture(
    capture_id: UUID,
    data: CaptureUpdate,
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """Update a capture."""
    return await service.update_capture(capture_id, current_user.id, data)


@router.delete("/{capture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_capture(
    capture_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CaptureService = Depends(get_capture_service)
):
    """Delete a capture."""
    await service.delete_capture(capture_id, current_user.id)


# External API endpoint (Bearer token auth for Siri Shortcuts)
@router.post("/external", response_model=CaptureResponse, status_code=status.HTTP_201_CREATED)
async def create_capture_external(
    data: CaptureCreate,
    user: User = Depends(require_api_key),
    service: CaptureService = Depends(get_capture_service)
):
    """
    External API endpoint for Siri Shortcuts and other integrations.
    Requires Bearer token authentication.
    """
    return await service.create_capture(user.id, data)
