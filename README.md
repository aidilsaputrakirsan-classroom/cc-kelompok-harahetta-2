<p align="center">
  <img src="docs/img/Logo sewain.png" alt="Logo Sewain" width="180"/>
</p>

<h1 align="center"><span style="color:#22c55e">Sewain</span> — Platform Sewa Barang Online</h1>


<p align="center">
  <img src="https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline"/>
  <img src="https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2/actions/workflows/deploy-vps.yml/badge.svg" alt="CD VPS Pipeline"/>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Nginx-Web%20Server-009639?logo=nginx&logoColor=white" alt="Nginx"/>
</p>

<p align="center">
  <strong>Sewain</strong> adalah platform berbasis web yang memfasilitasi penyewaan barang secara online dengan arsitektur <strong>monolith</strong> terpusat, diorkestrasi menggunakan Docker Compose, dan dideploy secara otomatis melalui <strong>CI/CD pipeline</strong> GitHub Actions ke platform DeployCC.
</p>

<p align="center">
  <strong>Mata Kuliah:</strong> Komputasi Awan — Sistem Informasi, Institut Teknologi Kalimantan (ITK) &nbsp;|&nbsp; <strong>Tim:</strong> Kelompok Harahetta-2
</p>

<p align="center">
  🌐 <a href="https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/">Live Demo</a> ·
  📋 <a href="https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/api/docs#/">API Docs</a>
</p>


---

## 📑 Daftar Isi

