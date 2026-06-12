# 🚀 Catatan Rilis (Release Notes) — Milestone 3 (Final)

# 🎯 Perjalanan Pengembangan Arsitektur

Pengembangan platform Sewain oleh Kelompok Harahetta-2 telah diselesaikan melalui tiga tahapan pencapaian (milestones) utama. Perjalanan ini mencerminkan transisi sistem dari aplikasi sederhana hingga menjadi sistem matang yang siap produksi sekaligus memiliki kesiapan arsitektur skala besar (microservices-ready).

```text
[MILESTONE 1]                 [MILESTONE 2]                 [MILESTONE 3] (Rilis Final)
Monolithic Foundation     ──► Containerized App     ──►   Structured Monolith (Production)
- 1 Core Backend              - Docker Compose            - Modular Monolith (DeployCC)
- 1 PostgreSQL DB             - Automated CI/CD           - Experimental Microservices Lab
- Manual Deployment           - Zero-Downtime Deploy      - Enterprise Integrations (Midtrans & AI)
```

---

# Milestone 1 — Foundation (Pondasi Aplikasi)

Fokus awal adalah membangun fungsionalitas dasar bisnis persewaan barang. Kami mengembangkan backend monolitik menggunakan FastAPI, frontend interaktif menggunakan React, serta satu database relasional PostgreSQL. Seluruh integrasi REST API, manajemen token, dan visualisasi data dipastikan berjalan secara lokal.

# Milestone 2 — Containerization & DevOps (Kontainerisasi)

Kami mengemas seluruh komponen aplikasi ke dalam kontainer menggunakan Docker dan mengotomatisasikan orkestrasinya lewat Docker Compose. Pada tahap ini, jalur otomatisasi CI/CD menggunakan GitHub Actions diaktifkan untuk menjalankan pengujian otomatis (linter, unit testing frontend/backend) sebelum merilis pembaruan ke server secara otomatis.

# Milestone 3 — Production Monolith & Experimental Microservices (Skalabilitas & Integrasi)

Rilis final ini menandai puncak arsitektur Sewain dengan pendekatan ganda yang taktis:

## Sistem Produksi Utama (Structured Monolith)

Untuk efisiensi penggunaan sumber daya server awan (cloud resource), kemudahan pemeliharaan, serta jaminan konsistensi transaksi keuangan, sistem yang berjalan aktif di lingkungan produksi (DeployCC) adalah Monolith Terstruktur.

## Modul Eksperimen (Microservices Lab)

Untuk memenuhi target pembelajaran akademis Cloud Computing, kami juga berhasil mendekomposisikan kode backend menjadi 6 Microservices independen (berada di folder `/services`) lengkap dengan skema Database per Service, Nginx API gateway, dan ketahanan jaringan (network resilience).

---

# 🆕 Fitur Baru dan Peningkatan pada Milestone 3

# 1. Dual-Architecture Capability (Kemampuan Arsitektur Ganda)

Kami menstrukturkan basis kode agar mendukung dua model eksekusi:

## Monolith Terstruktur (Aktif di Produksi)

Satu layanan FastAPI terintegrasi yang mengelola seluruh modul bisnis secara modular (direktori `/auth`, `/items`, `/rentals`, `/payments`, dan `/chats`) dengan menggunakan satu database PostgreSQL terpusat berisi 14 tabel relasional.

## Microservices Eksperimental (Modul Pembelajaran)

Enam layanan independen yang didekomposisikan untuk berjalan di portnya masing-masing:

| Service | Port Host | Fungsi Utama & Tanggung Jawab |
|----------|-----------|-------------------------------|
| Auth Service | 8001 | Autentikasi, otorisasi token JWT, dan verifikasi dokumen KYC. |
| Item Service | 8002 | CRUD katalog barang, kategori, serta koordinat GPS toko. |
| Rental Service | 8003 | Alur transaksi penyewaan, kode promo, dan kalkulasi diskon. |
| Payment Service | 8004 | Integrasi webhook Midtrans, wallet saldo, dan penarikan dana. |
| Chat Service | 8005 | Alur komunikasi obrolan real-time berbasis WebSockets. |
| Chatbot Service | 8006 | Layanan asisten cerdas berbasis Gemini AI (via OpenAI SDK). |

Layanan mikro ini menerapkan pola Database per Service dengan menggunakan lima basis data PostgreSQL terpisah demi menjamin isolasi data maksimal.

---

# 2. Peningkatan Keamanan Sistem Produksi

Beberapa mekanisme keamanan tingkat lanjut (enterprise-grade) telah diterapkan pada sistem:

- **Rate Limiting:** Pada skenario microservices, kami mengonfigurasi Nginx API Gateway untuk membatasi laju request demi menghindari serangan DDoS (5 req/s untuk auth, 20 req/s untuk transaksi). Pada versi monolith produksi, limitasi ini dijaga dengan middleware FastAPI.

- **Stateless JWT Authentication:** Pengamanan akses halaman sensitif (seperti dashboard admin/toko) divalidasi langsung di sisi server secara stateless menggunakan JWT token.

- **Keamanan Kredensial:** Seluruh data sensitif (seperti kunci privat Midtrans API dan API Key Gemini AI) disembunyikan menggunakan variabel lingkungan (`.env`) yang dilindungi dengan GitHub Secrets di pipeline deployment.

