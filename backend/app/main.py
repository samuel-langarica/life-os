"""FastAPI application factory."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.exceptions import AppError
from app.api.v1.auth import router as auth_router
from app.api.v1.healthcheck import router as health_router
from app.api.v1.captures import router as captures_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.journal import router as journal_router
from app.api.v1.projects import router as projects_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Life OS API",
        version="1.0.0",
        description="Personal productivity system API",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # CORS middleware - allow frontend origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,  # Required for cookies
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler for AppError
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    # Include routers
    app.include_router(health_router, prefix="/api")
    app.include_router(auth_router, prefix="/api")
    app.include_router(captures_router, prefix="/api")
    app.include_router(calendar_router, prefix="/api")
    app.include_router(journal_router, prefix="/api")
    app.include_router(projects_router, prefix="/api")

    return app


# Create application instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Life OS API",
        "version": "1.0.0",
        "docs": "/api/docs" if settings.DEBUG else "disabled in production"
    }
