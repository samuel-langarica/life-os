"""Healthcheck endpoint."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies.database import get_db


router = APIRouter(tags=["health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.

    Returns application and database status.
    """
    try:
        # Test database connection
        await db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception as e:
        database_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": database_status,
        "service": "Life OS API"
    }
