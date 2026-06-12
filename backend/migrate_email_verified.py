"""
migrate_email_verified.py — Migrasi DB Sewain
Jalankan sekali di server setelah deploy: python migrate_email_verified.py

Script ini:
1. Menambahkan kolom email_verified_at & password_changed_at ke users
2. Menandai semua user existing sebagai email-verified
3. Menambahkan kolom return_requested_at ke rentals
"""

import os
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import text
from database import engine


def migrate():
    print("🔄 Migrasi: email_verified_at & password_changed_at")
    print("=" * 50)

    with engine.connect() as conn:
        # 1. Tambah kolom email_verified_at jika belum ada
        try:
            conn.execute(text("""
                ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✅ Kolom email_verified_at berhasil ditambahkan")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ️  Kolom email_verified_at sudah ada, skip")
            else:
                print(f"⚠️  Error tambah email_verified_at: {e}")

        # 2. Tambah kolom password_changed_at jika belum ada
        try:
            conn.execute(text("""
                ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✅ Kolom password_changed_at berhasil ditambahkan")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ️  Kolom password_changed_at sudah ada, skip")
            else:
                print(f"⚠️  Error tambah password_changed_at: {e}")

        # 3. Set semua user existing sebagai email-verified
        result = conn.execute(text("""
            UPDATE users
            SET email_verified_at = NOW()
            WHERE email_verified_at IS NULL
        """))
        conn.commit()
        count = result.rowcount
        print(f"✅ {count} user existing ditandai sebagai email-verified")

    print()
    print("🎉 Migrasi users selesai!")
    print("   User baru yang register setelah ini harus verifikasi email.")


def migrate_return_requested():
    """Tambah kolom return_requested_at ke tabel rentals."""
    print()
    print("🔄 Migrasi: rentals.return_requested_at")
    print("=" * 50)

    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE rentals ADD COLUMN return_requested_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✅ Kolom return_requested_at berhasil ditambahkan ke rentals")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ️  Kolom return_requested_at sudah ada, skip")
            else:
                print(f"⚠️  Error tambah return_requested_at: {e}")


def migrate_drop_payment_columns():
    """Hapus kolom nomor_rekening & foto_qris dari tabel admins (sudah pakai payment gateway)."""
    print()
    print("🔄 Migrasi: drop admins.nomor_rekening & admins.foto_qris")
    print("=" * 50)

    with engine.connect() as conn:
        for col in ("nomor_rekening", "foto_qris"):
            try:
                conn.execute(text(f"ALTER TABLE admins DROP COLUMN IF EXISTS {col}"))
                conn.commit()
                print(f"✅ Kolom admins.{col} berhasil dihapus")
            except Exception as e:
                conn.rollback()
                print(f"⚠️  Error hapus admins.{col}: {e}")


if __name__ == "__main__":
    migrate()
    migrate_return_requested()
    migrate_drop_payment_columns()
    print()
    print("🎉 Semua migrasi selesai!")
