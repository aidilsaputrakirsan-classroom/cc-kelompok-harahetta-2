"""
create_superadmin.py — Script untuk membuat akun Super Admin di database server
Jalankan di server: python create_superadmin.py
"""

import os
import sys
from dotenv import load_dotenv

# Load .env dari folder backend
load_dotenv()

from database import engine, SessionLocal
from models import Base, User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================================
# KONFIGURASI SUPERADMIN — Ganti sesuai kebutuhan
# ============================================================
SUPERADMIN_EMAIL    = "superadmin@sewain.com"
SUPERADMIN_PASSWORD = "SuperAdmin123!"
SUPERADMIN_NAMA     = "Super Admin Sewain"
# ============================================================

def create_superadmin():
    # Buat semua tabel kalau belum ada
    print("📦 Membuat tabel database...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Cek apakah sudah ada superadmin
        existing = db.query(User).filter(User.email == SUPERADMIN_EMAIL).first()
        if existing:
            print(f"⚠️  Superadmin sudah ada: {existing.email} (role: {existing.role})")
            print("   Tidak ada perubahan.")
            return

        # Buat user superadmin baru
        hashed_pw = pwd_context.hash(SUPERADMIN_PASSWORD)
        superadmin = User(
            email=SUPERADMIN_EMAIL,
            nama=SUPERADMIN_NAMA,
            hashed_password=hashed_pw,
            role=UserRole.super_admin,
            is_active=True,
            is_verified=True,
        )
        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)

        print("✅ Superadmin berhasil dibuat!")
        print(f"   ID    : {superadmin.id}")
        print(f"   Email : {superadmin.email}")
        print(f"   Nama  : {superadmin.nama}")
        print(f"   Role  : {superadmin.role}")
        print(f"   Password: {SUPERADMIN_PASSWORD}")
        print()
        print("🔐 Gunakan kredensial di atas untuk login di frontend.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin()
