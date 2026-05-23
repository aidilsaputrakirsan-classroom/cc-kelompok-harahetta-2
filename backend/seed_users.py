"""
seed_users.py — Insert user data ke database
Jalankan: python seed_users.py
"""

import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from database import engine, SessionLocal, Base
from models import User, UserRole
from auth import hash_password

# Buat tabel jika belum ada
Base.metadata.create_all(bind=engine)

db = SessionLocal()

users_to_create = [
    {
        "email": "superadmin@sewain.app",
        "nama": "Super Admin",
        "password": "SuperAdmin@123",
        "role": UserRole.super_admin,
    },
    {
        "email": "alif1@gmail.com",
        "nama": "Alif 1",
        "password": "Alif1@gmail.com",
        "role": UserRole.user,
    },
    {
        "email": "alif2@gmail.com",
        "nama": "Alif 2",
        "password": "Alif2@gmail.com",
        "role": UserRole.user,
    },
]

try:
    for u in users_to_create:
        # Cek apakah user sudah ada
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            print(f"⚠️  User {u['email']} sudah ada, skip.")
            continue

        user = User(
            email=u["email"],
            nama=u["nama"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
            is_active=True,
            is_verified=False,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        print(f"✅ User {u['email']} berhasil dibuat (role: {u['role'].value})")

    print("\n🎉 Selesai!")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    db.close()
