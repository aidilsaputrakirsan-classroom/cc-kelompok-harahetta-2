# 🎙️ Outline Presentasi & Demo UAS Komputasi Awan — Sewain Platform

**Kelompok:** Harahetta-2 (Sistem Informasi, Institut Teknologi Kalimantan)

**Arsitektur Sistem:** Monolith Terstruktur

**Durasi Total:** ~30 Menit (Estimasi: 12 Menit Presentasi/Demo + 18 Menit Tanya Jawab/Viva)

---

# ⏱️ Rencana Pembagian Waktu (Time Management)

```text
[00:00 - 02:00]  Slide Singkat: Profil Tim & Arsitektur Monolith Produksi (2 Menit)
[02:00 - 07:00]  Live Demo: Aplikasi Produksi (5 Menit) - *Fokus Fitur & Health*
[07:00 - 09:30]  Live Demo: CI/CD Pipeline, Smart Deploy, & Otomasi (2.5 Menit)
[09:30 - 11:00]  Dokumentasi, Swagger, & Best Practices Code (1.5 Menit)
[11:00 - 30:00]  Sesi Tanya Jawab & Viva Individual (19 Menit)
```

---

# 📂 Detail Skenario Demo

# Bagian 1: Pengenalan & Arsitektur Monolith (Maksimal 2 Menit)

**Presenter:** Perwakilan Kelompok (Disarankan yang menguasai sistem secara keseluruhan)

## Slide 1: Judul Proyek & Anggota Tim

Sebutkan nama aplikasi (Sewain), perkenalkan seluruh anggota tim beserta kontribusinya:

- Achmad Zaki Zaidan (Lead Frontend & UI/UX Designer)
- Riqqah Khalda Karina (Lead QA & Docs)
- Djaky Abbyyu Fauzan Timumum (Lead Backend & Database Engineer)
- Muhammad Alif Setiawan (Lead DevOps & CI/CD Specialist)

## Slide 2: Arsitektur Monolith Produksi

Tunjukkan diagram arsitektur monolitik yang saat ini aktif berjalan di DeployCC:

### 3 Containers Strategy

1. frontend: SPA React 19 + Vite 7.3 (Port 3000 -> 80)
2. backend: FastAPI + Uvicorn (Port 8000)
3. monolith-db: PostgreSQL 16 (Port 15432)

### Integritas Data

Satu database terpusat dengan 14 tabel relasional yang saling terhubung ketat menggunakan foreign keys untuk menghindari anomali data sewa.

### Fitur Terintegrasi

Logika obrolan (live-chat) WebSocket, Asisten AI (chatbot Gemini), dan Payment Gateway Midtrans disatukan di dalam basis kode monolith yang efisien.

---

# Bagian 2: Live Demo — Aplikasi Produksi (5 Menit)

**Presenter:** Navigator Demo (Menampilkan layar aplikasi publik)

## Skenario Demo Beruntun (The 5-Minute Flow)

### Akses Browser Bersih

Buka browser dalam mode Incognito/Private langsung ke tautan produksi aplikasi Sewain di DeployCC.

**Tujuan:** Membuktikan aplikasi sudah online secara publik dan responsif.

### Proteksi Halaman (Autentikasi Stateless JWT)

Coba akses halaman Dashboard Admin, Toko, atau riwayat sewa secara langsung lewat URL tanpa masuk (login).

**Tunjukkan:** Sistem menolaknya dengan mengarahkan paksa pengguna kembali ke halaman login (keamanan token JWT bekerja).

### Registrasi User & Verifikasi KYC (Upload KTP + Selfie)

Daftarkan satu user penyewa baru. Tunjukkan antarmuka pengunggahan dokumen KYC (KTP + foto diri/selfie).

Masuk menggunakan akun Super Admin untuk memverifikasi dan menyetujui dokumen KYC user tersebut agar user dapat mulai menyewa barang.

### Operasi CRUD Lengkap & Pencarian Pintar (Poin Utama)

