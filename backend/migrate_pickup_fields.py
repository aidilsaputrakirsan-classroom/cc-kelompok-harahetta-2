"""
migrate_pickup_fields.py — Tambah kolom pickup/lokasi ke tabel admins & rentals.

Jalankan sekali dari folder backend:
    python migrate_pickup_fields.py

Skrip mendeteksi otomatis apakah DATABASE_URL menunjuk ke SQLite atau
PostgreSQL, dan memakai sintaks ALTER TABLE yang sesuai. Semua ALTER
idempoten: kolom yang sudah ada akan di-skip.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL tidak ditemukan di .env!")

is_sqlite = DATABASE_URL.startswith("sqlite")
FLOAT_TYPE = "REAL" if is_sqlite else "DOUBLE PRECISION"
TIMESTAMP_TYPE = "TIMESTAMP" if is_sqlite else "TIMESTAMP WITH TIME ZONE"

# (table, column_name, column_type)
COLUMNS = [
    # Kolom baru di tabel admins
    ("admins", "latitude", FLOAT_TYPE),
    ("admins", "longitude", FLOAT_TYPE),
    # Kolom baru di tabel rentals (snapshot pickup)
    ("rentals", "pickup_alamat", "TEXT"),
    ("rentals", "pickup_latitude", FLOAT_TYPE),
    ("rentals", "pickup_longitude", FLOAT_TYPE),
    ("rentals", "pickup_nama_usaha", "VARCHAR(100)"),
    ("rentals", "pickup_telepon", "VARCHAR(20)"),
    ("rentals", "diambil_at", TIMESTAMP_TYPE),
]


def run_migration():
    engine = create_engine(DATABASE_URL)
    print(f"[*] Target DB: {'SQLite' if is_sqlite else 'PostgreSQL'}")
    print(f"[*] URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}\n")

    inspector = inspect(engine)

    # Ambil kolom existing per tabel
    existing = {}
    for table in ("admins", "rentals"):
        try:
            existing[table] = {c["name"] for c in inspector.get_columns(table)}
        except Exception as e:
            print(f"[X] Gagal membaca kolom tabel '{table}': {e}")
            return

    added = skipped = 0

    with engine.begin() as conn:
        for table, col_name, col_type in COLUMNS:
            if col_name in existing[table]:
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

    print(f"\nSelesai: {added} kolom ditambahkan, {skipped} sudah ada.")


if __name__ == "__main__":
    run_migration()
