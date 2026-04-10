#!/usr/bin/env python3
"""
ThreatMatrix AI — Demo User Seeding Script
Populates the database with default demo accounts for Admin, Analyst, and Viewer roles.
"""

import asyncio
import sys
import os

# Add the backend directory to the path so we can import from app
# Works for both host (../backend) and container (..) structures
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(parent_dir, 'backend')

sys.path.insert(0, parent_dir)
if os.path.exists(backend_dir):
    sys.path.insert(0, backend_dir)

from app.database import async_session
from app.models.user import User
from passlib.context import CryptContext
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Demo Credentials
DEMO_USERS = [
    {
        "email": "admin@threatmatrix.ai",
        "password": "ThreatMatrix2026!",
        "full_name": "System Administrator",
        "role": "admin",
        "language": "en"
    },
    {
        "email": "analyst@threatmatrix.ai",
        "password": "Analyst2026!",
        "full_name": "Security Analyst",
        "role": "analyst",
        "language": "en"
    },
    {
        "email": "viewer@threatmatrix.ai",
        "password": "Viewer2026!",
        "full_name": "Executive Viewer",
        "role": "viewer",
        "language": "en"
    }
]

async def seed_users():
    """Seed the demo users into the database."""
    print("+--------------------------------------------------------------+")
    print("|  ThreatMatrix AI -- Demo User Seeding                        |")
    print("+--------------------------------------------------------------+")
    print()

    async with async_session() as session:
        for user_data in DEMO_USERS:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"⚠️  User already exists: {user_data['email']} (Role: {existing.role})")
                continue

            # Create user
            user = User(
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                language=user_data["language"],
                is_active=True,
            )

            session.add(user)
            print(f"✅ Created user: {user_data['email']} ({user_data['role']})")

        await session.commit()
        print("\n🎉 Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_users())
