-- ============================================================
-- migrate_production.sql — Migrasi kolom yang mungkin belum ada
-- di database PostgreSQL production
--
-- Jalankan script ini di database production jika ada error 500
-- di endpoint /rentals/my dan /payments/my
--
-- Cara jalankan:
--   psql $DATABASE_URL -f migrate_production.sql
-- ATAU masuk ke psql lalu copy-paste isi file ini
-- ============================================================

-- ─────────────────────────────────────────────
-- TABEL rentals — kolom baru yang mungkin belum ada
-- ─────────────────────────────────────────────

-- Kolom promo / diskon
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS discount_amount DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS original_amount DOUBLE PRECISION;

-- Kolom snapshot pickup (diisi saat disetujui)
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_alamat TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_latitude DOUBLE PRECISION;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_longitude DOUBLE PRECISION;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_nama_usaha VARCHAR(100);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_telepon VARCHAR(20);

-- Kolom waktu pengambilan & pengembalian
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS diambil_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────────
-- TABEL payments — kolom Midtrans
-- ─────────────────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS midtrans_order_id VARCHAR(100) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS snap_token VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS snap_redirect_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fraud_status VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_notification TEXT;

-- ─────────────────────────────────────────────
-- TABEL users — kolom foto_profil
-- ─────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_profil TEXT;

-- ─────────────────────────────────────────────
-- TABEL admins — kolom koordinat
-- ─────────────────────────────────────────────
ALTER TABLE admins ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ─────────────────────────────────────────────
-- TABEL promo_codes & promo_redemptions
-- (CREATE hanya jika belum ada)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DOUBLE PRECISION NOT NULL,
    max_discount DOUBLE PRECISION,
    min_order DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rental_id INTEGER NOT NULL UNIQUE REFERENCES rentals(id) ON DELETE CASCADE,
    original_amount DOUBLE PRECISION NOT NULL,
    discount_amount DOUBLE PRECISION NOT NULL,
    final_amount DOUBLE PRECISION NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_promo_redemption_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS ix_promo_redemption_promo ON promo_redemptions(promo_code_id);

-- ─────────────────────────────────────────────
-- TABEL wallets & withdrawals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL UNIQUE REFERENCES admins(id) ON DELETE CASCADE,
    saldo DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_pendapatan DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_withdrawn DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    jumlah DOUBLE PRECISION NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    catatan TEXT,
    rejected_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Seed kupon WELCOME50 jika belum ada
-- ─────────────────────────────────────────────
INSERT INTO promo_codes (
    code, nama, deskripsi,
    discount_type, discount_value, max_discount, min_order,
    eligibility, max_uses_per_user, max_total_uses, used_count,
    is_active, is_featured, valid_until
)
SELECT
    'WELCOME50',
    'Promo Pengguna Baru',
    'Diskon 50% untuk transaksi pertama kamu di Sewain. Maksimal potongan Rp 50.000.',
    'percentage', 50, 50000, 0,
    'new_user', 1, NULL, 0,
    TRUE, TRUE, NOW() + INTERVAL '365 days'
WHERE NOT EXISTS (
    SELECT 1 FROM promo_codes WHERE UPPER(code) = 'WELCOME50'
);

-- ─────────────────────────────────────────────
-- Verifikasi: tampilkan kolom rentals & payments
-- ─────────────────────────────────────────────
SELECT 'Kolom tabel rentals:' AS info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rentals' ORDER BY ordinal_position;

SELECT 'Kolom tabel payments:' AS info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position;
