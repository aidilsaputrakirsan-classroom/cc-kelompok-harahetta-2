"""
backfill_pickup_data.py — Isi ulang data pickup di rentals lama yang sudah disetujui
tapi belum punya data pickup (karena dibuat sebelum fitur snapshot ditambahkan).

Cara pakai:
  python backfill_pickup_data.py

Script ini AMAN dijalankan berkali-kali (hanya update yang pickup_latitude masih NULL).
"""

import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "sewain.db")

def run_backfill():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Ambil semua rental yang sudah disetujui / sedang disewa / selesai
    # tapi belum punya data pickup
    cursor.execute("""
        SELECT
            r.id AS rental_id,
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
                pickup_alamat       = ?,
                pickup_latitude     = ?,
                pickup_longitude    = ?,
                pickup_nama_usaha   = ?,
                pickup_telepon      = ?
            WHERE id = ?
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
    conn.close()
    print(f"\nSelesai: {updated} rental diupdate, {skipped} dilewati (admin belum isi koordinat).")

if __name__ == "__main__":
    print(f"[*] Backfill pickup data ke: {DB_PATH}\n")
    run_backfill()
