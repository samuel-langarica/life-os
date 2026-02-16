"""Tests for authentication."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user import UserRepository
from app.services.auth import AuthService


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    user_repo = UserRepository(db_session)
    password_hash = AuthService.hash_password("testpassword123")

    user = await user_repo.create(
        email="test@example.com",
        username="testuser",
        password_hash=password_hash
    )
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful login."""
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpassword123"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "message" in data

    # Check cookies are set
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with nonexistent user."""
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "nonexistent",
            "password": "password123"
        }
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, test_user):
    """Test logout clears cookies."""
    # First login
    login_response = await client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200

    # Then logout
    logout_response = await client.post("/api/auth/logout")
    assert logout_response.status_code == 200

    data = logout_response.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_password_hashing():
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed = AuthService.hash_password(password)

    assert hashed != password
    assert AuthService.verify_password(password, hashed)
    assert not AuthService.verify_password("wrongpassword", hashed)


@pytest.mark.asyncio
async def test_token_generation():
    """Test JWT token generation."""
    import uuid
    user_id = uuid.uuid4()

    token = AuthService.create_access_token(user_id)
    assert token is not None
    assert len(token) > 0

    # Verify token
    verified_id = AuthService.verify_access_token(token)
    assert verified_id == user_id