- [Deskripsi Aplikasi](#-deskripsi-aplikasi)
- [Tim Pengembang](#-tim-pengembang)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Monolitik](#-arsitektur-monolitik)
- [Database Schema](#-database-schema)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Getting Started](#-getting-started)
- [Struktur Proyek](#-struktur-proyek)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Makefile Commands](#-makefile-commands)
- [Roadmap](#-roadmap)

---

## 📝 Deskripsi Aplikasi

**SEWAIN** adalah platform penyewaan barang online yang menghubungkan **penyedia barang (Admin)** dengan **penyewa (User)** secara aman dan terstruktur. Platform ini dirancang untuk membantu pelaku usaha penyewaan — khususnya UMKM — dalam mendigitalisasi proses penyewaan yang selama ini dilakukan secara manual.

### Masalah yang Diselesaikan

| Masalah Konvensional | Solusi Sewain |
|---|---|
| Pencatatan manual rawan error | Sistem database terintegrasi dan otomatis |
| Jangkauan pelanggan terbatas | Platform online accessible 24/7 |
| Risiko penyalahgunaan barang | Verifikasi identitas KTP + selfie |
| Tidak ada transparansi status | Real-time tracking status penyewaan |
| Pembayaran tidak terstruktur | Integrasi payment gateway Midtrans |

---

## 👥 Tim Pengembang

| Profil | Nama | NIM | Peran | Tanggung Jawab |
|:------:|------|-----|-------|----------------|
| <a href="https://github.com/ZannSamaa"><img src="https://github.com/ZannSamaa.png" width="64" height="64" style="border-radius:50%" alt="Djaky Abbyyu Fauzan Timumum"/></a> | [Djaky Abbyyu Fauzan Timumum](https://github.com/ZannSamaa) | 10231032 | **Lead Backend** | Arsitektur API, database schema, business logic |
| <a href="https://github.com/ZakiZaidan"><img src="https://github.com/ZakiZaidan.png" width="64" height="64" style="border-radius:50%" alt="Achmad Zaki Zaidan"/></a> | [Achmad Zaki Zaidan](https://github.com/ZakiZaidan) | 10231002 | **Lead Frontend** | UI/UX, React components, API integration |
| <a href="https://github.com/shoryuwu"><img src="https://github.com/shoryuwu.png" width="64" height="64" style="border-radius:50%" alt="Muhammad Alif Setiawan"/></a> | [Muhammad Alif Setiawan](https://github.com/shoryuwu) | 10231056 | **Lead DevOps** | Docker, CI/CD, deployment, infrastructure |
| <a href="https://github.com/riqqahkhalda"><img src="https://github.com/riqqahkhalda.png" width="64" height="64" style="border-radius:50%" alt="Riqqah Khalda Karina"/></a> | [Riqqah Khalda Karina](https://github.com/riqqahkhalda) | 10231082 | **Lead QA & Docs** | Testing strategy, dokumentasi, quality assurance |

---

## ✨ Fitur Utama

SEWAIN memiliki **tiga peran pengguna** dengan hak akses yang berbeda:

### 👑 Super Admin
| Kategori | Fitur | Deskripsi |
|----------|-------|-----------|
| Manajemen Admin | Pengelolaan Penyedia | CRUD admin penyedia barang, aktivasi/nonaktifasi akun |
| Manajemen Konten | Pengelolaan Kategori | CRUD kategori barang (Elektronik, Outdoor, dll.) |
| Monitoring | Dashboard Statistik | Statistik platform, semua transaksi, verifikasi user |
| Promo | Pengelolaan Kupon | CRUD kode promo, diskon persentase/fixed, eligibility control |
| AI Assistant | Chatbot Monitoring | Monitoring aktivitas, ringkasan data, bantuan sistem |

### 🏪 Admin (Penyedia Barang)
| Kategori | Fitur | Deskripsi |
|----------|-------|-----------|
| Profil Usaha | Kelola Toko | Nama usaha, alamat, telepon, koordinat lokasi |
| Manajemen Produk | CRUD Barang | Tambah/edit/hapus barang, atur harga & stok, upload foto |
| Manajemen Order | Kontrol Sewa | Setujui/tolak permintaan, ubah status penyewaan |
| Pembayaran | Verifikasi Bayar | Konfirmasi pembayaran, wallet & withdrawal saldo |
| Chat | Live Chat | Komunikasi real-time dengan penyewa per item |
| AI Assistant | Chatbot Penyedia | Rekomendasi pengelolaan, respon otomatis |

### 👤 User (Penyewa)
| Kategori | Fitur | Deskripsi |
|----------|-------|-----------|
| Akun & Verifikasi | Registrasi + KYC | Registrasi, verifikasi email, upload KTP & selfie |
| Penyewaan | Proses Sewa | Katalog, detail barang, pilih tanggal, ajukan sewa |
| Pembayaran | Bayar Sewa | Pembayaran via Midtrans (QRIS, VA, e-wallet) |
| Monitoring | Status & Riwayat | Tracking status real-time, riwayat penyewaan |
| Review | Ulasan & Rating | Beri rating 1-5 dan komentar setelah sewa selesai |
| Promo | Kupon Diskon | Validasi & redeem kode promo saat checkout |
| Chat | Live Chat | Komunikasi langsung dengan penyedia barang |
| AI Assistant | Chatbot Bantuan | Rekomendasi barang, bantuan penggunaan |

---

## 🛠 Tech Stack

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Python | 3.12 | Bahasa pemrograman utama |
| FastAPI | 0.115 | Framework REST API high-performance |
| Uvicorn | 0.30 | ASGI server untuk production |
| SQLAlchemy | 2.0 | ORM untuk database operations |
| PostgreSQL | 16 | Database relasional utama |
| Pydantic | 2.9 | Validasi data & schema API |
| python-jose | 3.3 | JWT token management |
| bcrypt | 4.0 | Password hashing |
| OpenAI SDK | ≥1.30 | AI chatbot integration |
| Midtrans Client | 1.4 | Payment gateway integration |
| WebSockets | 13.1 | Real-time chat communication |

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19 | UI library utama |
| Vite | 7.3 | Build tool & dev server |
| React Router DOM | 7.14 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | Latest | Accessible UI components |
| Framer Motion | 12.38 | Animasi & transisi |
| Lucide React | 1.8 | Icon library |
| Sonner | 2.0 | Toast notifications |
| Leaflet | 1.9 | Interactive maps (pickup location) |

### Infrastructure & DevOps
| Teknologi | Fungsi |
|-----------|--------|
| Docker & Docker Compose | Containerisasi & orkestrasi service |
| Nginx | API Gateway & reverse proxy |
| GitHub Actions | CI/CD automation |
| DeployCC | Production deployment platform |
| Pytest + pytest-cov | Backend testing & coverage |
| Vitest + Testing Library | Frontend testing |

---

## 🏗 Arsitektur Monolitik (Monolithic Architecture)

Sewain menggunakan arsitektur **monolitik** di mana seluruh fungsionalitas backend diintegrasikan ke dalam satu layanan FastAPI tunggal (`backend/`). Seluruh data disimpan dalam satu database PostgreSQL terpusat (`monolith-db`). Hal ini dirancang untuk menyederhanakan komunikasi data, menyamakan konteks transaksi database, dan mempermudah proses deployment zero-downtime di environment production.

### Prinsip Desain

| Prinsip | Implementasi di Sewain |
|---------|------------------------|
| **Centralized Database** | Menggunakan satu database PostgreSQL (`data_sewain`) untuk semua modul. Hubungan relasional (foreign key) antar tabel terjaga dengan konsisten. |
| **Modular Backend** | Kode backend FastAPI dibagi ke dalam modul-modul logis (auth, chat, chatbot, crud, email, midtrans) dengan model data (`models.py`) dan skema Pydantic (`schemas.py`) terpusat. |
| **Unified Authentication** | Autentikasi JWT ditangani secara langsung oleh middleware internal backend tanpa overhead request HTTP inter-service. |
| **WebSockets & AI Integration** | Fitur chat real-time (WebSockets) dan AI Chatbot (Gemini) diintegrasikan langsung sebagai modul di dalam backend monolith. |
| **Simplified Deployment** | Proses build dan deployment hanya membutuhkan satu backend container dan satu frontend container, sehingga mengurangi penggunaan resource server. |

### Diagram Arsitektur Aplikasi

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Tier"]
        User([👤 User Browser])
    end

    subgraph APP_TIER["⚙️ Application Tier"]
        Frontend["⚛️ React App\nServed via Nginx\n(Port 80)"]
        Backend["🐍 FastAPI Monolith\n(Port 8000)"]
    end

    subgraph DATA_TIER["🗄️ Data Tier"]
        MonolithDB[("🗄️ PostgreSQL Database\ndata_sewain\n(Port 5432)")]
    end

    subgraph EXTERNAL["☁️ External Services"]
        Midtrans["💰 Midtrans\nPayment Gateway"]
        Gemini["✨ Gemini AI\n(via SumoPod)"]
    end

    User -->|"HTTP / WebSocket"| Frontend
    Frontend -->|"API Requests / WebSockets"| Backend
    Backend -->|"SQL Queries (SQLAlchemy)"| MonolithDB
    Backend -.->|"Snap API"| Midtrans
    Backend -.->|"LLM API"| Gemini

    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b
    classDef app fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20
    classDef db fill:#fce4ec,stroke:#c62828,stroke-width:2px,color:#b71c1c
    classDef ext fill:#ede7f6,stroke:#512da8,stroke-width:2px,color:#311b92

    class User client
    class Frontend,Backend app
    class MonolithDB db
    class Midtrans,Gemini ext
```

### Pemetaan Port & Container (Monolith Profile)

| Container | Port Host | Port Container | Image / Build | Database | Deskripsi |
|---------|-----------|----------------|---------------|----------|-----------|
| `backend` | **8000** | 8000 | `./backend` | `monolith-db` | Monolithic REST & WebSocket API Sewain |
| `frontend` | **3000** (atau **80** via gateway) | 80 | `./frontend` | — | React SPA — Served via Nginx |
| `monolith-db` | **15432** | 5432 | `postgres:16-alpine` | — | Database PostgreSQL utama (`data_sewain`) |

### Alur Proses Utama (Sequence Diagram)

Berikut adalah visualisasi alur interaksi pengguna dengan modul monolitik Sewain:

```mermaid
sequenceDiagram
    participant U as 👤 User Browser
    participant FE as ⚛️ Frontend React
    participant BE as 🐍 FastAPI Backend
    participant DB as 🗄️ PostgreSQL DB
    participant MT as 💰 Midtrans

    Note over U,MT: 1️⃣ Alur Login
    U->>FE: Input Email & Password
    FE->>BE: POST /auth/login
    BE->>DB: Query User & verifikasi hash password
    DB-->>BE: User data
    BE-->>FE: { access_token, user_profile }
    FE-->>U: Dashboard Tampil (Authenticated)

    Note over U,MT: 2️⃣ Alur Pengajuan Sewa & Pembayaran
    U->>FE: Pilih Barang & Klik Sewa
    FE->>BE: POST /rentals (dengan JWT token)
    BE->>DB: Cek ketersediaan stok barang (items table)
    DB-->>BE: Stok OK
    BE->>BE: Hitung harga & diskon promo (jika ada)
    BE->>MT: Inisiasi Transaksi (Snap API)
    MT-->>BE: { snap_token }
    BE->>DB: Simpan data rental (status: pending) & payment
    DB-->>BE: OK
    BE-->>FE: { rental, snap_token }
    FE->>U: Tampilkan Pop-up Midtrans Snap Payment

    Note over U,MT: 3️⃣ Notifikasi Pembayaran (Webhook)
    MT->>BE: POST /payments/notification (signature key terverifikasi)
    BE->>DB: Update status payment -> 'completed'
    BE->>DB: Update status rental -> 'disetujui'
    DB-->>BE: OK
    BE-->>MT: HTTP 200 OK
```

> 💡 **Informasi Tambahan**: Selain arsitektur monolitik yang digunakan sebagai backend production utama, proyek ini juga menyediakan folder `services/` yang berisi dekomposisi layanan ke dalam **arsitektur microservices** (Auth Service, Item Service, Rental Service, Payment Service, Chat Service, Chatbot Service) yang dihubungkan melalui Nginx API Gateway untuk keperluan pembelajaran/eksperimen komputasi awan.

---

## 🗄 Database Schema

Sewain menggunakan **14 tabel** dalam database utama (monolith backend) dengan relasi yang terstruktur:

```mermaid
erDiagram
    users ||--o| admins : "1:1 (role=admin)"
    users ||--o| user_profiles : "1:1 (role=user)"
    users ||--o{ rentals : "has many"
    admins ||--o{ items : "owns"
    categories ||--o{ items : "has many"
    items ||--o{ rentals : "rented via"
    rentals ||--o| payments : "1:1"
    rentals ||--o| reviews : "1:1"
    rentals ||--o| promo_redemptions : "1:1"
    admins ||--o| wallets : "1:1"
    wallets ||--o{ withdrawals : "has many"
    users ||--o{ chat_rooms : "participates"
    chat_rooms ||--o{ chat_messages : "contains"
    promo_codes ||--o{ promo_redemptions : "redeemed via"

    users {
        int id PK
        string email UK
        string nama
        string hashed_password
        enum role "super_admin | admin | user"
        bool is_active
        bool is_verified
        datetime email_verified_at
        text foto_profil
    }

    admins {
        int id PK
        int user_id FK
        string nama_usaha
        text alamat_usaha
        string nomor_telepon
        float latitude
        float longitude
    }

    user_profiles {
        int id PK
        int user_id FK
        string nama_orang_tua
        text alamat
        string nomor_telepon
        float latitude
        float longitude
        text foto_ktp
        text foto_selfie_ktp
        enum status_verifikasi "menunggu | disetujui | ditolak"
    }

    categories {
        int id PK
        string nama UK
        text deskripsi
    }

    items {
        int id PK
        int admin_id FK
        int category_id FK
        string nama
        float harga_per_hari
        int stok
        enum status "available | rented | unavailable"
        text foto_url
    }

    rentals {
        int id PK
        int user_id FK
        int item_id FK
        date tanggal_mulai
        date tanggal_selesai
        float total_harga
        enum status "pending | disetujui | sedang_disewa | selesai | ditolak"
        int promo_code_id FK
        float discount_amount
    }

    payments {
        int id PK
        int rental_id FK
        float jumlah
        enum metode_pembayaran "transfer | cash | e_wallet | credit_card | midtrans"
        enum status "pending | completed | failed | cancelled"
        string midtrans_order_id
        string snap_token
    }

    wallets {
        int id PK
        int admin_id FK
        float saldo
        float total_pendapatan
        float total_withdrawn
    }

    withdrawals {
        int id PK
        int wallet_id FK
        float jumlah
        string bank_name
        string account_number
        enum status "pending | processing | completed | rejected"
    }

    reviews {
        int id PK
        int rental_id FK
        int rating "1-5"
        text komentar
    }

    promo_codes {
        int id PK
        string code UK
        enum discount_type "percentage | fixed"
        float discount_value
        float max_discount
        enum eligibility "new_user | all"
        bool is_active
    }

    promo_redemptions {
        int id PK
        int promo_code_id FK
        int rental_id FK
        float discount_amount
        float final_amount
    }

    chat_rooms {
        int id PK
        int user_id FK
        int admin_id FK
        int item_id FK
    }

    chat_messages {
        int id PK
        int room_id FK
        int sender_id FK
        text body
        bool is_read
    }
```

---

## 🔄 CI/CD Pipeline

Sewain menggunakan **GitHub Actions** untuk otomatisasi build, testing, dan deployment secara end-to-end.

### Pipeline Overview

```mermaid
graph LR
    subgraph TRIGGER["🔔 Trigger"]
        Push["Push ke main"]
        PR["Pull Request"]
        Manual["Manual Dispatch"]
    end

    subgraph CI["🧪 CI Pipeline"]
        direction TB
        TestBE["🐍 Test Backend\n(pytest + coverage ≥50%)"]
        TestFE["⚛️ Test Frontend\n(vitest + build)"]
        BuildDocker["🐳 Build Docker\n(backend + frontend images)"]
        Notify["💬 PR Comment\n(jika gagal)"]

        TestBE --> BuildDocker
        TestFE --> BuildDocker
        BuildDocker -.->|"failure"| Notify
    end

    subgraph CD["🚀 CD Pipeline"]
        direction TB
        Detect["📋 Detect Changes\n(path-based filtering)"]
        Deploy["📦 Deploy to DeployCC\n(smart build/skip)"]
        Health["🏥 Health Check\n(5 retries × 10s)"]

        Detect --> Deploy
        Deploy --> Health
    end

    Push --> CI
    PR --> CI
    Manual --> CD
    CI -->|"✅ CI Success"| CD
```

### CI Jobs Detail

| Job | Runner | Timeout | Deskripsi |
|-----|--------|---------|-----------|
| `test-backend` | Ubuntu Latest | 10 min | Python 3.12, pip cache, `pytest --cov-fail-under=50` |
| `test-frontend` | Ubuntu Latest | 10 min | Node.js 20, `vitest run` + `npm run build` |
| `build-docker` | Ubuntu Latest | 10 min | Build Docker image backend & frontend (needs test pass) |
| `notify-failure` | Ubuntu Latest | 5 min | Auto-comment di PR jika CI gagal |

### CD Smart Deploy

Pipeline CD melakukan **deteksi perubahan** untuk optimasi deployment:

| Perubahan Terdeteksi | Aksi |
|---|---|
| `frontend/**` (signifikan) | 🔨 Build ulang frontend |
| `frontend/README*`, `docs/**` | ⏭ Skip build (kosmetik) |
| `backend/requirements.txt` | 📦 Re-install dependencies |
| `backend/**` | 🔄 Restart Uvicorn |
| Tidak ada perubahan | ✋ Zero downtime |

---

## 🚀 Getting Started

### Prasyarat

| Requirement | Minimum | Keterangan |
|---|---|---|
| Docker | 24.0+ | Containerisasi seluruh stack |
| Docker Compose | 2.20+ | Orkestrasi multi-container |
| Git | 2.40+ | Version control |
| Python | 3.12+ | Development lokal backend (opsional) |
| Node.js | 20+ | Development lokal frontend (opsional) |

### 🐳 Menjalankan via Docker (Recommended)

```bash
# 1. Clone repositori
git clone https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2.git

# 2. Masuk ke direktori proyek
cd cc-kelompok-harahetta-2

# 3. Build & jalankan service Monolith (Backend + DB + Frontend)
#    Secara otomatis, frontend diarahkan ke backend port 8000
VITE_API_URL=http://localhost:8000 docker compose up -d --build monolith-db backend frontend

# 4. Cek status container yang berjalan
docker compose ps

# 5. Akses aplikasi
#    → http://localhost:3000 (Frontend) atau debug backend langsung di http://localhost:8000
```

### 💻 Menjalankan Manual (Development)

**1. Database**
```bash
# Buat database di PostgreSQL lokal
createdb -U postgres data_sewain

# Import seed data (opsional)
psql -U postgres -d data_sewain -f docs/seed-data.sql
```

**2. Backend**
```bash
cd backend
cp .env.example .env          # Sesuaikan konfigurasi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env.local    # Sesuaikan VITE_API_URL
npm install
npm run dev
```

### 🔗 Akses Service (Monolith)

| Service / Container | URL Lokal | Keterangan |
|---------|-----|------------|
| ⚛️ Frontend (Development/Vite) | `http://localhost:5173` | Vite dev server dengan Hot Module Replacement (HMR) |
| ⚛️ Frontend (Production/Docker) | `http://localhost:3000` | React production build disajikan oleh Nginx (port 80 internal) |
| ⚙️ Backend API (Monolith) | `http://localhost:8000` | FastAPI server (Swagger Docs di `/docs`) |
| 🗄️ Monolith Database | `localhost:15432` | Database PostgreSQL utama (`data_sewain`) |

> ℹ️ Saat menjalankan secara lokal, pastikan file konfigurasi `.env` pada folder `backend/` dan `.env.local` pada folder `frontend/` sudah dikonfigurasi dengan benar agar frontend dapat berkomunikasi dengan backend monolith di port `8000`.

### 🔑 Akun Default (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@sewain.com` | `SuperAdmin123!` |
| Admin | `alif1@gmail.com` | `Alif1@gmail.com` |
| User | `alif2@gmail.com` | `Alif2@gmail.com` |

---

## 📂 Struktur Proyek

```
cc-kelompok-harahetta-2/
│
├── ⚙️ backend/                      # Monolith Backend (Core API Sewain)
│   ├── main.py                      #   FastAPI app — semua endpoint & modular routers
│   ├── models.py                    #   14 tabel SQLAlchemy (users, items, rentals, dll.)
│   ├── schemas.py                   #   Request/Response Pydantic schemas
│   ├── crud.py                      #   Database operations layer (DAO)
│   ├── auth.py                      #   JWT authentication & role guards
│   ├── config.py                    #   Environment-based configuration
│   ├── chat.py                      #   WebSocket chat (User ↔ Admin)
│   ├── chatbot.py                   #   AI chatbot integration (Gemini)
│   ├── email_service.py             #   Email verification & password reset
│   ├── midtrans_service.py          #   Payment gateway integration
│   ├── database.py                  #   Database connection manager
│   ├── Dockerfile                   #   FastAPI multi-stage Docker build
│   ├── requirements.txt             #   Python dependencies
│   └── tests/                       #   10 unit test files (pytest)
│
├── 🎨 frontend/                     # React SPA
│   ├── src/
│   │   ├── pages/                   #   21 Halaman utama (Landing, Login, Dashboard, dll.)
│   │   ├── components/              #   Komponen reusable React
│   │   │   ├── ui/                  #     Radix UI primitives
│   │   │   ├── ChatbotWidget.jsx    #     AI chatbot widget
│   │   │   ├── MapPicker.jsx        #     Leaflet map picker koordinat
│   │   │   └── ...
│   │   ├── context/                 #   AuthContext (state autentikasi global)
│   │   ├── services/
│   │   │   ├── api.js               #     Client API HTTP (fetch) ke Monolith Backend
│   │   │   └── chat.js              #     Client WebSocket chat
│   │   ├── App.jsx                  #   Router & layout utama
│   │   └── main.jsx                 #   Entry point aplikasi
│   ├── Dockerfile                   #   Multi-stage: build → served by Nginx
│   ├── nginx.conf                   #   SPA routing configuration untuk Nginx
│   ├── package.json                 #   Dependencies & scripts node
│   └── vite.config.js               #   Vite build configuration
│
├── 🔐 services/                    # Arsitektur Alternatif — Microservices (Eksperimen / Tugas Modul)
│   ├── auth-service/                # Auth Service (port 8001 → auth-db)
│   ├── item-service/                # Item Service (port 8002 → item-db)
│   ├── rental-service/              # Rental Service (port 8003 → rental-db)
│   ├── payment-service/             # Payment Service (port 8004 → payment-db)
│   ├── chat-service/                # Chat Service (port 8005 → chat-db)
│   ├── chatbot-service/             # AI Chatbot Service (port 8006, stateless)
│   ├── shared/                      # Modul logging & metrik bersama
│   └── gateway/                     # Nginx API Gateway configuration
│
├── 📋 docs/                         # Dokumentasi & Panduan Proyek
│   ├── architecture.md              #   Arsitektur detail
│   ├── deployment-guide.md          #   Panduan deployment ke DeployCC
│   ├── setup-guide.md               #   Panduan setup environment lokal lengkap
│   ├── testing-guide.md             #   Panduan testing API & UI
│   ├── seed-data.sql                #   Seed data awal database
│   └── img/                         #   Screenshots & logo
│
├── 🔧 .github/
│   └── workflows/
│       ├── ci.yml                   #   CI Pipeline (Test, lint, Docker build)
│       └── cd.yml                   #   CD Pipeline (Deploy otomatis ke DeployCC)
│
├── docker-compose.yml               # Orchestration semua services (Monolith + Microservices)
├── docker-compose.dev.yml           # Development overrides
├── docker-compose.prod.yml          # Production overrides (Monolith & DB)
├── Makefile                         # Developer command shortcuts
└── README.md                        # Dokumentasi utama proyek
```

---

## 📖 API Documentation

### Endpoint Overview (Monolith Backend)

Sewain API memiliki **50+ endpoints** yang terorganisir dalam 10 kategori:

| Kategori | Prefix | Auth | Jumlah Endpoint |
|----------|--------|------|-----------------|
| 🔐 Auth | `/auth/*` | Public/Login | 7 (register, login, verify-email, forgot-password, dll.) |
| 👑 Super Admin | `/superadmin/*` | Super Admin | 8 (users CRUD, stats, verifications, rentals) |
| 🏪 Admin Profile | `/admin/profile` | Admin | 4 (CRUD profil usaha) |
| 📂 Kategori | `/categories` | Public/SA | 4 (GET public, CRUD super admin) |
| 📦 Items | `/items/*` | Login | 5 (katalog, detail, CRUD admin) |
| 📋 Rentals | `/rentals/*` | Verified User/Admin | 6 (ajukan sewa, status update, riwayat) |
| 💳 Payments | `/payments/*` | Login | 5 (create, verify, Midtrans webhook) |
| 💰 Wallet | `/admin/wallet/*` | Admin/SA | 4 (saldo, withdrawal, approval) |
| ⭐ Reviews | `/reviews/*` | User/Public | 4 (create, list, shop reviews) |
| 🎟️ Promo | `/promo/*` | User/SA | 5 (validate, redeem, CRUD codes) |
| 🤖 Chatbot | `/chatbot/*` | Login | 2 (send message, history) |
| 💬 Chat | `/chat/*` | Login | 5 (rooms, messages, WebSocket) |

### Monolith API Endpoints

| Method | Endpoint | Modul Backend | Deskripsi |
|--------|----------|---------|-----------|
| `POST` | `/auth/register` | Autentikasi | Registrasi user baru (role: user) |
| `POST` | `/auth/login` | Autentikasi | Login, dapatkan JWT token |
| `GET` | `/auth/me` | Autentikasi | Ambil informasi profile user login |
| `GET` | `/profile` · `/admin/profile` | Autentikasi | Profil user & profil usaha admin |
| `GET` | `/superadmin/users` · `/superadmin/verifications` | Autentikasi | Manajemen user & verifikasi KYC |
| `GET` | `/items` · `/items/{id}` | Katalog Barang | Katalog & detail item |
| `POST/PUT/DELETE` | `/admin/items` | Katalog Barang | CRUD item (admin) |
| `GET` | `/categories` | Katalog Barang | Daftar kategori |
| `POST` | `/rentals` | Penyewaan | Ajukan penyewaan |
| `GET` | `/rentals` · `/admin/rentals` | Penyewaan | Riwayat & manajemen sewa |
| `POST` | `/reviews` · `GET /reviews` | Penyewaan | Ulasan & rating |
| `POST` | `/promos/validate` | Penyewaan | Validasi kode promo |
| `POST` | `/payments` | Pembayaran | Inisiasi pembayaran (Midtrans Snap) |
| `POST` | `/payments/notification` | Pembayaran | Webhook notifikasi Midtrans |
| `GET` | `/admin/wallet` | Pembayaran | Saldo & withdrawal admin |
| `GET` | `/chat` · `WS /chat/ws/{room}` | Chat Real-time | Chat REST & WebSocket realtime |
| `POST` | `/chatbot` | Chatbot AI | Kirim pesan ke AI chatbot (Gemini) |

> 📖 Setiap service mengekspos dokumentasi OpenAPI-nya sendiri di `/<service>/docs` saat mode development. 

---

## 🧪 Testing

### Testing Stack

| Layer | Tool | Runner | Coverage |
|-------|------|--------|----------|
| Backend Unit Tests | **Pytest** | GitHub Actions | ≥ 50% (enforced) |
| Backend Coverage | **pytest-cov** | GitHub Actions | `--cov-fail-under=50` |
| Frontend Unit Tests | **Vitest** | GitHub Actions | Component testing |
| Frontend Components | **Testing Library** | Vitest | React component testing |
| API Testing | Manual + Automated | Swagger UI / HTTPx | 10 endpoint scenarios |
| UI Integration | Manual | Browser | 10 UI scenarios |
| E2E | Manual | Browser | 9 end-to-end scenarios |

### Backend Test Suite (10 files)

```bash
# Jalankan semua test dengan coverage
cd backend
pytest --cov=. --cov-report=term-missing

# Test file yang tersedia:
# tests/test_auth.py          — Auth register, login, token
# tests/test_admin.py         — Admin profile CRUD
# tests/test_items.py         — Item CRUD operations
# tests/test_categories.py    — Category management
# tests/test_chat.py          — Chat rooms & messages
# tests/test_reviews.py       — Review & rating system
# tests/test_wallet.py        — Wallet & withdrawal
# tests/test_rental_due_at.py — Rental deadline logic
# tests/test_health.py        — Health check endpoint
```

### Frontend Test Suite

```bash
# Jalankan test
cd frontend
npm test

# Watch mode
npm run test:watch

# Dengan coverage
npm run test:coverage
```

### Hasil Testing Ringkasan

<details>
<summary><strong>📋 API Documentation Testing (10 Skenario)</strong></summary>

| No | Endpoint | Metode | Skenario | Status |
|----|----------|--------|----------|--------|
| 1 | `/health` | GET | Backend & database aktif | 🟢 Pass |
| 2 | `/auth/register` | POST | Registrasi akun baru | 🟢 Pass |
| 3 | `/auth/login` | POST | Login dengan akun valid | 🟢 Pass |
| 4 | `/auth/me` | GET | Ambil data user login | 🟢 Pass |
| 5 | `/categories` | GET | Menampilkan kategori | 🟢 Pass |
| 6 | `/items` | GET | Menampilkan katalog | 🟢 Pass |
| 7 | `/items` | POST | Menambah barang baru | 🟢 Pass |
| 8 | `/items/{id}` | PUT | Memperbarui barang | 🟢 Pass |
| 9 | `/items/{id}` | DELETE | Menghapus barang | 🟢 Pass |
| 10 | `/rentals` | POST | Membuat transaksi sewa | 🟢 Pass |

> Detail lengkap: [docs/testing/api-documentation.md](./docs/testing/api-documentation.md)

</details>

<details>
<summary><strong>🖥️ UI & API Integration Testing (10 Skenario)</strong></summary>

| No | Skenario | Hasil | Status |
|----|----------|-------|--------|
| 1 | Cek Status Koneksi | Dashboard dimuat, API Connected | ✅ Pass |
| 2 | Read Data Katalog | Item dari database tampil | ✅ Pass |
| 3 | Tambah Item Baru | Modal form muncul | ✅ Pass |
| 4 | Create & Upload | Data tersimpan, thumbnail muncul | ✅ Pass |
| 5 | Sync UI Post-Create | Item baru muncul otomatis | ✅ Pass |
| 6 | Edit Mode | Form terisi data lama | ✅ Pass |
| 7 | Update Data | Perubahan terupdate di UI | ✅ Pass |
| 8 | Search Feature | Filter sesuai kata kunci | ✅ Pass |
| 9 | Delete Item | Item terhapus dari UI & DB | ✅ Pass |
| 10 | Empty State | Pesan "Data tidak ditemukan" | ✅ Pass |

> Detail lengkap: [docs/testing/ui-test-result.md](./docs/testing/ui-test-result.md)

</details>

<details>
<summary><strong>🔐 Authentication & CRUD Testing (14 Skenario)</strong></summary>

**Authentication (5 skenario)**

| Kode | Skenario | Status |
|------|----------|--------|
| auth1 | Register User | ✅ Pass |
| auth2 | Validasi Register (field kosong) | ✅ Pass |
| auth3 | Login Berhasil | ✅ Pass |
| auth4 | Login Gagal (password salah) | ✅ Pass |
| auth5 | Logout | ✅ Pass |

**CRUD (5 skenario)**

| Kode | Skenario | Status |
|------|----------|--------|
| crud1 | Create Item | ✅ Pass |
| crud2 | Validasi Form (field wajib) | ✅ Pass |
| crud3 | Read Data | ✅ Pass |
| crud4 | Update Item | ✅ Pass |
| crud5 | Delete Item | ✅ Pass |

**End-to-End (9 skenario)**

| Kode | Skenario | Status |
|------|----------|--------|
| ee1 | Buka aplikasi → halaman login | ✅ Pass |
| ee2 | Register user | ✅ Pass |
| ee3 | Auto login setelah register | ✅ Pass |
| ee4 | Dashboard tampil | ✅ Pass |
| ee5 | Nama user di header | ✅ Pass |
| ee6 | CRUD berjalan | ✅ Pass |
| ee7 | Logout | ✅ Pass |
| ee8 | Login ulang | ✅ Pass |
| ee9 | Data tetap ada setelah re-login | ✅ Pass |

> Detail & screenshots: [docs/testing/auth-test-result/](./docs/testing/auth-test-result/)

</details>

<details>
<summary><strong>🛡️ Reliability Testing (4 Skenario)</strong></summary>

| No | Skenario                    | Tujuan                                                                    | Hasil                                                                            | Status |
| -- | --------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| 1  | Retry Logic                 | Memastikan service melakukan retry saat Auth Service tidak tersedia       | Retry berjalan 3 kali dengan exponential backoff sebelum mengembalikan error 503 | ✅ Pass |
| 2  | Circuit Breaker (Fast-Fail) | Memastikan circuit breaker berpindah ke OPEN setelah 5 kegagalan beruntun | Request berikutnya langsung ditolak (<100ms) tanpa menunggu timeout              | ✅ Pass |
| 3  | Automatic Recovery          | Memastikan circuit breaker kembali normal setelah Auth Service pulih      | State berubah OPEN → HALF_OPEN → CLOSED secara otomatis                          | ✅ Pass |
| 4  | Graceful Degradation        | Memastikan fitur publik tetap dapat diakses saat Auth Service gagal       | Endpoint publik tetap berjalan, endpoint privat ditolak dengan 503               | ✅ Pass |

> Reliability Testing ini dilakukan khusus pada profil/folder services/ (versi Microservices) untuk menguji ketahanan inter-service, bukan pada backend monolith utama.

> Detail lengkap: [docs/testing/reliability-testing.md](./docs/testing/reliability-testing.md)

</details>

---

## ⚡ Makefile Commands

Semua command dijalankan dari **root directory** proyek.

### Quick Reference

```bash
make help              # Tampilkan semua perintah tersedia
make compose-up        # 🚀 Jalankan semua services
make compose-down      # ⏹️ Stop semua services
make compose-build     # 🔨 Rebuild & jalankan
make compose-logs      # 📋 Log real-time semua services
make compose-ps        # 📊 Status semua services
make lint              # 🔍 Lint backend (flake8) + frontend (eslint)
make pr-check          # 🔎 Full pre-PR check (build + test)
```

### Daftar Lengkap

| Kategori | Command | Deskripsi |
|----------|---------|-----------|
| **Compose** | `compose-up` | Jalankan semua services (detached) |
| | `compose-down` | Stop semua services |
| | `compose-build` | Rebuild + jalankan semua |
| | `compose-logs` | Log real-time semua services |
| | `compose-ps` | Status semua services |
| | `compose-restart` | Restart semua services |
| | `compose-clean` | Hapus containers, networks, volumes |
| **Backend** | `build` | Build Docker image backend |
| | `run` | Jalankan container backend |
| | `push` | Push image ke Docker Hub |
| | `stop` | Stop & hapus container |
| | `logs` | Log real-time backend |
| | `health` | Health check `/health` |
| | `shell` | Masuk ke shell container |
| **Frontend** | `fe-build` | Build Docker image frontend |
| | `fe-push` | Push image ke Docker Hub |
| | `fe-run` | Jalankan container frontend |
| | `fe-stop` | Stop container frontend |
| | `fe-restart` | Rebuild + rerun frontend |
| **CI/CD** | `lint` | Jalankan flake8 + eslint |
| | `test` | Jalankan test suite |
| | `pr-check` | Build Docker + test (pre-PR gate) |
| **Push** | `push-all` | Push backend + frontend ke Docker Hub |

---

## 🗺 Roadmap

| Minggu | Target | Deliverables | Status |
|--------|--------|-------------|--------|
| 1 | Setup & Hello World | Project setup, hello world endpoint | ✅ Selesai |
| 2 | REST API + Database | CRUD endpoints, PostgreSQL integration | ✅ Selesai |
| 3 | React Frontend | UI pages, component architecture | ✅ Selesai |
| 4 | Full-Stack Integration | API integration, auth flow | ✅ Selesai |
| 5–7 | Docker & Compose | Containerisasi, multi-service | ✅ Selesai |
| 8 | UTS Demo | Presentasi tengah semester | ✅ Selesai |
| 9–11 | CI/CD Pipeline | GitHub Actions, automated testing | ✅ Selesai |
| 12–14 | Microservices | Service decomposition, API Gateway | ✅ Selesai |
| 15–16 | Final & UAS | Polish, documentation, final demo | ✅ Selesai |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademis mata kuliah **Komputasi Awan** — Program Studi Sistem Informasi, Institut Teknologi Kalimantan (ITK).
