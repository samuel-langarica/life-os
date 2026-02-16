"""Script to create the initial user for Life OS."""
import asyncio
import sys
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.services.auth import AuthService


async def create_initial_user():
    """Create the initial user: samuel / Margo0211"""

    username = "samuel"
    password = "Margo0211"

    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.username == username)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"❌ User '{username}' already exists!")
            return

        # Create user
        hashed_password = AuthService.hash_password(password)
        user = User(
            username=username,
            email=None,  # Optional
            password_hash=hashed_password
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        print(f"✅ User created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   User ID: {user.id}")
        print(f"\nYou can now login at http://localhost:3000")


if __name__ == "__main__":
    asyncio.run(create_initial_user())
