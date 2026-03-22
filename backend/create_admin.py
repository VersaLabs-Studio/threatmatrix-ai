#!/usr/bin/env python3
"""
ThreatMatrix AI — Admin User Creation Script
Creates the initial admin user for production deployment.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import async_session
from app.models.user import User
from app.services.auth_service import hash_password
from sqlalchemy import select


async def create_admin():
    """Create the default admin user."""
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  ThreatMatrix AI — Admin User Creation                     ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    # Admin credentials
    admin_email = "admin@threatmatrix.ai"
    admin_password = "ThreatMatrix2026!"
    admin_name = "System Administrator"

    async with async_session() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == admin_email)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"⚠️  Admin user already exists: {admin_email}")
            print(f"   Role: {existing.role}")
            print(f"   Active: {existing.is_active}")
            return

        # Create admin user
        admin = User(
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name=admin_name,
            role="admin",
            language="en",
            is_active=True,
        )

        session.add(admin)
        await session.commit()
        await session.refresh(admin)

        print(f"✅ Admin user created successfully!")
        print(f"   Email:    {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Role:     admin")
        print(f"   ID:       {admin.id}")
        print()
        print("⚠️  CHANGE THIS PASSWORD after first login!")


if __name__ == "__main__":
    asyncio.run(create_admin())
