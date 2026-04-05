# 📖 Setup Guide — Sewain Platform (Kelompok Harahetta-2)

> **Panduan ini ditujukan untuk siapapun yang belum pernah melihat proyek ini sebelumnya.**  
> Ikuti setiap langkah secara berurutan dari atas ke bawah.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Clone Repository](#2-clone-repository)
3. [Setup Database PostgreSQL](#3-setup-database-postgresql)
4. [Setup Backend (FastAPI)](#4-setup-backend-fastapi)
5. [Setup Frontend (React + Vite)](#5-setup-frontend-react--vite)
6. [Menjalankan Aplikasi](#6-menjalankan-aplikasi)
7. [Verifikasi & Test](#7-verifikasi--test)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prasyarat

Pastikan semua tools berikut sudah terinstall di komputer Anda **sebelum melanjutkan**.

| Tool | Versi Minimum | Cek Instalasi | Link Download |
|------|--------------|---------------|---------------|
| **Git** | 2.x | `git --version` | https://git-scm.com/downloads |
| **Python** | 3.10+ | `python --version` | https://www.python.org/downloads/ |
| **pip** | 23+ | `pip --version` | (sudah bundled dengan Python) |
| **Node.js** | 18+ | `node --version` | https://nodejs.org/ |
| **npm** | 9+ | `npm --version` | (sudah bundled dengan Node.js) |
| **PostgreSQL** | 14+ | `psql --version` | https://www.postgresql.org/download/ |

### Verifikasi Semua Sekaligus

Jalankan perintah ini satu per satu di terminal/command prompt:

```bash
git --version
python --version
pip --version
node --version
npm --version
psql --version
```

> ⚠️ **Jika salah satu tidak ditemukan**, install terlebih dahulu sebelum melanjutkan.

---

## 2. Clone Repository

```bash
# Clone repo ke komputer lokal
git clone https://github.com/aidilsaputrakirsan/cc-kelompok-harahetta-2.git

# Masuk ke direktori proyek
cd cc-kelompok-harahetta-2
```

Setelah clone, struktur folder yang ada:

```
cc-kelompok-harahetta-2/
├── backend/          ← FastAPI + SQLAlchemy
├── frontend/         ← React + Vite
├── docs/             ← Dokumentasi proyek
├── .gitignore
└── README.md
```

---

## 3. Setup Database PostgreSQL

### 3.1 Buat Database Baru

Buka terminal PostgreSQL (psql) atau GUI seperti pgAdmin / DBeaver.

**Via psql (terminal):**

```bash
# Login ke PostgreSQL sebagai superuser
psql -U postgres

# Di dalam psql, buat database baru
CREATE DATABASE sewain_db;

# Verifikasi database berhasil dibuat
\l

# Keluar dari psql
\q
```

**Via pgAdmin / DBeaver:**
1. Buka pgAdmin / DBeaver
2. Klik kanan pada *Databases* → *Create* → *Database*
3. Isi nama database: `sewain_db`
4. Klik *Save / OK*

### 3.2 Catat Kredensial Database

Catat informasi koneksi Anda:

| Parameter | Nilai Default | Nilai Anda |
|-----------|--------------|------------|
| Host | `localhost` | _(isi di sini)_ |
| Port | `5432` | _(isi di sini)_ |
| Username | `postgres` | _(isi di sini)_ |
| Password | _(sesuai install)_ | _(isi di sini)_ |
| Database | `sewain_db` | `sewain_db` |

> 💡 **Informasi ini akan diisi ke file `.env` di langkah berikutnya.**

---

## 4. Setup Backend (FastAPI)

### 4.1 Masuk ke Direktori Backend

```bash
cd backend
```

### 4.2 Buat Virtual Environment

Virtual environment memisahkan dependencies proyek ini dari Python global di sistem Anda.

**Windows (Command Prompt / PowerShell):**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Setelah aktif, prompt terminal Anda akan menampilkan `(venv)` di awal baris.

### 4.3 Install Dependencies Python

```bash
pip install -r requirements.txt
```

Paket yang akan diinstall:

| Paket | Fungsi |
|-------|--------|
| `fastapi` | Web framework utama |
| `uvicorn` | ASGI server untuk menjalankan FastAPI |
| `sqlalchemy` | ORM untuk interaksi dengan database |
| `psycopg2-binary` | Driver PostgreSQL untuk Python |
| `python-dotenv` | Membaca file `.env` |
| `pydantic[email]` | Validasi data request/response |
| `python-jose[cryptography]` | Encoding/decoding JWT token |
| `passlib[bcrypt]` | Hashing password |
| `bcrypt` | Algoritma hashing |
| `python-multipart` | Parsing form data |

> ⏳ Proses ini membutuhkan waktu 1-3 menit tergantung koneksi internet.

### 4.4 Buat File `.env`

File `.env` berisi konfigurasi rahasia yang **tidak boleh di-commit ke Git**.

```bash
# Salin dari template yang sudah ada
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Buka file `.env` dengan teks editor dan isi sesuai kondisi lokal Anda:

```env
# --- Database Configuration ---
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/sewain_db

# JWT
SECRET_KEY=ganti-dengan-random-string-panjang-minimal-32-karakter
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Port untuk menjalankan API server
APP_PORT=8000

# Environment
APP_ENV=development
```

**Ganti bagian-bagian berikut:**
- `PASSWORD_ANDA` → password PostgreSQL Anda
- `SECRET_KEY` → generate dengan perintah di bawah ini:

```bash
# Generate random secret key yang aman
python -c "import secrets; print(secrets.token_hex(32))"
```

Salin output perintah tersebut dan tempel sebagai nilai `SECRET_KEY`.

**Contoh `.env` yang sudah diisi dengan benar:**
```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/sewain_db
SECRET_KEY=a3f8b2c1d9e4f7a0b5c8d1e6f3a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173
APP_PORT=8000
APP_ENV=development
```

### 4.5 Verifikasi Koneksi Database

Jalankan backend sekali untuk memastikan koneksi database berhasil dan tabel terbuat otomatis:

```bash
uvicorn main:app --reload --port 8000
```

Jika berhasil, terminal menampilkan:
```
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

> ✅ **Checkpoint:** Buka http://localhost:8000/health — harus muncul `{"status":"healthy","version":"0.4.0"}`

Tekan `Ctrl+C` untuk menghentikan server sementara.

---

## 5. Setup Frontend (React + Vite)

### 5.1 Buka Terminal Baru

**Penting:** Buka terminal **baru/terpisah** — jangan menutup terminal backend.

```bash
# Dari root proyek, masuk ke direktori frontend
cd frontend
```

### 5.2 Install Dependencies Node.js

```bash
npm install
```

> ⏳ Proses ini menginstall semua paket dari `package.json`. Bisa memakan waktu 1-2 menit.

### 5.3 Buat File `.env`

```bash
# Salin dari template
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Buka file `.env` yang baru dibuat dan pastikan isinya:

```env
# API Backend URL
VITE_API_URL=http://localhost:8000

# Application Name
VITE_APP_NAME=Harahetta App

# Application Mode (development / production)
VITE_APP_MODE=development
```

> 💡 Jika backend Anda berjalan di port berbeda, sesuaikan `VITE_API_URL`.

---

## 6. Menjalankan Aplikasi

Anda membutuhkan **dua terminal yang berjalan bersamaan**.

### Terminal 1 — Backend

```bash
# Dari direktori backend/ dengan venv aktif
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

uvicorn main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
# Dari direktori frontend/
cd frontend
npm run dev
```

Output yang diharapkan:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Akses Aplikasi

| URL | Deskripsi |
|-----|-----------|
| http://localhost:5173 | Frontend React (halaman utama) |
| http://localhost:8000/docs | Swagger UI — dokumentasi & testing API interaktif |
| http://localhost:8000/redoc | ReDoc — dokumentasi API alternatif |
| http://localhost:8000/health | Health check endpoint |

---

## 7. Verifikasi & Test

### 7.1 Test Backend via Swagger UI

1. Buka http://localhost:8000/docs
2. Coba endpoint `POST /auth/register`:
   ```json
   {
     "email": "test@student.itk.ac.id",
     "name": "Test User",
     "password": "password123"
   }
   ```
3. Coba endpoint `POST /auth/login` dengan email & password yang sama
4. Salin `access_token` dari response
5. Klik tombol **"Authorize 🔒"** di bagian atas Swagger UI
6. Paste token dan klik *Authorize*
7. Sekarang coba `GET /items` — harus berhasil (bukan 401)

### 7.2 Test Frontend

1. Buka http://localhost:5173
2. Pastikan halaman **login** muncul (bukan halaman kosong/error)
3. Klik tab **Register** → isi form → klik Register
4. Setelah berhasil, harusnya otomatis masuk ke halaman utama
5. Coba tambah item baru via form
6. Verifikasi item muncul di daftar
7. Coba edit dan hapus item
8. Klik **Logout** — harusnya kembali ke halaman login

### 7.3 Checklist Final

Centang semua item ini sebelum melaporkan setup selesai:

- [ ] Backend berjalan di http://localhost:8000
- [ ] Frontend berjalan di http://localhost:5173  
- [ ] `/health` endpoint mengembalikan `{"status":"healthy"}`
- [ ] Register user baru berhasil
- [ ] Login berhasil dan mendapat token
- [ ] Endpoint `/items` bisa diakses setelah login
- [ ] CRUD (Create, Read, Update, Delete) bekerja di frontend
- [ ] Logout berfungsi dan redirect ke login page
- [ ] Tidak ada error di browser console (F12 → Console)

---

## 8. Troubleshooting

### ❌ Error: `DATABASE_URL tidak ditemukan di .env!`

**Penyebab:** File `.env` belum dibuat atau kosong.

**Solusi:**
```bash
# Pastikan file .env ada di folder backend/
ls -la backend/     # macOS/Linux
dir backend\        # Windows

# Jika tidak ada, buat dari template
copy backend\.env.example backend\.env
```

---

### ❌ Error: `password authentication failed for user "postgres"`

**Penyebab:** Password di `.env` salah atau tidak sesuai dengan instalasi PostgreSQL Anda.

**Solusi:**
1. Buka file `backend/.env`
2. Periksa nilai `DATABASE_URL`, pastikan password benar
3. Coba koneksi manual: `psql -U postgres -h localhost`

---

### ❌ Error: `connection refused` atau `could not connect to server`

**Penyebab:** PostgreSQL tidak berjalan.

**Solusi:**

**Windows:**
```bash
# Cek status PostgreSQL service
Get-Service -Name postgresql*   # PowerShell

# Start service jika mati
net start postgresql-x64-14     # sesuaikan versi
```

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

---

### ❌ Error CORS di browser (blocked by CORS policy)

**Penyebab:** `ALLOWED_ORIGINS` di `.env` backend tidak cocok dengan URL frontend.

**Solusi:**
1. Buka `backend/.env`
2. Pastikan `ALLOWED_ORIGINS=http://localhost:5173` (tanpa slash di akhir)
3. Restart backend setelah mengubah `.env`

---

### ❌ Error: `ModuleNotFoundError: No module named 'jose'`

**Penyebab:** Virtual environment belum diaktifkan atau dependencies belum diinstall.

**Solusi:**
```bash
# Aktifkan venv
venv\Scripts\activate    # Windows

# Install ulang dependencies
pip install -r requirements.txt
```

---

### ❌ npm run dev error: `Cannot find module '/path/to/vite'`

**Penyebab:** `node_modules` belum diinstall.

**Solusi:**
```bash
cd frontend
npm install
npm run dev
```

---

### ❌ Login gagal dengan "401 Unauthorized" padahal sudah register

**Penyebab:** `SECRET_KEY` di `.env` berubah setelah user register (token lama tidak valid).

**Solusi:** Ini normal jika Anda mengganti `SECRET_KEY`. Cukup register ulang atau login ulang.

---

## Catatan Tambahan

### Struktur Database

Setelah backend pertama kali dijalankan, tabel berikut dibuat otomatis oleh SQLAlchemy:

| Tabel | Kolom Utama |
|-------|-------------|
| `users` | id, email, nama, hashed_password, role, is_active, is_verified, created_at |
| `admins` | id, user_id, nama_usaha, alamat_usaha, nomor_telepon, created_at |
| `user_profiles` | id, user_id, nama_orang_tua, alamat, foto_ktp, foto_selfie_ktp, status_verifikasi |
| `categories` | id, nama, deskripsi, created_at |
| `items` | id, admin_id, category_id, nama, deskripsi, harga_per_hari, stok, status, created_at |
| `rentals` | id, user_id, item_id, tanggal_mulai, tanggal_selesai, total_harga, status, created_at |

> ⚠️ **Jangan edit tabel secara manual** kecuali Anda memahami migrasi database.

### Keamanan

- File `.env` **tidak boleh di-commit ke Git** — sudah terdaftar di `.gitignore`
- Gunakan `.env.example` sebagai template untuk anggota tim lain
- Jangan share `SECRET_KEY` melalui chat/email — gunakan password manager atau vault

### Environment yang Didukung

| OS | Status |
|----|--------|
| Windows 10/11 | ✅ Tested |
| macOS 12+ | ✅ Tested |
| Ubuntu 20.04+ | ✅ Tested |

---

