"""
migrate_midtrans_fields.py — Tambah kolom Midtrans ke tabel payments.

Jalankan sekali dari folder backend:
    python migrate_midtrans_fields.py

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
    raise SystemExit("DATABASE_URL tidak ditemukan di .env")


# (column_name, column_type_sql)
COLUMNS = [
    ("midtrans_order_id",       "VARCHAR(100)"),
    ("midtrans_transaction_id", "VARCHAR(100)"),
    ("snap_token",              "VARCHAR(255)"),
    ("snap_redirect_url",       "TEXT"),
    ("payment_channel",         "VARCHAR(50)"),
    ("fraud_status",            "VARCHAR(20)"),
    ("raw_notification",        "TEXT"),
]


def ensure_enum_value_postgres(conn, enum_name: str, value: str) -> None:
    """
    Pastikan value ada di enum Postgres (untuk paymentmethod: midtrans).
    Jalankan ALTER TYPE ... ADD VALUE IF NOT EXISTS.
    """
    conn.exec_driver_sql(
        f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"
    )


def run_migration():
    engine = create_engine(DATABASE_URL)
    is_sqlite = DATABASE_URL.startswith("sqlite")
    print(f"[*] Target DB: {'SQLite' if is_sqlite else 'PostgreSQL'}")
    print(f"[*] URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

    inspector = inspect(engine)
    try:
        existing_cols = {c["name"] for c in inspector.get_columns("payments")}
    except Exception as e:  # noqa: BLE001
        print(f"[X] Gagal membaca kolom tabel 'payments': {e}")
        return

    added = skipped = 0

    with engine.begin() as conn:
        # 1. Tambah kolom-kolom Midtrans
        for name, coltype in COLUMNS:
            if name in existing_cols:
                print(f"  [SKIP] Kolom '{name}' sudah ada")
                skipped += 1
                continue
            sql = f"ALTER TABLE payments ADD COLUMN {name} {coltype}"
            try:
                conn.exec_driver_sql(sql)
                print(f"  [OK]   {sql}")
                added += 1
            except Exception as e:  # noqa: BLE001
                print(f"  [ERR]  {sql} → {e}")

        # 2. Tambah unique index untuk midtrans_order_id (untuk lookup webhook cepat)
        try:
            conn.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_midtrans_order_id "
                "ON payments (midtrans_order_id)"
            )
            print("  [OK]   CREATE UNIQUE INDEX ix_payments_midtrans_order_id")
        except Exception as e:  # noqa: BLE001
            print(f"  [WARN] Gagal membuat index: {e}")

        # 3. Postgres: tambahkan value 'midtrans' ke enum paymentmethod
        if not is_sqlite:
            try:
                ensure_enum_value_postgres(conn, "paymentmethod", "midtrans")
                print("  [OK]   ALTER TYPE paymentmethod ADD VALUE 'midtrans'")
            except Exception as e:  # noqa: BLE001
                print(f"  [WARN] Gagal alter enum paymentmethod: {e}")

    print(f"\nSelesai: {added} kolom ditambahkan, {skipped} sudah ada.")


if __name__ == "__main__":
    run_migration()
