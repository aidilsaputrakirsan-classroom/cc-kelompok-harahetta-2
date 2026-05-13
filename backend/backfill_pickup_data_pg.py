"""
backfill_pickup_data_pg.py — Isi ulang data pickup di rentals lama (PostgreSQL)
untuk rental yang sudah disetujui tapi belum punya koordinat pickup.

Cara pakai:
  python backfill_pickup_data_pg.py

Script ini AMAN dijalankan berkali-kali (hanya update yang pickup_latitude IS NULL).
Requires: pip install psycopg2-binary
"""

import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Konfigurasi koneksi ───────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:setiawan@localhost:15432/data_sewain")
# ──────────────────────────────────────────────────────────────────────────

def run_backfill():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Ambil semua rental yang sudah disetujui/sedang_disewa/selesai
    # tapi belum punya data pickup_latitude
    cursor.execute("""
        SELECT
            r.id            AS rental_id,
            r.item_id,
            i.admin_id,
            ap.alamat_usaha,
            ap.latitude,
            ap.longitude,
            ap.nama_usaha,
            ap.nomor_telepon
        FROM rentals r
        JOIN items i ON i.id = r.item_id
        JOIN admins ap ON ap.id = i.admin_id
        WHERE r.status IN ('disetujui', 'sedang_disewa', 'selesai')
          AND r.pickup_latitude IS NULL
    """)

    rows = cursor.fetchall()
    print(f"[*] Ditemukan {len(rows)} rental yang perlu diisi ulang data pickup.\n")

    updated = 0
    skipped = 0

    for row in rows:
        if not row["latitude"] or not row["longitude"]:
            print(f"  [SKIP] Rental #{row['rental_id']} — Admin (id={row['admin_id']}) belum isi koordinat")
            skipped += 1
            continue

        cursor.execute("""
            UPDATE rentals
            SET
                pickup_alamat       = %s,
                pickup_latitude     = %s,
                pickup_longitude    = %s,
                pickup_nama_usaha   = %s,
                pickup_telepon      = %s
            WHERE id = %s
        """, (
            row["alamat_usaha"],
            row["latitude"],
            row["longitude"],
            row["nama_usaha"],
            row["nomor_telepon"],
            row["rental_id"],
        ))
        print(f"  [OK] Rental #{row['rental_id']} -> lat={row['latitude']}, lng={row['longitude']}, usaha='{row['nama_usaha']}'")
        updated += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\nSelesai: {updated} rental diupdate, {skipped} dilewati (admin belum isi koordinat).")

# ─── Juga jalankan migration kolom baru jika belum ada ────────────────────
def ensure_columns():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    migrations = [
        # Kolom di tabel admins
        ("admins", "latitude",          "ALTER TABLE admins ADD COLUMN latitude DOUBLE PRECISION"),
        ("admins", "longitude",         "ALTER TABLE admins ADD COLUMN longitude DOUBLE PRECISION"),
        # Kolom di tabel rentals
        ("rentals", "pickup_alamat",       "ALTER TABLE rentals ADD COLUMN pickup_alamat TEXT"),
        ("rentals", "pickup_latitude",     "ALTER TABLE rentals ADD COLUMN pickup_latitude DOUBLE PRECISION"),
        ("rentals", "pickup_longitude",    "ALTER TABLE rentals ADD COLUMN pickup_longitude DOUBLE PRECISION"),
        ("rentals", "pickup_nama_usaha",   "ALTER TABLE rentals ADD COLUMN pickup_nama_usaha VARCHAR(100)"),
        ("rentals", "pickup_telepon",      "ALTER TABLE rentals ADD COLUMN pickup_telepon VARCHAR(20)"),
        ("rentals", "diambil_at",          "ALTER TABLE rentals ADD COLUMN diambil_at TIMESTAMP"),
    ]

    print("[*] Cek dan tambah kolom baru jika belum ada...\n")
    for table, col, sql in migrations:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
        """, (table, col))
        if cursor.fetchone():
            print(f"  [SKIP] {table}.{col} sudah ada")
        else:
            cursor.execute(sql)
            print(f"  [OK]   {table}.{col} ditambahkan")

    conn.commit()
    cursor.close()
    conn.close()
    print()

if __name__ == "__main__":
    print(f"[*] Koneksi ke PostgreSQL menggunakan DATABASE_URL dari .env\n")
    ensure_columns()
    run_backfill()
