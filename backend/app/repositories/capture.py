"""Capture repository for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.capture import Capture
from uuid import UUID
from typing import Optional


class CaptureRepository:
    """Repository for Capture database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: UUID, text: str, source: str = "manual") -> Capture:
        """Create a new capture."""
        capture = Capture(user_id=user_id, text=text, source=source)
        self.db.add(capture)
        await self.db.commit()
        await self.db.refresh(capture)
        return capture

    async def get_by_id(self, capture_id: UUID, user_id: UUID) -> Optional[Capture]:
        """Get a capture by ID for a specific user."""
        result = await self.db.execute(
            select(Capture).where(
                and_(
                    Capture.id == capture_id,
                    Capture.user_id == user_id,
                    Capture.deleted == False
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_all(self, user_id: UUID, include_processed: bool = True) -> list[Capture]:
        """List all captures for a user."""
        query = select(Capture).where(
            and_(
                Capture.user_id == user_id,
                Capture.deleted == False
            )
        )

        if not include_processed:
            query = query.where(Capture.processed == False)

        query = query.order_by(Capture.created_at.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update(self, capture: Capture) -> Capture:
        """Update a capture."""
        await self.db.commit()
        await self.db.refresh(capture)
        return capture

    async def delete(self, capture: Capture) -> None:
        """Soft delete a capture by setting deleted flag."""
        capture.deleted = True
        await self.db.commit()

    async def count_unprocessed(self, user_id: UUID) -> int:
        """Count unprocessed captures for a user."""
        result = await self.db.execute(
            select(func.count(Capture.id)).where(
                and_(
                    Capture.user_id == user_id,
                    Capture.processed == False,
                    Capture.deleted == False
                )
            )
        )
        return result.scalar() or 0
