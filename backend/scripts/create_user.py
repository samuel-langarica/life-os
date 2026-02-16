"""Script to create a user account."""
import asyncio
import sys
import os
from pathlib import Path
from getpass import getpass

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.database import Base
from app.repositories.user import UserRepository
from app.services.auth import AuthService


async def create_user(email: str, username: str, password: str):
    """Create a new user account."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        try:
            user_repo = UserRepository(session)

            # Check if user already exists
            existing = await user_repo.get_by_username(username)
            if existing:
                print(f"Error: User '{username}' already exists!")
                return False

            existing = await user_repo.get_by_email(email)
            if existing:
                print(f"Error: Email '{email}' already in use!")
                return False

            # Create user
            password_hash = AuthService.hash_password(password)
            user = await user_repo.create(
                email=email,
                username=username,
                password_hash=password_hash
            )
            await session.commit()

            print(f"\nUser created successfully!")
            print(f"  ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Username: {user.username}")
            return True

        except Exception as e:
            print(f"Error creating user: {e}")
            await session.rollback()
            return False
        finally:
            await engine.dispose()


async def main():
    """Main function."""
    print("=" * 60)
    print("Life OS - Create User Account")
    print("=" * 60)
    print()

    # Get user input
    email = input("Email: ").strip()
    username = input("Username: ").strip()
    password = getpass("Password: ")
    password_confirm = getpass("Confirm password: ")

    # Validate
    if not email or not username or not password:
        print("Error: All fields are required!")
        sys.exit(1)

    if password != password_confirm:
        print("Error: Passwords do not match!")
        sys.exit(1)

    if len(password) < 6:
        print("Error: Password must be at least 6 characters!")
        sys.exit(1)

    # Create user
    success = await create_user(email, username, password)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
