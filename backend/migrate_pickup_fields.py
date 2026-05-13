"""
migrate_pickup_fields.py — Script migrasi database untuk fitur lokasi pickup

Jalankan sekali untuk menambah kolom baru ke database yang sudah ada:
  python migrate_pickup_fields.py

SQLite aman untuk ALTER TABLE ADD COLUMN (tidak butuh downtime).
"""

import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "sewain.db")

MIGRATIONS = [
    # Kolom baru di tabel admins
    "ALTER TABLE admins ADD COLUMN latitude REAL",
    "ALTER TABLE admins ADD COLUMN longitude REAL",

    # Kolom baru di tabel rentals (snapshot pickup)
    "ALTER TABLE rentals ADD COLUMN pickup_alamat TEXT",
    "ALTER TABLE rentals ADD COLUMN pickup_latitude REAL",
    "ALTER TABLE rentals ADD COLUMN pickup_longitude REAL",
    "ALTER TABLE rentals ADD COLUMN pickup_nama_usaha VARCHAR(100)",
    "ALTER TABLE rentals ADD COLUMN pickup_telepon VARCHAR(20)",
    "ALTER TABLE rentals ADD COLUMN diambil_at TIMESTAMP",
]

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    success = 0
    skipped = 0
    
    for sql in MIGRATIONS:
        try:
            cursor.execute(sql)
            print(f"  [OK] {sql}")
            success += 1
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"  [SKIP] Sudah ada: {sql.split('ADD COLUMN')[1].strip().split()[0]}")
                skipped += 1
            else:
                print(f"  [ERR] Error: {e} -> {sql}")
                conn.close()
                raise
    
    conn.commit()
    conn.close()
    print(f"\nMigrasi selesai: {success} kolom ditambah, {skipped} sudah ada.")

if __name__ == "__main__":
    print(f"[*] Menjalankan migrasi ke: {DB_PATH}\n")
    run_migration()
