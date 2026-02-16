"""Database dependency for FastAPI."""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.

    Automatically commits on success and rolls back on error.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
