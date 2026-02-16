# Life OS Backend - Quick Setup Guide

## Prerequisites

- Python 3.11+ (tested with 3.13)
- Docker and Docker Compose
- PostgreSQL client tools (optional, for direct DB access)

## Quick Start

### 1. Start the Database

From the project root:

```bash
docker-compose up -d db
```

Wait for the database to be healthy (about 5 seconds):

```bash
docker-compose ps
```

### 2. Setup Python Environment

```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

The `.env` file is already created from `.env.example`. For production, you MUST change:

- `SECRET_KEY`: Generate with `openssl rand -hex 32`
- `DATABASE_URL`: Update with your production credentials

For development, the defaults work fine.

### 4. Run Database Migrations

```bash
alembic upgrade head
```

This creates all necessary tables (users, refresh_tokens, api_keys, journal_entries).

### 5. Create a User Account

Option A - Using Python directly:

```bash
python -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.repositories.user import UserRepository
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        user_repo = UserRepository(session)
        password_hash = pwd_context.hash('YOUR_PASSWORD')
        user = await user_repo.create(
            email='YOUR_EMAIL',
            username='YOUR_USERNAME',
            password_hash=password_hash
        )
        await session.commit()
        print(f'User created: {user.username}')
        await engine.dispose()

asyncio.run(create())
"
```

Option B - Using the script (may have input issues):

```bash
python scripts/create_user.py
```

### 6. Start the API Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 7. Test the API

Run the test script:

```bash
./scripts/test_api.sh
```

Or test manually:

```bash
# Health check
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

### 8. Access API Documentation

When `DEBUG=true` in `.env`:

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Using Docker Compose (Full Stack)

From the project root:

```bash
# Start everything (database + backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

The backend service automatically runs migrations on startup.

## Database Management

### Connect to PostgreSQL

```bash
docker-compose exec db psql -U lifeos -d lifeos
```

### Create New Migration

After modifying models:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

Note: Tests require a separate test database. Update `TEST_DATABASE_URL` in `tests/conftest.py`.

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API routes
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── repositories/    # Database queries
│   ├── dependencies/    # FastAPI dependencies
│   ├── config.py        # Configuration
│   ├── database.py      # Database setup
│   ├── exceptions.py    # Custom exceptions
│   └── main.py          # FastAPI app
├── alembic/             # Database migrations
├── scripts/             # Utility scripts
└── tests/               # Test suite
```

## Troubleshooting

### Port 5432 already in use

If you have PostgreSQL running locally, the docker-compose.yml uses port 5433 by default. Update your `.env` file:

```
DATABASE_URL=postgresql+asyncpg://lifeos:lifeos@localhost:5433/lifeos
```

### bcrypt version warning

You may see a warning about bcrypt version detection. This is harmless and doesn't affect functionality. The password hashing works correctly.

### Database connection errors

Make sure the database is running and healthy:

```bash
docker-compose ps
```

You should see `(healthy)` status for the db service.

## Next Steps

1. **Add more models**: Extend `app/models/` for other features (projects, fitness, etc.)
2. **Create API endpoints**: Add routes in `app/api/v1/` for new features
3. **Write tests**: Add test files in `tests/`
4. **Deploy**: Use the Dockerfile and docker-compose.yml for production deployment

## Security Notes

- Never commit `.env` file to git
- Change `SECRET_KEY` in production
- Use strong passwords
- Set `COOKIE_SECURE=true` in production (requires HTTPS)
- Review CORS settings in `app/main.py` before deployment
