"""Authentication service with business logic."""
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import secrets
import hashlib
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.repositories.user import UserRepository
from app.repositories.auth import AuthRepository
from app.exceptions import InvalidCredentialsError, UnauthorizedError


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.auth_repo = AuthRepository(db)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def create_access_token(user_id: uuid.UUID) -> str:
        """Create a JWT access token."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    @staticmethod
    def create_refresh_token() -> str:
        """Create a random refresh token."""
        return secrets.token_urlsafe(64)

    @staticmethod
    def hash_token(token: str) -> str:
        """Hash a token using SHA256."""
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def verify_access_token(token: str) -> uuid.UUID | None:
        """Verify and decode an access token."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id is None:
                return None
            return uuid.UUID(user_id)
        except Exception:
            return None

    async def login(self, username: str, password: str) -> tuple[str, str]:
        """
        Authenticate user and return access and refresh tokens.

        Returns:
            tuple[str, str]: (access_token, refresh_token)
        """
        user = await self.user_repo.get_by_username(username)
        if not user or not self.verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        # Create tokens
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token()

        # Store refresh token hash in database
        await self.auth_repo.create_refresh_token(
            user_id=user.id,
            token_hash=self.hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        )

        return access_token, refresh_token

    async def refresh(self, refresh_token: str) -> str:
        """
        Refresh access token using refresh token.

        Returns:
            str: New access token
        """
        token_hash = self.hash_token(refresh_token)
        stored_token = await self.auth_repo.get_refresh_token(token_hash)

        if not stored_token:
            raise UnauthorizedError("Invalid refresh token")

        if stored_token.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token expired")

        # Create new access token
        return self.create_access_token(stored_token.user_id)

    async def logout(self, refresh_token: str) -> None:
        """Logout by deleting the refresh token."""
        token_hash = self.hash_token(refresh_token)
        await self.auth_repo.delete_refresh_token(token_hash)

    async def change_password(
        self,
        user_id: uuid.UUID,
        current_password: str,
        new_password: str
    ) -> None:
        """Change user password."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedError("User not found")

        if not self.verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError()

        # Update password
        new_hash = self.hash_password(new_password)
        await self.user_repo.update_password(user_id, new_hash)

        # Invalidate all refresh tokens for security
        await self.auth_repo.delete_user_refresh_tokens(user_id)

    async def generate_api_key(
        self,
        user_id: uuid.UUID,
        name: str
    ) -> tuple[str, str]:
        """
        Generate a new API key for external access.

        Returns:
            tuple[str, str]: (full_key, key_prefix) - Full key shown once to user
        """
        raw = secrets.token_urlsafe(32)
        full_key = f"sk_live_{raw}"
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        key_prefix = full_key[:10]

        await self.auth_repo.create_api_key(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix
        )

        return full_key, key_prefix

    async def validate_api_key(self, api_key: str) -> uuid.UUID | None:
        """
        Validate an API key and return the user ID.

        Returns:
            uuid.UUID | None: User ID if valid, None otherwise
        """
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        key_record = await self.auth_repo.validate_api_key(key_hash)

        if not key_record:
            return None

        # Update last used timestamp
        await self.auth_repo.update_key_last_used(key_record.id)

        return key_record.user_id
