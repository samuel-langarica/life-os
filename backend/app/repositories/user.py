"""User repository for database operations."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.user import User


class UserRepository:
    """Repository for User database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID | str) -> User | None:
        """Get user by ID."""
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)

        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        """Get user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def create(self, email: str, username: str, password_hash: str) -> User:
        """Create a new user."""
        user = User(
            email=email,
            username=username,
            password_hash=password_hash
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_password(self, user_id: uuid.UUID, password_hash: str) -> User | None:
        """Update user password."""
        user = await self.get_by_id(user_id)
        if user:
            user.password_hash = password_hash
            await self.db.flush()
        return user
