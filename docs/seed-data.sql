-- ============================================================
-- seed-data.sql — Data Awal untuk Database Sewain
-- Jalankan SETELAH tabel dibuat oleh SQLAlchemy (uvicorn main:app)
--
-- CARA PAKAI:
--   psql -U postgres -d data_sewain -f docs/seed-data.sql
-- ============================================================

-- ============================================================
-- 1. USERS
-- Password untuk semua: "Password123!" (hashed bcrypt)
-- Hash ini valid untuk passlib bcrypt
-- ============================================================

INSERT INTO users (email, nama, hashed_password, role, is_active, is_verified) VALUES

-- Super Admin 1
-- Password: SuperAdmin123! (hash dibuat via passlib bcrypt)
('superadmin@sewain.id', 'Super Admin Sewain',
 '$2b$12$9QXR9BuEj00Gp.Do8np5Ue0P2G7otE/DuM9hwPXyXoLTA74nPP98y',
 'super_admin', true, false),

-- Super Admin 2
-- Password: SuperAdmin2@Sewain
('superadmin2@sewain.id', 'Super Admin 2',
 '$2b$12$AdrM0HT3HrKUnqaP36AKXO2NPiNhk0RoYBNYyW4mLsKcNlx2YLqQ.',
 'super_admin', true, false),

-- Admin / Penyedia Barang (2 orang)
('tokojaya@sewain.id', 'Budi Santoso',
 '$2b$12$LCoxfXMD2LL6YNHxEjCGBubRmTD11gfVn3NJEVOwtqoJjnwlqA0aK',
 'admin', true, false),

('rentalbahari@sewain.id', 'Siti Fatimah',
 '$2b$12$LCoxfXMD2LL6YNHxEjCGBubRmTD11gfVn3NJEVOwtqoJjnwlqA0aK',
 'admin', true, false),

-- Users / Penyewa (3 orang)
('penyewa1@student.itk.ac.id', 'Ahmad Fauzi',
 '$2b$12$LCoxfXMD2LL6YNHxEjCGBubRmTD11gfVn3NJEVOwtqoJjnwlqA0aK',
 'user', true, true),

('penyewa2@student.itk.ac.id', 'Dewi Rahayu',
 '$2b$12$LCoxfXMD2LL6YNHxEjCGBubRmTD11gfVn3NJEVOwtqoJjnwlqA0aK',
 'user', true, false),

('penyewa3@student.itk.ac.id', 'Rizky Pratama',
 '$2b$12$LCoxfXMD2LL6YNHxEjCGBubRmTD11gfVn3NJEVOwtqoJjnwlqA0aK',
 'user', true, true);


-- ============================================================
-- 2. ADMIN PROFILES (Profil Usaha)
-- ============================================================

-- Budi Santoso (user_id = 2 → Toko Jaya)
INSERT INTO admins (user_id, nama_usaha, alamat_usaha, nomor_telepon) VALUES
(2, 'Toko Sewa Jaya', 'Jl. Ahmad Yani No.15, Balikpapan Selatan, Kaltim', '082145678901'),
(3, 'Rental Bahari', 'Jl. Sudirman No.88, Balikpapan Kota, Kaltim', '081234567890');


-- ============================================================
-- 3. USER PROFILES (Data Diri Penyewa)
-- ============================================================

INSERT INTO user_profiles (user_id, nama_orang_tua, alamat, latitude, longitude, status_verifikasi) VALUES
-- Ahmad Fauzi (user_id=4) — sudah disetujui
(4, 'Hasan Fauzi', 'Jl. Merdeka No.5, Balikpapan', -1.2654, 116.8312, 'disetujui'),
-- Dewi Rahayu (user_id=5) — masih menunggu
(5, 'Sri Wahyuni', 'Jl. Pandan No.12, Balikpapan', -1.2720, 116.8290, 'menunggu'),
-- Rizky Pratama (user_id=6) — sudah disetujui
(6, 'Agus Pratama', 'Jl. Gunung Sari No.3, Balikpapan', -1.2580, 116.8340, 'disetujui');


-- ============================================================
-- 4. CATEGORIES
-- ============================================================

