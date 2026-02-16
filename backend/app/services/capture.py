"""Capture service for business logic."""
from app.repositories.capture import CaptureRepository
from app.schemas.capture import CaptureCreate, CaptureUpdate
from app.models.capture import Capture
from uuid import UUID
from app.exceptions import NotFoundError


class CaptureService:
    """Service layer for capture operations."""

    def __init__(self, repository: CaptureRepository):
        self.repository = repository

    async def create_capture(self, user_id: UUID, data: CaptureCreate) -> Capture:
        """Create a new capture."""
        return await self.repository.create(
            user_id=user_id,
            text=data.text,
            source=data.source or "manual"
        )

    async def get_capture(self, capture_id: UUID, user_id: UUID) -> Capture:
        """Get a specific capture."""
        capture = await self.repository.get_by_id(capture_id, user_id)
        if not capture:
            raise NotFoundError("Capture not found")
        return capture

    async def list_captures(self, user_id: UUID, include_processed: bool = True) -> dict:
        """List all captures for a user."""
        captures = await self.repository.list_all(user_id, include_processed)
        total = len(captures)
        unprocessed = await self.repository.count_unprocessed(user_id)

        return {
            "captures": captures,
            "total": total,
            "unprocessed_count": unprocessed
        }

    async def update_capture(self, capture_id: UUID, user_id: UUID, data: CaptureUpdate) -> Capture:
        """Update a capture."""
        capture = await self.get_capture(capture_id, user_id)

        if data.text is not None:
            capture.text = data.text
        if data.processed is not None:
            capture.processed = data.processed
        if data.deleted is not None:
            capture.deleted = data.deleted

        return await self.repository.update(capture)

    async def delete_capture(self, capture_id: UUID, user_id: UUID) -> None:
        """Delete a capture (soft delete)."""
        capture = await self.get_capture(capture_id, user_id)
        await self.repository.delete(capture)

    async def get_inbox_count(self, user_id: UUID) -> int:
        """Get count of unprocessed captures."""
        return await self.repository.count_unprocessed(user_id)
