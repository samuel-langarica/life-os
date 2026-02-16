"""Authentication repository for refresh tokens and API keys."""
from datetime import datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.auth import RefreshToken, ApiKey


class AuthRepository:
    """Repository for authentication-related database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Refresh Token operations
    async def create_refresh_token(
        self,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime
    ) -> RefreshToken:
        """Create a new refresh token."""
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        """Get refresh token by hash."""
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def delete_refresh_token(self, token_hash: str) -> None:
        """Delete a refresh token."""
        await self.db.execute(
            delete(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        await self.db.flush()

    async def delete_user_refresh_tokens(self, user_id: uuid.UUID) -> None:
        """Delete all refresh tokens for a user."""
        await self.db.execute(
            delete(RefreshToken).where(RefreshToken.user_id == user_id)
        )
        await self.db.flush()

    async def cleanup_expired_tokens(self) -> None:
        """Delete expired refresh tokens."""
        await self.db.execute(
            delete(RefreshToken).where(
                RefreshToken.expires_at < datetime.now(timezone.utc)
            )
        )
        await self.db.flush()

    # API Key operations
    async def create_api_key(
        self,
        user_id: uuid.UUID,
        name: str,
        key_hash: str,
        key_prefix: str
    ) -> ApiKey:
        """Create a new API key."""
        api_key = ApiKey(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix
        )
        self.db.add(api_key)
        await self.db.flush()
        return api_key

    async def get_api_key_by_hash(self, key_hash: str) -> ApiKey | None:
        """Get API key by hash."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        return result.scalar_one_or_none()

    async def validate_api_key(self, key_hash: str) -> ApiKey | None:
        """Validate API key (check if exists and is active)."""
        result = await self.db.execute(
            select(ApiKey).where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def update_key_last_used(self, key_id: uuid.UUID) -> None:
        """Update API key last used timestamp."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.id == key_id)
        )
        api_key = result.scalar_one_or_none()
        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            await self.db.flush()

    async def list_user_api_keys(self, user_id: uuid.UUID) -> list[ApiKey]:
        """List all API keys for a user."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.user_id == user_id)
        )
        return list(result.scalars().all())

    async def revoke_api_key(self, key_id: uuid.UUID) -> bool:
        """Revoke (deactivate) an API key."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.id == key_id)
        )
        api_key = result.scalar_one_or_none()
        if api_key:
            api_key.is_active = False
            await self.db.flush()
            return True
        return False