- **Sistem Verifikasi KYC (Know Your Customer):** Mewajibkan penyewa baru untuk mengunggah berkas KTP dan foto diri (selfie) yang harus diverifikasi secara manual oleh Super Admin sebelum diizinkan bertransaksi.

---

# 3. Keandalan dan Ketahanan Sistem (Resilience)

Khusus pada modul eksperimen microservices (folder `/services`), kami menambahkan pustaka ketahanan jaringan untuk menangani kegagalan komunikasi antarkontainer:

- **Circuit Breaker:** Memutuskan aliran request secara sementara jika suatu service tujuan mengalami kegagalan beruntun agar server utama tidak mengalami crash total.

- **Automatic Retry with Exponential Backoff:** Melakukan pengiriman ulang request otomatis hingga 3 kali dengan jeda waktu yang meningkat jika terjadi gangguan koneksi sementara (network glitches).

---

# 4. Integrasi Layanan Pihak Ketiga

- **Midtrans Payment Gateway:** Integrasi penuh yang aman dengan Midtrans Snap API untuk memproses transaksi digital secara instan via QRIS, GoPay, ShopeePay, dan Virtual Account Bank. Webhook dilindungi menggunakan verifikasi Signature Key dari Midtrans.

- **Asisten Virtual Gemini AI:** Integrasi cerdas dengan AI generatif Google Gemini yang bertindak sebagai asisten virtual untuk membantu menyaring rekomendasi barang sewaan kepada pengguna.

---

# 5. Monitoring dan Observabilitas Terpadu

- **Structured JSON Logging:** Menghasilkan log server terstruktur dalam format JSON di lingkungan produksi.

- **Correlation ID Tracing:** Menyuntikkan `X-Correlation-ID` unik di setiap request untuk memudahkan pelacakan alur eksekusi dari klien hingga ke database monolith.

- **Metrics Endpoint:** Menyediakan endpoint `/metrics` untuk memantau performa latensi respons (persentil p50, p95, p99) serta tingkat error aplikasi.

---

# 📊 Statistik Pengembangan Milestone 3

| Metrik Pengembangan | Nilai pada Sistem Monolith (Produksi) | Nilai pada Modul Microservices (Lab) |
|--------------------|----------------------------------------|--------------------------------------|
| Total Kontainer Docker | 3 (frontend, backend, monolith-db) | 13 (6 Services, 5 DBs, Nginx, Frontend) |
| Teknologi Database | PostgreSQL 16 (1 Database Terpusat) | PostgreSQL 16 (5 Database Terpisah) |
| Unit Test Coverage (Pytest) | $\ge 50\%$ (Cakupan Minimum Tercapai) | $\ge 50\%$ (Cakupan Minimum Tercapai) |
| Skenario Integrasi UI (Vitest) | Lolos 10/10 (100% Sukses) | Lolos 10/10 (100% Sukses) |
| Jalur Automasi CI/CD | Lint, Test, Docker Build & DeployCC | Lint, Test, Docker Build (Manual Setup) |

---

# 👥 Kontribusi Tim (Kelompok Harahetta-2)

## Achmad Zaki Zaidan (10231002) — Lead Frontend & UI/UX Designer

Pengembangan antarmuka pengguna berbasis React 19, dashboard toko, dashboard admin, visualisasi maps Leaflet, dan UI integrasi chat/chatbot.

## Djaky Abbyyu Fauzan Timumum (10231032) — Lead Backend & Database Engineer

Perancangan 14 tabel relasional database PostgreSQL, pembuatan modul REST API FastAPI (Auth, Item, Rental, Payment), integrasi webhook Midtrans, dan asisten virtual Gemini AI.

## Muhammad Alif Setiawan (10231056) — Lead DevOps & CI/CD Specialist

Pembuatan arsitektur Docker Compose (Monolith & Microservices), konfigurasi Nginx Gateway, automasi pipeline CI/CD GitHub Actions, dan manajemen deployment server awan DeployCC.

## Riqqah Khalda Karina (10231082) — Lead QA & Docs

Pembuatan skenario pengujian unit (Pytest & Vitest), penyusunan dokumentasi API Swagger, dokumen arsitektur, dan penulisan dokumen rilis (release notes).

---

# 🐛 Batasan Sistem dan Isu yang Diketahui

## 1. Latensi Respon Pembayaran Sandbox Midtrans

Karena masih beroperasi di lingkungan Sandbox (pengujian) milik Midtrans, waktu tunggu pemrosesan webhook dan konfirmasi pembayaran terkadang mengalami sedikit keterlambatan respons. Hal ini merupakan batasan dari server Sandbox Midtrans dan bukan merupakan kendala pada core aplikasi Sewain.

## 2. Batas Kuota Gratis (Rate Limit) Gemini AI API

Layanan asisten virtual kami berjalan menggunakan model Gemini AI dengan kuota gratis harian. Jika chatbot tidak merespons secara tiba-tiba, hal itu mengindikasikan bahwa batas kuota gratis harian untuk API key tersebut telah habis dan akan pulih secara otomatis pada siklus harian berikutnya.
