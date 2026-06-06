"""
migrate_promo_fields.py — Tambah tabel promo_codes & promo_redemptions, dan
kolom promo_code_id / discount_amount / original_amount ke tabel rentals.

Jalankan dari folder backend:
    python migrate_promo_fields.py

Skrip mendeteksi otomatis SQLite vs PostgreSQL dan idempoten:
- Tabel/kolom yang sudah ada akan di-skip.
- Seed kupon default WELCOME50 hanya di-insert jika belum ada.
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL tidak ditemukan di .env!")

is_sqlite = DATABASE_URL.startswith("sqlite")
FLOAT_TYPE = "REAL" if is_sqlite else "DOUBLE PRECISION"
TIMESTAMP_TYPE = "TIMESTAMP" if is_sqlite else "TIMESTAMP WITH TIME ZONE"
BOOL_TYPE = "INTEGER" if is_sqlite else "BOOLEAN"
BOOL_TRUE = "1" if is_sqlite else "TRUE"
BOOL_FALSE = "0" if is_sqlite else "FALSE"


# ────────────────────────────────────────────────────────────
# DDL: tabel baru
# ────────────────────────────────────────────────────────────

CREATE_PROMO_CODES_SQLITE = """
CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    max_discount REAL,
    min_order REAL NOT NULL DEFAULT 0,
    eligibility VARCHAR(20) NOT NULL DEFAULT 'all',
    max_uses_per_user INTEGER NOT NULL DEFAULT 1,
    max_total_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_featured INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
)
"""

CREATE_PROMO_CODES_PG = """
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DOUBLE PRECISION NOT NULL,
    max_discount DOUBLE PRECISION,
    min_order DOUBLE PRECISION NOT NULL DEFAULT 0,
    eligibility VARCHAR(20) NOT NULL DEFAULT 'all',
    max_uses_per_user INTEGER NOT NULL DEFAULT 1,
    max_total_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"""

CREATE_PROMO_REDEMPTIONS_SQLITE = """
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promo_code_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rental_id INTEGER NOT NULL UNIQUE,
    original_amount REAL NOT NULL,
    discount_amount REAL NOT NULL,
    final_amount REAL NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
)
"""

CREATE_PROMO_REDEMPTIONS_PG = """
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rental_id INTEGER NOT NULL UNIQUE REFERENCES rentals(id) ON DELETE CASCADE,
    original_amount DOUBLE PRECISION NOT NULL,
    discount_amount DOUBLE PRECISION NOT NULL,
    final_amount DOUBLE PRECISION NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"""

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS ix_promo_redemption_user ON promo_redemptions(user_id)",
    "CREATE INDEX IF NOT EXISTS ix_promo_redemption_promo ON promo_redemptions(promo_code_id)",
]


# Kolom yang ditambahkan ke tabel rentals
RENTAL_COLUMNS = [
    ("rentals", "promo_code_id", "INTEGER"),
    ("rentals", "discount_amount", FLOAT_TYPE),
    ("rentals", "original_amount", FLOAT_TYPE),
]


def run_migration():
    engine = create_engine(DATABASE_URL)
    print(f"[*] Target DB: {'SQLite' if is_sqlite else 'PostgreSQL'}")
    print(f"[*] URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}\n")

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    # ── 1. Buat tabel promo_codes
    print("=== Tabel promo_codes ===")
    with engine.begin() as conn:
        if "promo_codes" in existing_tables:
            print("  [SKIP] Tabel promo_codes sudah ada")
        else:
            sql = CREATE_PROMO_CODES_SQLITE if is_sqlite else CREATE_PROMO_CODES_PG
            conn.execute(text(sql))
            print("  [OK]   Tabel promo_codes dibuat")

    # ── 2. Buat tabel promo_redemptions
    print("\n=== Tabel promo_redemptions ===")
    with engine.begin() as conn:
        # Re-inspect karena baru saja CREATE
        inspector2 = inspect(engine)
        if "promo_redemptions" in inspector2.get_table_names():
            print("  [SKIP] Tabel promo_redemptions sudah ada")
        else:
            sql = CREATE_PROMO_REDEMPTIONS_SQLITE if is_sqlite else CREATE_PROMO_REDEMPTIONS_PG
            conn.execute(text(sql))
            print("  [OK]   Tabel promo_redemptions dibuat")

        for stmt in INDEX_STATEMENTS:
            try:
                conn.execute(text(stmt))
                print(f"  [OK]   {stmt}")
            except Exception as e:
                print(f"  [ERR]  {stmt} → {e}")

    # ── 3. Tambah kolom di tabel rentals
    print("\n=== Kolom baru di tabel rentals ===")
    inspector3 = inspect(engine)
    try:
        rental_existing_cols = {c["name"] for c in inspector3.get_columns("rentals")}
    except Exception as e:
        print(f"[X] Gagal membaca kolom tabel 'rentals': {e}")
        return

    added = skipped = 0
    with engine.begin() as conn:
        for table, col_name, col_type in RENTAL_COLUMNS:
            if col_name in rental_existing_cols:
                print(f"  [SKIP] {table}.{col_name} sudah ada")
                skipped += 1
                continue
            sql = f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"
            try:
                conn.execute(text(sql))
                print(f"  [OK]   {sql}")
                added += 1
            except Exception as e:
                print(f"  [ERR]  {sql} → {e}")

    # ── 4. Seed kupon default WELCOME50
    print("\n=== Seed kupon default WELCOME50 ===")
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id FROM promo_codes WHERE code = :code"),
            {"code": "WELCOME50"},
        ).first()

        if existing:
            print("  [SKIP] WELCOME50 sudah ada")
        else:
            valid_until = datetime.utcnow() + timedelta(days=365)
            insert_sql = f"""
                INSERT INTO promo_codes (
                    code, nama, deskripsi,
                    discount_type, discount_value, max_discount, min_order,
                    eligibility, max_uses_per_user, max_total_uses, used_count,
                    is_active, is_featured, valid_from, valid_until
                ) VALUES (
                    :code, :nama, :deskripsi,
                    'percentage', 50, 50000, 0,
                    'new_user', 1, NULL, 0,
                    {BOOL_TRUE}, {BOOL_TRUE}, NULL, :valid_until
                )
            """
            conn.execute(
                text(insert_sql),
                {
                    "code": "WELCOME50",
                    "nama": "Promo Pengguna Baru",
                    "deskripsi": "Diskon 50% untuk transaksi pertama kamu di Sewain. Maksimal potongan Rp 50.000.",
                    "valid_until": valid_until,
                },
            )
            print("  [OK]   Kupon WELCOME50 berhasil di-seed")

    print(f"\nSelesai: {added} kolom rentals ditambahkan, {skipped} sudah ada.")


if __name__ == "__main__":
    run_migration()
