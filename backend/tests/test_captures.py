"""Tests for captures functionality."""
import pytest

from app.repositories.user import UserRepository
from app.repositories.auth import AuthRepository
from app.services.auth import AuthService


@pytest.fixture
async def test_user(db_session):
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


@pytest.fixture
async def auth_client(client, test_user):
    """Create an authenticated client with cookies."""
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    return client


@pytest.fixture
async def api_key(db_session, test_user):
    """Create an API key for testing external API."""
    auth_repo = AuthRepository(db_session)
    api_key_str = AuthService.generate_api_key()

    await auth_repo.create_api_key(
        user_id=test_user.id,
        key_hash=AuthService.hash_api_key(api_key_str),
        key_prefix=api_key_str[:10],
        name="Test API Key"
    )
    await db_session.commit()

    return api_key_str


# Basic CRUD Tests (Cookie Auth)

@pytest.mark.asyncio
async def test_create_capture(auth_client):
    """Test creating a capture via web API."""
    response = await auth_client.post(
        "/api/v1/captures",
        json={
            "text": "This is a test capture",
            "source": "manual"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "This is a test capture"
    assert data["source"] == "manual"
    assert data["processed"] is False
    assert data["deleted"] is False
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_list_captures_empty(auth_client):
    """Test listing captures when empty."""
    response = await auth_client.get("/api/v1/captures")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["unprocessed_count"] == 0
    assert data["captures"] == []


@pytest.mark.asyncio
async def test_list_captures_with_data(auth_client):
    """Test listing captures with data."""
    # Create some captures
    await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 1", "source": "manual"}
    )
    await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 2", "source": "siri"}
    )

    response = await auth_client.get("/api/v1/captures")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["unprocessed_count"] == 2
    assert len(data["captures"]) == 2


@pytest.mark.asyncio
async def test_list_captures_exclude_processed(auth_client):
    """Test listing captures excluding processed ones."""
    # Create captures
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 1"}
    )
    capture_id = create_resp.json()["id"]

    await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 2"}
    )

    # Mark first capture as processed
    await auth_client.patch(
        f"/api/v1/captures/{capture_id}",
        json={"processed": True}
    )

    # List without processed
    response = await auth_client.get("/api/v1/captures?include_processed=false")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1  # Only unprocessed
    assert data["unprocessed_count"] == 1


@pytest.mark.asyncio
async def test_get_capture(auth_client):
    """Test getting a specific capture."""
    # Create a capture
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Test capture"}
    )
    capture_id = create_resp.json()["id"]

    # Get the capture
    response = await auth_client.get(f"/api/v1/captures/{capture_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == capture_id
    assert data["text"] == "Test capture"


@pytest.mark.asyncio
async def test_get_capture_not_found(auth_client):
    """Test getting a non-existent capture."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await auth_client.get(f"/api/v1/captures/{fake_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_capture_text(auth_client):
    """Test updating capture text."""
    # Create a capture
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Original text"}
    )
    capture_id = create_resp.json()["id"]

    # Update it
    response = await auth_client.patch(
        f"/api/v1/captures/{capture_id}",
        json={"text": "Updated text"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Updated text"


@pytest.mark.asyncio
async def test_update_capture_mark_processed(auth_client):
    """Test marking capture as processed."""
    # Create a capture
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Test capture"}
    )
    capture_id = create_resp.json()["id"]

    # Mark as processed
    response = await auth_client.patch(
        f"/api/v1/captures/{capture_id}",
        json={"processed": True}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["processed"] is True


@pytest.mark.asyncio
async def test_delete_capture(auth_client):
    """Test deleting a capture."""
    # Create a capture
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "To be deleted"}
    )
    capture_id = create_resp.json()["id"]

    # Delete it
    response = await auth_client.delete(f"/api/v1/captures/{capture_id}")

    assert response.status_code == 204

    # Verify it's gone
    get_resp = await auth_client.get(f"/api/v1/captures/{capture_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_get_inbox_count(auth_client):
    """Test getting inbox count."""
    # Create captures
    await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 1"}
    )

    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Capture 2"}
    )
    capture_id = create_resp.json()["id"]

    # Mark one as processed
    await auth_client.patch(
        f"/api/v1/captures/{capture_id}",
        json={"processed": True}
    )

    # Get count
    response = await auth_client.get("/api/v1/captures/count")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1  # Only unprocessed


# External API Tests (Bearer Token)

@pytest.mark.asyncio
async def test_create_capture_external_with_api_key(client, api_key):
    """Test creating capture via external API with valid API key."""
    response = await client.post(
        "/api/v1/captures/external",
        json={
            "text": "Capture from Siri",
            "source": "siri"
        },
        headers={"Authorization": f"Bearer {api_key}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "Capture from Siri"
    assert data["source"] == "siri"


@pytest.mark.asyncio
async def test_create_capture_external_invalid_api_key(client):
    """Test creating capture with invalid API key."""
    response = await client.post(
        "/api/v1/captures/external",
        json={
            "text": "Test",
            "source": "siri"
        },
        headers={"Authorization": "Bearer invalid_key"}
    )

    assert response.status_code == 401
    assert "Invalid API key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_capture_external_no_auth(client):
    """Test creating capture without authentication."""
    response = await client.post(
        "/api/v1/captures/external",
        json={
            "text": "Test",
            "source": "siri"
        }
    )

    assert response.status_code == 401


# Validation Tests

@pytest.mark.asyncio
async def test_create_capture_empty_text(auth_client):
    """Test creating capture with empty text."""
    response = await auth_client.post(
        "/api/v1/captures",
        json={"text": ""}
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_capture_text_too_long(auth_client):
    """Test creating capture with text exceeding max length."""
    long_text = "a" * 5001  # Max is 5000
    response = await auth_client.post(
        "/api/v1/captures",
        json={"text": long_text}
    )

    assert response.status_code == 422  # Validation error


# Integration Tests

@pytest.mark.asyncio
async def test_full_capture_workflow(auth_client):
    """Test complete workflow: create, list, mark processed, delete."""
    # Create
    create_resp = await auth_client.post(
        "/api/v1/captures",
        json={"text": "Workflow test"}
    )
    assert create_resp.status_code == 201
    capture_id = create_resp.json()["id"]

    # List and verify count
    list_resp = await auth_client.get("/api/v1/captures")
    assert list_resp.json()["unprocessed_count"] == 1

    # Mark as processed
    update_resp = await auth_client.patch(
        f"/api/v1/captures/{capture_id}",
        json={"processed": True}
    )
    assert update_resp.status_code == 200

    # Verify count updated
    count_resp = await auth_client.get("/api/v1/captures/count")
    assert count_resp.json()["count"] == 0

    # Delete
    delete_resp = await auth_client.delete(f"/api/v1/captures/{capture_id}")
    assert delete_resp.status_code == 204

    # Verify list is empty
    final_list_resp = await auth_client.get("/api/v1/captures")
    assert final_list_resp.json()["total"] == 0