INSERT INTO categories (nama, deskripsi) VALUES
('Elektronik', 'Perangkat elektronik: laptop, kamera, drone, speaker, dll.'),
('Outdoor & Camping', 'Perlengkapan outdoor: tenda, sleeping bag, carrier, dll.'),
('Kendaraan', 'Kendaraan bermotor: motor, sepeda, skuter, dll.'),
('Fotografi', 'Peralatan fotografi: kamera, lensa, tripod, lighting, dll.'),
('Peralatan Rumah', 'Peralatan rumah tangga: mesin cuci, kulkas portable, AC portable, dll.');


-- ============================================================
-- 5. ITEMS (Barang Sewa)
-- admin_id 1 = Toko Sewa Jaya (Budi Santoso)
-- admin_id 2 = Rental Bahari (Siti Fatimah)
-- ============================================================

-- Barang milik Toko Sewa Jaya (admin_id = 1)
INSERT INTO items (admin_id, category_id, nama, deskripsi, harga_per_hari, stok, status) VALUES
(1, 1, 'Laptop Asus ROG Zephyrus', 'Laptop gaming high-end, RAM 32GB, SSD 1TB, RTX 3070', 350000, 2, 'available'),
(1, 1, 'DJI Mini 3 Pro Drone', 'Drone 4K dengan obstacle sensing, baterai 3 unit, range 12km', 500000, 1, 'available'),
(1, 4, 'Kamera Sony A7III + Lensa 24-70mm', 'Kamera mirrorless full frame, resolusi 24MP, video 4K', 400000, 1, 'available'),
(1, 4, 'GoPro Hero 12 Black', 'Action camera waterproof 4K/60fps, termasuk mounting kit', 150000, 3, 'available'),
(1, 1, 'Speaker JBL Xtreme 3', 'Speaker bluetooth portable waterproof, daya tahan baterai 15 jam', 75000, 2, 'available');

-- Barang milik Rental Bahari (admin_id = 2)
INSERT INTO items (admin_id, category_id, nama, deskripsi, harga_per_hari, stok, status) VALUES
(2, 2, 'Tenda Dome 4 Orang', 'Tenda camping kapasitas 4 orang, tahan angin & hujan, termasuk footprint', 120000, 3, 'available'),
(2, 2, 'Sleeping Bag -5°C', 'Sleeping bag untuk suhu dingin, bahan down synthetic, kompak', 45000, 5, 'available'),
(2, 2, 'Carrier Consina 85L', 'Tas carrier gunung 85 liter, ergonomis, anti-air cover', 60000, 4, 'available'),
(2, 3, 'Motor Honda Vario 160', 'Motor matic terbaru, mesin 160cc, termasuk helm & STNK', 180000, 2, 'available'),
(2, 5, 'AC Portable Midea MPPD-12CRN', 'AC portable 1 PK, cocok untuk kamar 12m², bisa pindah-pindah', 200000, 1, 'available');


-- ============================================================
-- 6. RENTALS (Contoh Transaksi Sewa)
-- user_id 4 = Ahmad Fauzi (verified)
-- user_id 6 = Rizky Pratama (verified)
-- ============================================================

INSERT INTO rentals (user_id, item_id, tanggal_mulai, tanggal_selesai, total_harga, status, catatan) VALUES
-- Ahmad sewa Laptop Asus (item_id=1, harga 350000×3 hari = 1.050.000)
(4, 1, '2026-04-08', '2026-04-11', 1050000, 'pending', 'Butuh untuk presentasi proyek'),
-- Rizky sewa Tenda Dome (item_id=6, harga 120000×5 hari = 600.000) — sudah disetujui
(6, 6, '2026-04-10', '2026-04-15', 600000, 'disetujui', 'Untuk camping di Berau'),
-- Ahmad sewa GoPro (item_id=4, harga 150000×2 hari = 300.000) — sedang disewa
(4, 4, '2026-04-03', '2026-04-05', 300000, 'sedang_disewa', 'Untuk dokumentasi event kampus');


-- ============================================================
-- Verifikasi data
-- ============================================================

SELECT 'Users:' AS info, count(*) AS total FROM users
UNION ALL
SELECT 'Admin Profiles:', count(*) FROM admins
UNION ALL
SELECT 'User Profiles:', count(*) FROM user_profiles
UNION ALL
SELECT 'Categories:', count(*) FROM categories
UNION ALL
SELECT 'Items:', count(*) FROM items
UNION ALL
SELECT 'Rentals:', count(*) FROM rentals;
