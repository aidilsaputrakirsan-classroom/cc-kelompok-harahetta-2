"""
migrate_add_lat_long.py
Sinkronisasi schema database production dengan model terbaru.
Jalankan di server: python migrate_add_lat_long.py
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # fallback: hardcode jika .env tidak ada
    DATABASE_URL = "postgresql://postgres:1@localhost:5432/cc_kelompok_harahetta_2_db"

engine = create_engine(DATABASE_URL)

migrations = [
    # ── admins table ──────────────────────────────────────────
    ("admins.latitude",
     "ALTER TABLE admins ADD COLUMN IF NOT EXISTS latitude FLOAT"),
    ("admins.longitude",
     "ALTER TABLE admins ADD COLUMN IF NOT EXISTS longitude FLOAT"),
    ("admins.nomor_rekening",
     "ALTER TABLE admins ADD COLUMN IF NOT EXISTS nomor_rekening VARCHAR(100)"),
    ("admins.foto_qris",
     "ALTER TABLE admins ADD COLUMN IF NOT EXISTS foto_qris TEXT"),

    # ── items table ───────────────────────────────────────────
    # Buat ENUM type dulu (idempotent)
    ("itemstatus enum type", """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itemstatus') THEN
                CREATE TYPE itemstatus AS ENUM ('available', 'rented', 'unavailable');
            END IF;
        END $$
    """),
    ("items.status column", """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='items' AND column_name='status'
            ) THEN
                ALTER TABLE items ADD COLUMN status itemstatus NOT NULL DEFAULT 'available';
            END IF;
        END $$
    """),
    ("items.updated_at",
     "ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
    ("items.foto_url to TEXT", """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='items' AND column_name='foto_url'
                AND data_type = 'character varying'
            ) THEN
                ALTER TABLE items ALTER COLUMN foto_url TYPE TEXT;
            END IF;
        END $$
    """),

    # ── rentals table ─────────────────────────────────────────
    ("rentals.pickup_alamat",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_alamat TEXT"),
    ("rentals.pickup_latitude",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_latitude FLOAT"),
    ("rentals.pickup_longitude",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_longitude FLOAT"),
    ("rentals.pickup_nama_usaha",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_nama_usaha VARCHAR(100)"),
    ("rentals.pickup_telepon",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_telepon VARCHAR(20)"),
    ("rentals.diambil_at",
     "ALTER TABLE rentals ADD COLUMN IF NOT EXISTS diambil_at TIMESTAMP WITH TIME ZONE"),

    # ── payments midtrans fields ──────────────────────────────
    ("payments.snap_token",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS snap_token VARCHAR(255)"),
    ("payments.snap_redirect_url",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS snap_redirect_url TEXT"),
    ("payments.payment_channel",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50)"),
    ("payments.fraud_status",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS fraud_status VARCHAR(20)"),
    ("payments.raw_notification",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_notification TEXT"),
    ("payments.midtrans_transaction_id",
     "ALTER TABLE payments ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100)"),

    # ── wallets table ─────────────────────────────────────────
    ("wallets table", """
        CREATE TABLE IF NOT EXISTS wallets (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL UNIQUE REFERENCES admins(id) ON DELETE CASCADE,
            saldo FLOAT NOT NULL DEFAULT 0.0,
            total_pendapatan FLOAT NOT NULL DEFAULT 0.0,
            total_withdrawn FLOAT NOT NULL DEFAULT 0.0,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """),

    # ── withdrawals table ─────────────────────────────────────
    ("withdrawalstatus enum type", """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawalstatus') THEN
                CREATE TYPE withdrawalstatus AS ENUM ('pending', 'processing', 'completed', 'rejected');
            END IF;
        END $$
    """),
    ("withdrawals table", """
        CREATE TABLE IF NOT EXISTS withdrawals (
            id SERIAL PRIMARY KEY,
            wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
            admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
            jumlah FLOAT NOT NULL,
            bank_name VARCHAR(50) NOT NULL,
            account_number VARCHAR(50) NOT NULL,
            account_holder VARCHAR(100) NOT NULL,
            status withdrawalstatus NOT NULL DEFAULT 'pending',
            catatan TEXT,
            rejected_reason TEXT,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """),
]

print("=" * 60)
print("Sewain DB Migration")
db_display = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
print(f"Database: {db_display}")
print("=" * 60)

passed = 0
failed = 0

with engine.connect() as conn:
    for name, sql in migrations:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"  [OK] {name}")
            passed += 1
        except Exception as e:
            conn.rollback()
            print(f"  [SKIP/ERR] {name}: {e}")
            failed += 1

print("=" * 60)
print(f"Selesai: {passed} OK, {failed} gagal/dilewati")
if failed == 0:
    print("✅ Semua migration berhasil! Restart backend sekarang.")
else:
    print("⚠️  Ada yang gagal — cek pesan di atas.")
