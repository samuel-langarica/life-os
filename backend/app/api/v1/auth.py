"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.services.auth import AuthService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshResponse,
    LogoutResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
)
from app.models.user import User
from app.exceptions import InvalidCredentialsError, UnauthorizedError
from app.config import settings


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user with username and password.

    Sets httpOnly cookies for access_token and refresh_token.
    """
    try:
        auth_service = AuthService(db)
        access_token, refresh_token = await auth_service.login(
            credentials.username,
            credentials.password
        )

        # Set httpOnly cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            domain=settings.COOKIE_DOMAIN,
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            domain=settings.COOKIE_DOMAIN,
        )

        # Get user info for response
        from app.repositories.user import UserRepository
        user_repo = UserRepository(db)
        user = await user_repo.get_by_username(credentials.username)

        return LoginResponse(
            user_id=user.id,
            email=user.email,
            username=user.username,
        )

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.

    Reads refresh_token from httpOnly cookie and issues new access_token.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    try:
        auth_service = AuthService(db)
        new_access_token = await auth_service.refresh(refresh_token)

        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            domain=settings.COOKIE_DOMAIN,
        )

        return RefreshResponse()

    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.detail)
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Logout by deleting refresh token and clearing cookies.
    """
    refresh_token = request.cookies.get("refresh_token")

    if refresh_token:
        auth_service = AuthService(db)
        try:
            await auth_service.logout(refresh_token)
        except Exception:
            pass  # Continue even if token deletion fails

    # Clear cookies
    response.delete_cookie(
        key="access_token",
        domain=settings.COOKIE_DOMAIN,
    )
    response.delete_cookie(
        key="refresh_token",
        domain=settings.COOKIE_DOMAIN,
    )

    return LogoutResponse()


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user password.

    Requires authentication. Invalidates all refresh tokens for security.
    """
    try:
        auth_service = AuthService(db)
        await auth_service.change_password(
            user.id,
            data.current_password,
            data.new_password
        )
        return ChangePasswordResponse()

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
