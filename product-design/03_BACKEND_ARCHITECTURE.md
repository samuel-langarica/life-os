# Life OS - Technical Architecture (Part 3)
# Backend Architecture

---

## 1. FOLDER STRUCTURE

```
backend/
├── alembic/                        # Database migrations
│   ├── versions/                   # Migration files
│   ├── env.py
│   └── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application factory
│   ├── config.py                   # Settings / environment variables
│   ├── database.py                 # SQLAlchemy engine, session factory
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py                 # User model
│   │   ├── journal.py              # JournalEntry model
│   │   ├── exercise.py             # Exercise model
│   │   ├── workout.py              # WorkoutProgram, ProgramExercise,
│   │   │                           #   WorkoutSession, WorkoutLog
│   │   ├── project.py              # Project, ProjectTask, ProjectNote
│   │   ├── capture.py              # Capture model
│   │   ├── calendar.py             # CalendarEvent model
│   │   └── auth.py                 # ApiKey, RefreshToken models
│   │
│   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py                 # LoginRequest, TokenResponse, etc.
│   │   ├── journal.py              # JournalEntryCreate, JournalEntryResponse, etc.
│   │   ├── exercise.py
│   │   ├── workout.py
│   │   ├── project.py
│   │   ├── capture.py
│   │   ├── calendar.py
│   │   ├── dashboard.py            # WeeklyDashboardResponse
│   │   ├── settings.py
│   │   └── common.py               # PaginatedResponse, ErrorResponse
│   │
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py         # Login, logout, token refresh, password
│   │   ├── journal_service.py      # CRUD + streak calculation
│   │   ├── exercise_service.py     # CRUD with usage validation
│   │   ├── workout_service.py      # Programs, sessions, logs
│   │   ├── project_service.py      # Projects, tasks, notes, reorder
│   │   ├── capture_service.py      # CRUD + external API logic
│   │   ├── calendar_service.py     # Events + recurrence materialization
│   │   ├── dashboard_service.py    # Weekly aggregation
│   │   └── settings_service.py     # User settings, API keys, export
│   │
│   ├── repositories/               # Database access layer (queries)
│   │   ├── __init__.py
│   │   ├── user_repo.py
│   │   ├── journal_repo.py
│   │   ├── exercise_repo.py
│   │   ├── workout_repo.py
│   │   ├── project_repo.py
│   │   ├── capture_repo.py
│   │   ├── calendar_repo.py
│   │   └── auth_repo.py
│   │
│   ├── api/                        # Route handlers (thin controllers)
│   │   ├── __init__.py
│   │   ├── router.py               # Main API router (includes all sub-routers)
│   │   ├── auth.py                 # /api/auth/* routes
│   │   ├── journal.py              # /api/v1/journal/* routes
│   │   ├── exercises.py            # /api/v1/exercises/* routes
│   │   ├── programs.py             # /api/v1/programs/* routes
│   │   ├── workouts.py             # /api/v1/workouts/* routes
│   │   ├── projects.py             # /api/v1/projects/* routes
│   │   ├── captures.py             # /api/v1/captures/* routes
│   │   ├── calendar.py             # /api/v1/calendar/* routes
│   │   ├── dashboard.py            # /api/v1/dashboard/* routes
│   │   └── settings.py             # /api/v1/settings/* routes
│   │
│   ├── middleware/                  # Custom middleware
│   │   ├── __init__.py
│   │   └── cors.py                 # CORS configuration
│   │
│   └── dependencies/               # FastAPI dependency injection
│       ├── __init__.py
│       ├── database.py             # get_db session dependency
│       └── auth.py                 # get_current_user, require_api_key
│
├── tests/                          # Test suite
│   ├── conftest.py                 # Fixtures (test DB, client, auth)
│   ├── test_auth.py
│   ├── test_journal.py
│   ├── test_exercises.py
│   ├── test_workouts.py
│   ├── test_projects.py
│   ├── test_captures.py
│   ├── test_calendar.py
│   └── test_dashboard.py
│
├── scripts/
│   ├── seed.py                     # Seed initial data (user, projects)
│   └── create_user.py              # CLI tool to create/reset user password
│
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## 2. LAYERED ARCHITECTURE PATTERN

```
Request Flow:

  HTTP Request
       |
  [ API Route Handler ]    (app/api/*.py)
  - Parse request           - Thin layer, no business logic
  - Validate input          - Calls service methods
  - Return response         - Handles HTTP concerns (status codes, headers)
       |
  [ Service Layer ]         (app/services/*.py)
  - Business logic          - Validates business rules
  - Orchestrates operations - Coordinates multiple repos
  - Transaction boundaries  - Raises domain exceptions
       |
  [ Repository Layer ]      (app/repositories/*.py)
  - Database queries        - SQLAlchemy queries only
  - No business logic       - Returns ORM model instances
  - Single-table focus      - Handles pagination
       |
  [ Database ]              (PostgreSQL via SQLAlchemy)
```

### Why This Pattern

- **Testability:** Services can be tested with mocked repositories.
- **Separation:** Route handlers never contain SQL. Repositories never contain business rules.
- **Maintainability:** Changing the database query does not affect the API contract.
- **Single Responsibility:** Each layer has one job.

---

## 3. KEY IMPLEMENTATION DETAILS

### 3.1 Application Factory (main.py)

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.config import settings

def create_app() -> FastAPI:
    app = FastAPI(
        title="Life OS API",
        version="1.0.0",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # CORS - allow frontend origin only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,  # Required for cookies
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include all API routes
    app.include_router(api_router)

    return app

app = create_app()
```

### 3.2 Configuration (config.py)

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lifeos:password@db:5432/lifeos"

    # Auth
    SECRET_KEY: str  # Used for JWT signing. Generate with: openssl rand -hex 32
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    FRONTEND_URL: str = "https://lifeos.yourdomain.com"
    DEBUG: bool = False

    # Cookies
    COOKIE_DOMAIN: str | None = None  # None = current domain
    COOKIE_SECURE: bool = True        # True in production (HTTPS)

    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.3 Database Setup (database.py)

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,       # Single user, small pool is fine
    max_overflow=2,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass
```

### 3.4 Database Dependency (dependencies/database.py)

```python
# app/dependencies/database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### 3.5 Auth Dependency (dependencies/auth.py)

```python
# app/dependencies/auth.py
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.config import settings
from app.dependencies.database import get_db
from app.repositories.user_repo import UserRepository
from app.repositories.auth_repo import AuthRepository

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Extract user from httpOnly access_token cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_api_key(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Extract user from Bearer token in Authorization header.
    Used by external API endpoints (Siri Shortcuts)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    api_key = auth_header.removeprefix("Bearer ").strip()
    auth_repo = AuthRepository(db)
    key_record = await auth_repo.validate_api_key(api_key)

    if key_record is None:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Update last_used_at
    await auth_repo.update_key_last_used(key_record.id)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(key_record.user_id)
    return user
```

### 3.6 JWT Token Utilities

```python
# app/services/auth_service.py (partial)
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import secrets
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.auth_repo = AuthRepository(db)

    def create_access_token(self, user_id: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    def create_refresh_token(self) -> str:
        return secrets.token_urlsafe(64)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    async def login(self, username: str, password: str) -> tuple[str, str]:
        user = await self.user_repo.get_by_username(username)
        if not user or not self.verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token()

        # Store refresh token hash in DB
        await self.auth_repo.create_refresh_token(
            user_id=user.id,
            token_hash=self.hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            ),
        )

        return access_token, refresh_token

    async def refresh(self, refresh_token: str) -> str:
        token_hash = self.hash_token(refresh_token)
        stored = await self.auth_repo.get_refresh_token(token_hash)

        if not stored or stored.expires_at < datetime.now(timezone.utc):
            raise InvalidCredentialsError()

        return self.create_access_token(stored.user_id)
```

### 3.7 Example Route Handler (thin controller)

```python
# app/api/journal.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.services.journal_service import JournalService
from app.schemas.journal import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalStatusResponse,
)
from app.models.user import User

router = APIRouter(prefix="/api/v1/journal", tags=["journal"])

@router.get("/entries", response_model=list[JournalEntryResponse])
async def list_entries(
    entry_type: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = JournalService(db)
    return await service.list_entries(
        user_id=user.id,
        entry_type=entry_type,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )

@router.post("/entries", response_model=JournalEntryResponse, status_code=201)
async def create_entry(
    data: JournalEntryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = JournalService(db)
    return await service.create_entry(user_id=user.id, data=data)

@router.get("/status", response_model=JournalStatusResponse)
async def get_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = JournalService(db)
    return await service.get_status(user_id=user.id)
```

### 3.8 Example Service (business logic)

```python
# app/services/journal_service.py
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.journal_repo import JournalRepository
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate

class JournalService:
    def __init__(self, db: AsyncSession):
        self.repo = JournalRepository(db)

    async def create_entry(self, user_id: str, data: JournalEntryCreate):
        # Business rule: validate content structure matches entry_type
        self._validate_content(data.entry_type, data.content)

        # Business rule: check for duplicate
        existing = await self.repo.get_by_type_and_date(
            user_id, data.entry_type, data.entry_date
        )
        if existing:
            raise DuplicateEntryError(
                f"{data.entry_type} entry already exists for {data.entry_date}"
            )

        return await self.repo.create(user_id=user_id, data=data)

    async def calculate_streak(self, user_id: str, entry_type: str) -> int:
        """Count consecutive days with entries, going backward from today."""
        today = date.today()
        entries = await self.repo.get_dates_descending(
            user_id, entry_type, limit=365
        )

        entry_dates = {e.entry_date for e in entries}
        streak = 0
        check_date = today

        while check_date in entry_dates:
            streak += 1
            check_date -= timedelta(days=1)

        return streak

    def _validate_content(self, entry_type: str, content: dict):
        required_fields = {
            "morning_pages": ["body"],
            "daily_reflection": ["went_well", "to_improve", "grateful_for"],
            "weekly_review": [
                "big_wins", "challenges", "learnings", "next_week_focus"
            ],
        }
        for field in required_fields.get(entry_type, []):
            if field not in content:
                raise ValidationError(f"Missing required field: {field}")
```

### 3.9 Example Repository (database queries)

```python
# app/repositories/journal_repo.py
from datetime import date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.journal import JournalEntry

class JournalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: str, data) -> JournalEntry:
        entry = JournalEntry(
            user_id=user_id,
            entry_type=data.entry_type,
            entry_date=data.entry_date,
            content=data.content,
        )
        self.db.add(entry)
        await self.db.flush()  # Get the ID without committing
        return entry

    async def get_by_id(self, entry_id: str) -> JournalEntry | None:
        result = await self.db.execute(
            select(JournalEntry).where(JournalEntry.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def get_by_type_and_date(
        self, user_id: str, entry_type: str, entry_date: date
    ) -> JournalEntry | None:
        result = await self.db.execute(
            select(JournalEntry).where(
                JournalEntry.user_id == user_id,
                JournalEntry.entry_type == entry_type,
                JournalEntry.entry_date == entry_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_dates_descending(
        self, user_id: str, entry_type: str, limit: int = 365
    ) -> list[JournalEntry]:
        result = await self.db.execute(
            select(JournalEntry)
            .where(
                JournalEntry.user_id == user_id,
                JournalEntry.entry_type == entry_type,
            )
            .order_by(JournalEntry.entry_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_entries(
        self, user_id: str, entry_type=None, date_from=None,
        date_to=None, page=1, per_page=20,
    ):
        query = select(JournalEntry).where(JournalEntry.user_id == user_id)

        if entry_type:
            query = query.where(JournalEntry.entry_type == entry_type)
        if date_from:
            query = query.where(JournalEntry.entry_date >= date_from)
        if date_to:
            query = query.where(JournalEntry.entry_date <= date_to)

        query = query.order_by(JournalEntry.entry_date.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.db.execute(query)
        return list(result.scalars().all())
```

### 3.10 API Key Hashing and Validation

```python
# app/services/auth_service.py (API key section)
import secrets
import hashlib

class AuthService:
    # ... (previous methods)

    def generate_api_key(self) -> tuple[str, str]:
        """Returns (full_key, key_hash). Full key shown once to user."""
        raw = secrets.token_urlsafe(32)
        full_key = f"sk_live_{raw}"
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        key_prefix = full_key[:10]
        return full_key, key_hash, key_prefix

    async def validate_api_key(self, api_key: str):
        """Validate Bearer token from Authorization header."""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        return await self.auth_repo.get_active_key_by_hash(key_hash)
```

---

## 4. ALEMBIC MIGRATIONS SETUP

### Directory structure

```
alembic/
├── alembic.ini          # Configuration
├── env.py               # Migration environment (uses app.database.Base)
└── versions/
    ├── 001_initial_schema.py
    ├── 002_seed_data.py
    └── ...
```

### alembic.ini key settings

```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname
# Note: In env.py, this is overridden by app.config.settings.DATABASE_URL
```

### env.py (async configuration)

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from app.config import settings
from app.database import Base

# Import all models so Base.metadata is populated
from app.models import user, journal, exercise, workout, project, capture, calendar, auth

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = settings.DATABASE_URL
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    connectable = create_async_engine(settings.DATABASE_URL)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

### Migration commands

```bash
# Generate a new migration from model changes
alembic revision --autogenerate -m "description"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration state
alembic current
```

---

## 5. DOCKER CONFIGURATION

### Dockerfile (backend)

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run as non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Expose port
EXPOSE 8000

# Start command (overridden in docker-compose for migrations)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt

```
# Web framework
fastapi==0.115.*
uvicorn[standard]==0.34.*

# Database
sqlalchemy[asyncio]==2.0.*
asyncpg==0.30.*
alembic==1.14.*

# Auth
python-jose[cryptography]==3.3.*
passlib[bcrypt]==1.7.*

# Settings
pydantic-settings==2.7.*

# Utilities
python-dateutil==2.9.*

# Testing
pytest==8.3.*
pytest-asyncio==0.24.*
httpx==0.28.*          # For TestClient with async
```

### docker-compose.yml (full stack)

```yaml
# docker-compose.yml (project root)
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: lifeos
      POSTGRES_USER: lifeos
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"    # Only expose to localhost
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lifeos"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+asyncpg://lifeos:${DB_PASSWORD}@db:5432/lifeos
      SECRET_KEY: ${SECRET_KEY}
      FRONTEND_URL: ${FRONTEND_URL}
      DEBUG: ${DEBUG:-false}
      COOKIE_SECURE: ${COOKIE_SECURE:-true}
    ports:
      - "127.0.0.1:8000:8000"    # Only expose to localhost
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "alembic upgrade head &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    restart: unless-stopped
    environment:
      NODE_ENV: production
    ports:
      - "127.0.0.1:3000:3000"    # Only expose to localhost
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot-data:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
  certbot-data:
```

### Environment file (.env.example)

```bash
# .env.example

# Database
DB_PASSWORD=change-me-to-a-strong-random-password

# Auth
SECRET_KEY=change-me-generate-with-openssl-rand-hex-32

# URLs
FRONTEND_URL=https://lifeos.yourdomain.com
NEXT_PUBLIC_API_URL=https://lifeos.yourdomain.com

# Debug (set to false in production)
DEBUG=false
COOKIE_SECURE=true
```

---

## 6. SECURITY MODEL

### Authentication Flow

```
BROWSER SESSION (cookie-based):

1. User submits password on login page
2. POST /api/auth/login { username, password }
3. Backend verifies credentials
4. Backend creates:
   - Access token (JWT, 15 min expiry)
   - Refresh token (random, 7 day expiry, hash stored in DB)
5. Backend sets both as httpOnly, Secure, SameSite=Lax cookies
6. Frontend receives 200 + user data
7. All subsequent requests include cookies automatically

Token Refresh:
1. Frontend gets 401 on any API call
2. Frontend calls POST /api/auth/refresh
3. Backend reads refresh_token cookie, validates hash against DB
4. Backend issues new access_token cookie
5. Frontend retries original request
6. If refresh fails too -> redirect to login

EXTERNAL API (Bearer token):

1. User generates API key in Settings
2. Full key shown once: sk_live_abc123...
3. User configures key in iOS Shortcuts
4. Shortcut sends: Authorization: Bearer sk_live_abc123...
5. Backend hashes the token, looks up hash in api_keys table
6. If valid and active -> authenticate as that user
7. Update last_used_at
```

### Access Control Summary

```
PUBLIC (no auth):
  None. All endpoints require authentication.

COOKIE AUTH (browser sessions):
  GET  /api/auth/refresh           - Refresh access token
  POST /api/auth/logout            - Clear session
  PATCH /api/auth/password         - Change password
  ALL  /api/v1/*                   - All module endpoints

BEARER TOKEN AUTH (external API):
  POST /api/v1/captures/external   - Create capture from Siri/Shortcuts

NO AUTH (login only):
  POST /api/auth/login             - Authenticate
```

### Security Headers

Set by Nginx (see deployment section):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 7. ERROR HANDLING PATTERN

### Custom Exception Classes

```python
# app/services/exceptions.py

class AppError(Exception):
    """Base application error."""
    def __init__(self, detail: str, code: str, status_code: int = 400):
        self.detail = detail
        self.code = code
        self.status_code = status_code

class NotFoundError(AppError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail, "NOT_FOUND", 404)

class DuplicateEntryError(AppError):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail, "DUPLICATE_ENTRY", 409)

class InvalidCredentialsError(AppError):
    def __init__(self):
        super().__init__("Invalid credentials", "INVALID_CREDENTIALS", 401)

class ValidationError(AppError):
    def __init__(self, detail: str):
        super().__init__(detail, "VALIDATION_ERROR", 422)

class ConflictError(AppError):
    def __init__(self, detail: str):
        super().__init__(detail, "CONFLICT", 409)
```

### Global Exception Handler

```python
# app/main.py (added to create_app)
from fastapi.responses import JSONResponse
from app.services.exceptions import AppError

@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )
```

---

## 8. TESTING STRATEGY

### Test Database Setup

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import create_app
from app.database import Base
from app.dependencies.database import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://lifeos:test@localhost:5432/lifeos_test"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine)
    async with session_factory() as session:
        yield session
        await session.rollback()  # Roll back after each test

@pytest.fixture
async def client(db_session):
    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

@pytest.fixture
async def auth_client(client):
    """Client with authentication cookies set."""
    # Create test user and login
    # ... seed test user, login, return client with cookies
    pass
```

### Test Commands

```bash
# Run all tests
pytest tests/ -v

# Run specific module tests
pytest tests/test_journal.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```
