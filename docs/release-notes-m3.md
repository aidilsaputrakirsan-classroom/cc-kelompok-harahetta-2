# 🚀 Catatan Rilis (Release Notes) — Milestone 3 (Final)

## 🎯 Perjalanan Pengembangan Arsitektur

Pengembangan platform Sewain dilakukan melalui tiga tahap utama yang menunjukkan perkembangan sistem dari aplikasi sederhana menjadi arsitektur microservices yang lebih skalabel dan andal.

```text
[MILESTONE 1]            [MILESTONE 2]            [MILESTONE 3]
Monolithic App    ───►   Containerized App ───►   Microservices App

- 1 Backend             - Docker Compose         - 6 Microservices
- 1 Database            - CI/CD Pipeline         - 5 Database Terpisah
- Deploy Manual         - Deploy Otomatis        - Security & Resilience
```

### Milestone 1 — Foundation

Pada tahap awal, aplikasi dikembangkan menggunakan arsitektur monolitik yang terdiri dari FastAPI, React, dan satu database PostgreSQL. Fokus utama tahap ini adalah memastikan seluruh proses bisnis utama berjalan dengan baik.

### Milestone 2 — Containerization

Pada tahap ini aplikasi dikemas menggunakan Docker Compose untuk mempermudah proses pengembangan dan deployment. Selain itu, GitHub Actions mulai digunakan untuk mengotomatisasi proses pengujian dan deployment.

### Milestone 3 — Microservices

Pada tahap akhir, sistem dipecah menjadi beberapa layanan independen menggunakan arsitektur microservices. Selain itu, berbagai peningkatan pada aspek keamanan, keandalan sistem, dan integrasi layanan eksternal juga diterapkan.

---

## 🆕 Fitur Baru dan Peningkatan pada Milestone 3

### 1. Arsitektur Microservices 

Sistem kini terdiri dari enam layanan utama yang memiliki tanggung jawab masing-masing.

| Service         | Fungsi Utama                                                |
| --------------- | ----------------------------------------------------------- |
| Auth Service    | Autentikasi, otorisasi, profil pengguna, dan verifikasi data |
| Item Service    | Pengelolaan barang dan kategori                             |
| Rental Service  | Transaksi penyewaan, ulasan, dan promo                      |
| Payment Service | Pembayaran, wallet admin, dan integrasi Midtrans            |
| Chat Service    | Fitur chat real-time menggunakan REST API dan WebSocket     |
| Chatbot Service | Asisten virtual berbasis Gemini AI                          |

Untuk meningkatkan skalabilitas dan kemandirian setiap layanan, sistem menerapkan pola Database per Service dengan lima database PostgreSQL yang terpisah.


### 2. Peningkatan Keamanan Sistem

Beberapa mekanisme keamanan ditambahkan untuk melindungi aplikasi dari penyalahgunaan dan kesalahan penggunaan.

#### a. Rate Limiting pada API Gateway

API Gateway menggunakan Nginx untuk membatasi jumlah request yang dapat diterima dalam periode tertentu.

| Jenis Endpoint               | Batas Request    |
| ---------------------------- | ---------------- |
| Login dan Registrasi         | 5 request/detik  |
| Endpoint Transaksi           | 20 request/detik |
| Halaman Umum dan File Statis | 30 request/detik |

#### b. Pengelolaan Kredensial yang Lebih Aman

Seluruh data sensitif seperti API Key, JWT Secret, dan kredensial database tidak disimpan langsung di dalam kode program. Konfigurasi tersebut dikelola menggunakan environment variable.

#### c. Validasi Input

Validasi data dilakukan menggunakan Pydantic untuk:

* Mencegah nilai negatif pada data tertentu.
* Membatasi panjang input pengguna.
* Memastikan password memenuhi standar keamanan minimum.


### 3. Keandalan dan Ketahanan Sistem

#### a. Circuit Breaker

Sistem menerapkan mekanisme Circuit Breaker untuk mencegah kegagalan berantai antar layanan. Jika suatu layanan mengalami gangguan, permintaan sementara akan dihentikan dan sistem akan menampilkan pesan yang lebih ramah kepada pengguna.

#### b. Automatic Retry

Ketika terjadi gangguan sementara pada komunikasi antar layanan, sistem akan mencoba kembali permintaan tersebut hingga tiga kali menggunakan jeda waktu yang bertambah secara bertahap (exponential backoff).


### 4. Integrasi Layanan Pihak Ketiga

#### a. Midtrans Payment Gateway

Sistem terintegrasi dengan Midtrans untuk mendukung berbagai metode pembayaran digital, seperti:

* QRIS
* GoPay
* Virtual Account

Webhook Midtrans juga dilindungi menggunakan verifikasi Signature Key untuk memastikan keaslian data transaksi.

#### b. Gemini AI Assistant

Platform Sewain menyediakan asisten virtual berbasis Gemini AI yang dapat membantu pengguna memperoleh informasi dan rekomendasi secara interaktif.


### 5. Monitoring dan Observabilitas

#### a. Structured Logging

Setiap layanan menghasilkan log dalam format JSON yang dilengkapi Correlation ID sehingga alur request antar layanan dapat dilacak dengan lebih mudah.

#### b. Metrics Endpoint

Setiap layanan menyediakan endpoint `/metrics` untuk memantau:

* Jumlah request
* Tingkat error
* Latensi respons (p50, p95, dan p99)

#### c. Status Dashboard

Sistem menyediakan halaman status yang secara berkala memeriksa kondisi seluruh layanan dan menampilkan status kesehatan sistem secara real-time.

---

## 📊 Statistik Pengembangan Milestone 3

| Metrik                         | Nilai                         |
| ------------------------------ | ----------------------------- |
| Total Kontainer Docker         | 13                            |
| Total Microservices            | 6                             |
| Total Database Terpisah        | 5 PostgreSQL                  |
| Total Endpoint REST API        | 50+                           |
| Backend Unit Test Coverage     | 53,4%                         |
| UI Integration Scenario Passed | 10/10 (100%)                  |
| Pipeline CI/CD                 | Lint, Test, Build, dan Deploy |

---

## 👥 Kontribusi Tim

| Anggota Tim                       | Peran                 | Kontribusi Utama                                                                                         |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Djaky Abbyyu Fauzan (10231032)    | Lead Backend          | Dekomposisi microservices, implementasi logika bisnis, integrasi Midtrans, dan chatbot AI                |
| Achmad Zaki Zaidan (10231002)     | Lead Frontend         | Pengembangan antarmuka pengguna, dashboard, integrasi chat, dan chatbot                                  |
| Muhammad Alif Setiawan (10231056) | Lead DevOps           | Konfigurasi Docker, API Gateway, Rate Limiting, CI/CD, dan deployment cloud                              |
| Riqqah Khalda Karina (10231082)   | Lead QA & Dokumentasi | Pengujian unit, dokumentasi arsitektur, dokumentasi API, dan penyusunan release notes |

---

## 🐛 Batasan Sistem dan Isu yang Diketahui

### 1. Latensi pada Midtrans Sandbox

Karena sistem masih menggunakan lingkungan Sandbox Midtrans, terkadang simulasi pembayaran membutuhkan waktu respons yang lebih lama. Kondisi ini berasal dari layanan pengujian Midtrans dan bukan merupakan kesalahan pada platform Sewain.

### 2. Batas Penggunaan Gemini AI

Layanan Gemini AI menggunakan kuota gratis harian. Apabila chatbot tidak merespons, kemungkinan kuota penggunaan harian telah habis dan akan kembali tersedia setelah periode reset kuota berikutnya.
