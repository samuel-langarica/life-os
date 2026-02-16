"""Custom application exceptions."""


class AppError(Exception):
    """Base application error."""
    def __init__(self, detail: str, code: str, status_code: int = 400):
        self.detail = detail
        self.code = code
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppError):
    """Resource not found error."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail, "NOT_FOUND", 404)


class DuplicateEntryError(AppError):
    """Duplicate resource error."""
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail, "DUPLICATE_ENTRY", 409)


class InvalidCredentialsError(AppError):
    """Invalid authentication credentials."""
    def __init__(self):
        super().__init__("Invalid credentials", "INVALID_CREDENTIALS", 401)


class ValidationError(AppError):
    """Validation error."""
    def __init__(self, detail: str):
        super().__init__(detail, "VALIDATION_ERROR", 422)


class ConflictError(AppError):
    """Conflict error."""
    def __init__(self, detail: str):
        super().__init__(detail, "CONFLICT", 409)


class UnauthorizedError(AppError):
    """Unauthorized access error."""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail, "UNAUTHORIZED", 401)