Masuk sebagai Admin Toko, buat barang baru (Create), lalu ubah informasi harga/stok (Update).

Masuk sebagai Penyewa, cari barang tersebut di kolom pencarian (Read/Search), ajukan sewa, lalu batalkan sewa (Delete/Cancel) untuk menunjukkan siklus CRUD yang utuh.

### Simulasi Transaksi & Live Chat

#### Simulasi Pembayaran

Lakukan pengajuan sewa, gunakan kode promo internal, lalu tunjukkan integrasi Midtrans Snap Popup untuk simulasi pembayaran QRIS/Virtual Account.

#### WebSocket & Chatbot AI

Tunjukkan obrolan langsung (live-chat) real-time antar pengguna serta interaksi asisten chatbot cerdas berbasis Gemini AI.

### Health Check, Correlation ID, & Data Persistence

Buka endpoint `/health` untuk menunjukkan status koneksi database yang terhubung langsung.

Tunjukkan JSON log yang berputar di terminal: tunjukkan Correlation ID (`X-Correlation-ID`) yang merekam request masuk hingga ke query database.

#### Uji Presistensi

Input data barang baru, lakukan restart cepat container backend via panel DeployCC, lalu tunjukkan bahwa data barang tersebut tidak hilang (database persisten pada volume eksternal).

---

# Bagian 3: CI/CD Pipeline & Otomasi (2.5 Menit)

**Presenter:** Insinyur DevOps Kelompok

## Langkah Demo Pipeline

### Tunjukkan Berkas Workflow GitHub Actions

Buka repositori GitHub Anda dan perlihatkan isi file:

- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

Jelaskan alur integrasi:

```text
Linter (Flake8 & ESLint)
        ↓
Unit Tests (Pytest ≥ 50% coverage & Vitest)
        ↓
Build Docker
        ↓
Deploy Webhook
```

### Live Push & Pengujian Otomatis

Buka VS Code lokal, ubah sebaris kode minor di frontend (misalnya mengubah teks versi di footer atau judul tombol).

Lakukan commit dan push perubahan tersebut ke cabang utama (`main`).

Tunjukkan di browser bahwa GitHub Actions langsung terpicu, menjalankan unit testing, dan semuanya lolos (green pass).

### Demonstrasi Fitur "Smart Deploy"

Jelaskan ke penguji:

> "Jika kami hanya mengedit dokumentasi (seperti file .md atau /docs), pipeline CD kami cukup pintar untuk mendeteksi perubahan tersebut dan melewati (skip) proses build Docker serta restart server untuk menghemat waktu."

### Verifikasi Rilis

Muat ulang halaman web produksi untuk membuktikan bahwa perubahan kosmetik tadi sudah live dan berjalan tanpa downtime (zero-downtime deployment).

---

# Bagian 4: Dokumentasi & Struktur Kode (1.5 Menit)

**Presenter:** Penanggung Jawab Dokumentasi

## Poin Repositori yang Ditunjukkan

### README Lengkap

Tunjukkan kelengkapan informasi, skema database, roadmap, dan cara menjalankan proyek secara lokal.

### Swagger API Docs

Akses endpoint `/docs` atau `/redoc` milik backend FastAPI untuk menunjukkan kontrak API yang terdokumentasi rapi.

### Dokumentasi Terstruktur

Tunjukkan folder `/docs` yang berisi dokumen arsitektur monolith (`architecture.md`) serta dokumen operasional (`operations-guide.md`) yang saat ini terbuka di layar.

### Keamanan Konfigurasi

Buka berkas `docker-compose.yml` untuk membuktikan bahwa variabel sensitif seperti password database dan API Key Midtrans/Gemini disembunyikan menggunakan variabel lingkungan (`.env`), bukan ditulis langsung (hardcoded).

---

# Bagian 5: Sesi Tanya Jawab / Viva Individual (19 Menit)

**Fokus:** Menguji pemahaman pribadi dan kontribusi masing-masing anggota.