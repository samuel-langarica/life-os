# Life OS Backend

FastAPI backend for the Life OS personal productivity system.

## Quick Start

### 1. Setup Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `SECRET_KEY`: Generate with `openssl rand -hex 32`
- `DATABASE_URL`: Your PostgreSQL connection string
- Other settings as needed

### 2. Start with Docker Compose

From the project root:

```bash
# Start database and backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

The API will be available at `http://localhost:8000`

### 3. Create Initial User

```bash
cd backend
python scripts/create_user.py
```

## Development Setup (Without Docker)

### Prerequisites

- Python 3.11+
- PostgreSQL 16+

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Database Setup

```bash
# Create database
createdb lifeos

# Run migrations
alembic upgrade head
```

### Run Development Server

```bash
uvicorn app.main:app --reload
```

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/           # Migration files
│   └── env.py             # Alembic configuration
├── app/
│   ├── api/               # Route handlers
│   │   └── v1/           # API version 1
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── repositories/     # Database queries
│   ├── dependencies/     # FastAPI dependencies
│   ├── config.py         # Configuration
│   ├── database.py       # Database setup
│   ├── exceptions.py     # Custom exceptions
│   └── main.py          # FastAPI app
├── scripts/             # Utility scripts
└── tests/              # Test suite
```

## API Documentation

When `DEBUG=true`, interactive API docs are available at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Key Endpoints

### Health Check
- `GET /api/health` - Check API and database status

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

## Authentication

The API uses two authentication methods:

### 1. Cookie-based (Browser Sessions)
- JWT access token (15 min expiry)
- Refresh token (7 day expiry)
- Both stored in httpOnly cookies
- Used by the web frontend

### 2. API Key (External Access)
- Bearer token authentication
- For Siri Shortcuts, mobile apps, etc.
- Generate in Settings (when implemented)

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://lifeos:lifeos@localhost:5432/lifeos` |
| `SECRET_KEY` | JWT signing key (required) | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `DEBUG` | Enable debug mode | `false` |
| `COOKIE_SECURE` | Use secure cookies (HTTPS) | `true` |
| `COOKIE_DOMAIN` | Cookie domain | `None` (current domain) |

## Architecture

The backend follows a layered architecture:

```
Request → Route Handler → Service → Repository → Database
```

- **Route Handlers** (`api/`): HTTP concerns, validation
- **Services** (`services/`): Business logic
- **Repositories** (`repositories/`): Database queries
- **Models** (`models/`): SQLAlchemy ORM models
- **Schemas** (`schemas/`): Pydantic request/response models

## License

Private project - All rights reserved
