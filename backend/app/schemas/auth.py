"""Authentication request/response schemas."""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import uuid


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    """Login response schema."""
    user_id: uuid.UUID
    username: str
    message: str = "Login successful"


class RefreshResponse(BaseModel):
    """Token refresh response."""
    message: str = "Token refreshed successfully"


class LogoutResponse(BaseModel):
    """Logout response."""
    message: str = "Logged out successfully"


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


class ChangePasswordResponse(BaseModel):
    """Change password response."""
    message: str = "Password changed successfully"


class UserResponse(BaseModel):
    """User information response."""
    id: uuid.UUID
    username: str
    created_at: datetime

    class Config:
        from_attributes = True
