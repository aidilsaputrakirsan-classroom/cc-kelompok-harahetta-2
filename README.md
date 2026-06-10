<p align="center">
  <img src="docs/img/Logo sewain.png" alt="Logo Sewain" width="180"/>
</p>

<h1 align="center"><span style="color:#22c55e">Sewain</span> — Platform Sewa Barang Online</h1>


<p align="center">
  <img src="https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline"/>
  <img src="https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2/actions/workflows/cd.yml/badge.svg" alt="CD Pipeline"/>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Nginx-Gateway-009639?logo=nginx&logoColor=white" alt="Nginx"/>
</p>

<p align="center">
  <strong>Sewain</strong> adalah platform berbasis web yang memfasilitasi penyewaan barang secara online dengan arsitektur <strong>microservices</strong>, dikelola melalui Docker Compose, dan dideploy secara otomatis melalui <strong>CI/CD pipeline</strong> GitHub Actions.
</p>

<p align="center">
  <strong>Mata Kuliah:</strong> Komputasi Awan — Sistem Informasi, Institut Teknologi Kalimantan (ITK) &nbsp;|&nbsp; <strong>Tim:</strong> Kelompok Harahetta-2
</p>

<p align="center">
  🌐 <a href="https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/">Live Demo</a> ·
  📋 <a href="https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/api/docs#/">API Docs</a> ·
  📐 <a href="#-arsitektur-microservices">Arsitektur Detail</a>
</p>


---

## 📑 Daftar Isi

- [Deskripsi Aplikasi](#-deskripsi-aplikasi)
- [Tim Pengembang](#-tim-pengembang)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Microservices](#-arsitektur-microservices)
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
| ESLint + Flake8 | Code linting |

---

## 🏗 Arsitektur Microservices

Sewain menggunakan arsitektur **microservices** dengan pola **Database per Service** dan **API Gateway** menggunakan Nginx sebagai reverse proxy tunggal. Sistem terdiri dari **6 backend service**, **5 database terisolasi**, **frontend React**, dan **Nginx gateway** yang diorkestrasi melalui Docker Compose — total **13 container**.

### Prinsip Desain

| Prinsip | Implementasi di Sewain |
|---------|------------------------|
| **Database per Service** | Tiap service punya PostgreSQL sendiri (auth-db, item-db, rental-db, payment-db, chat-db) — tidak ada shared database |
| **API Gateway** | Nginx sebagai satu-satunya entry point (port 80), routing per-path ke service tujuan |
| **Stateless Auth** | Auth Service menerbitkan JWT; service lain memverifikasi token via HTTP ke Auth Service |
| **Inter-Service via HTTP** | Komunikasi antar service menggunakan REST internal (httpx client) |
| **Resilience** | Tiap client antar-service dilindungi **circuit breaker** untuk mencegah cascading failure |
| **Observability** | Tiap service expose `/health` & `/metrics`, dengan structured logging middleware |

### Diagram Arsitektur Docker Compose

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Tier"]
        User([👤 User Browser])
    end

    subgraph GATEWAY_TIER["🔀 API Gateway — Port 80"]
        Gateway["🔀 Nginx\nReverse Proxy\n(Port 80)"]
    end

    subgraph FRONTEND_TIER["🎨 Frontend Tier"]
        Frontend["⚛️ React App\nVite + Tailwind CSS\n(Port 3000)"]
    end

    subgraph BACKEND_TIER["⚙️ Backend Services (FastAPI)"]
        AuthService["🔐 Auth Service\n(Port 8001)"]
        ItemService["📦 Item Service\n(Port 8002)"]
        RentalService["📋 Rental Service\n(Port 8003)"]
        PaymentService["💳 Payment Service\n(Port 8004)"]
        ChatService["💬 Chat Service\n(Port 8005)"]
        ChatbotService["🤖 Chatbot Service\n(Port 8006)"]
    end

    subgraph DATA_TIER["🗄️ Data Tier — Database per Service"]
        AuthDB[("🗄️ auth-db\nPostgreSQL 16\n(5433→5432)")]
        ItemDB[("🗄️ item-db\nPostgreSQL 16\n(5434→5432)")]
        RentalDB[("🗄️ rental-db\nPostgreSQL 16\n(5435→5432)")]
        PaymentDB[("🗄️ payment-db\nPostgreSQL 16\n(5436→5432)")]
        ChatDB[("🗄️ chat-db\nPostgreSQL 16\n(5437→5432)")]
    end

    subgraph EXTERNAL["☁️ External"]
        Midtrans["💰 Midtrans\nPayment Gateway"]
        Gemini["✨ Gemini AI\n(via SumoPod)"]
    end

    User -->|"HTTP / WebSocket"| Gateway
    Gateway -->|"/ → Frontend"| Frontend
    Gateway -->|"/auth, /profile, /superadmin/users → :8001"| AuthService
    Gateway -->|"/items, /categories → :8002"| ItemService
    Gateway -->|"/rentals, /promos, /reviews → :8003"| RentalService
    Gateway -->|"/payments, /admin/wallet → :8004"| PaymentService
    Gateway -->|"/chat, /chat/ws → :8005"| ChatService
    Gateway -->|"/chatbot → :8006"| ChatbotService

    AuthService -->|"SQL"| AuthDB
    ItemService -->|"SQL"| ItemDB
    RentalService -->|"SQL"| RentalDB
    PaymentService -->|"SQL"| PaymentDB
    ChatService -->|"SQL"| ChatDB

    ItemService -.->|"verify token"| AuthService
    RentalService -.->|"verify token"| AuthService
    RentalService -.->|"cek katalog"| ItemService
    RentalService -.->|"buat payment"| PaymentService
    PaymentService -.->|"verify token"| AuthService
    PaymentService -.->|"update status sewa"| RentalService
    ChatService -.->|"verify token"| AuthService
    ChatService -.->|"info item"| ItemService

    PaymentService -.->|"Snap API"| Midtrans
    ChatbotService -.->|"LLM API"| Gemini

    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b
    classDef gateway fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef frontend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20
    classDef service fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100
    classDef db fill:#fce4ec,stroke:#c62828,stroke-width:2px,color:#b71c1c
    classDef ext fill:#ede7f6,stroke:#512da8,stroke-width:2px,color:#311b92

    class User client
    class Gateway gateway
    class Frontend frontend
    class AuthService,ItemService,RentalService,PaymentService,ChatService,ChatbotService service
    class AuthDB,ItemDB,RentalDB,PaymentDB,ChatDB db
    class Midtrans,Gemini ext
```

### Pemetaan Service & Port

| Service | Port Host | Port Container | Image / Build | Database | Deskripsi |
|---------|-----------|----------------|---------------|----------|-----------|
| `gateway` | **80** | 80 | `nginx:alpine` | — | API Gateway — reverse proxy untuk semua request |
| `frontend` | — | 3000 | `./frontend` | — | React SPA — UI aplikasi |
| `auth-service` | — | 8001 | `./services/auth-service` | `auth-db` | Registrasi, login, JWT verify, profil admin/user, super-admin users, verifikasi KYC |
| `item-service` | — | 8002 | `./services/item-service` | `item-db` | Katalog & CRUD items, kategori, statistik inventaris |
| `rental-service` | — | 8003 | `./services/rental-service` | `rental-db` | Penyewaan, status sewa, reviews & rating, promo/kupon |
| `payment-service` | — | 8004 | `./services/payment-service` | `payment-db` | Pembayaran, integrasi Midtrans, wallet & withdrawal |
| `chat-service` | — | 8005 | `./services/chat-service` | `chat-db` | Chat room & pesan, WebSocket realtime User ↔ Admin |
| `chatbot-service` | — | 8006 | `./services/chatbot-service` | — *(stateless)* | AI Chatbot Sewain (Gemini via SumoPod) |
| `auth-db` | 5433 | 5432 | `postgres:16-alpine` | — | Database kredensial & profil pengguna |
| `item-db` | 5434 | 5432 | `postgres:16-alpine` | — | Database data barang & kategori |
| `rental-db` | 5435 | 5432 | `postgres:16-alpine` | — | Database penyewaan, review & promo |
| `payment-db` | 5436 | 5432 | `postgres:16-alpine` | — | Database pembayaran & wallet |
| `chat-db` | 5437 | 5432 | `postgres:16-alpine` | — | Database chat room & pesan |

### Dependensi Antar Service

Komunikasi internal menggunakan **HTTP (httpx)** dengan **circuit breaker** untuk ketahanan terhadap kegagalan.

| Service | Memanggil | Tujuan |
|---------|-----------|--------|
| `item-service` | `auth-service` | Verifikasi token JWT |
| `rental-service` | `auth-service`, `item-service`, `payment-service` | Verifikasi token, cek ketersediaan katalog, inisiasi pembayaran |
| `payment-service` | `auth-service`, `rental-service` | Verifikasi token, update status sewa setelah bayar |
| `chat-service` | `auth-service`, `item-service` | Verifikasi token, ambil info item terkait chat |
| `chatbot-service` | Gemini AI (eksternal) | Generasi respon chatbot |
| `payment-service` | Midtrans (eksternal) | Snap API — pembuatan transaksi & webhook |

### Pola Komunikasi Antar Service

```mermaid
sequenceDiagram
    participant U as 👤 User Browser
    participant GW as 🔀 Nginx Gateway
    participant Auth as 🔐 Auth Service
    participant Item as 📦 Item Service
    participant Rental as 📋 Rental Service
    participant Pay as 💳 Payment Service
    participant MT as 💰 Midtrans

    Note over U,MT: 1️⃣ Login Flow
    U->>GW: POST /auth/login
    GW->>Auth: Proxy → :8001/auth/login
    Auth->>Auth: Validasi kredensial + terbitkan JWT
    Auth-->>GW: { access_token }
    GW-->>U: JWT Token

    Note over U,MT: 2️⃣ Ajukan Sewa + Bayar (Authenticated)
    U->>GW: POST /rentals (+ Bearer Token)
    GW->>Rental: Proxy → :8003/rentals
    Rental->>Auth: GET /verify (verifikasi token)
    Auth-->>Rental: { user_id, email, role }
    Rental->>Item: GET /items/{id} (cek stok & harga)
    Item-->>Rental: Detail item
    Rental->>Pay: POST /payments (inisiasi pembayaran)
    Pay->>MT: Create Snap Transaction
    MT-->>Pay: { snap_token }
    Pay-->>Rental: { payment_id, snap_token }
    Rental-->>GW: 201 Created
    GW-->>U: { rental, snap_token }

    Note over U,MT: 3️⃣ Konfirmasi Pembayaran (Webhook)
    MT->>GW: POST /payments/notification
    GW->>Pay: Proxy → :8004
    Pay->>Pay: Verifikasi signature & update status
    Pay->>Rental: PATCH status sewa → "disetujui"
    Rental-->>Pay: OK
```

### Routing Table (Nginx Gateway)

| Path Pattern | Target Service | Keterangan |
|---|---|---|
| `/auth/*` | `auth-service:8001` | Endpoint autentikasi (register, login, verify-email, dll.) |
| `/profile`, `/admin/profile` | `auth-service:8001` | Profil user & profil usaha admin |
| `/superadmin/users`, `/superadmin/stats`, `/superadmin/verifications`, `/superadmin/admins` | `auth-service:8001` | Manajemen user, statistik & verifikasi KYC |
| `/items`, `/categories`, `/admin/items` | `item-service:8002` | Katalog, kategori & CRUD items |
| `/rentals`, `/admin/rentals`, `/superadmin/rentals` | `rental-service:8003` | Penyewaan & manajemen sewa |
| `/promos`, `/superadmin/promos`, `/reviews` | `rental-service:8003` | Promo/kupon & review |
| `/payments`, `/admin/payments`, `/superadmin/payments` | `payment-service:8004` | Pembayaran & verifikasi |
| `/admin/wallet`, `/superadmin/withdrawals` | `payment-service:8004` | Wallet & withdrawal admin |
| `/chat/ws/*` | `chat-service:8005` | WebSocket realtime chat |
| `/chat` | `chat-service:8005` | REST chat (rooms & messages) |
| `/chatbot` | `chatbot-service:8006` | AI Chatbot |
| `/{service}/health`, `/{service}/metrics` | service terkait | Health check & Prometheus metrics |
| `/health` | Gateway langsung | Health check aggregator |
| `/*` (default) | `frontend:3000` | Static files & SPA fallback |

> 💡 **Mode Development**: dengan `docker-compose.dev.yml`, setiap service mengekspos portnya langsung ke host (8001–8006) dan frontend berjalan di Vite HMR (port 5173) untuk debugging tanpa melalui gateway.

---

## 🗄 Database Schema

Sewain menggunakan **12 tabel** dalam database utama (monolith backend) dengan relasi yang terstruktur:

```mermaid
erDiagram
    users ||--o| admin_profiles : "1:1 (role=admin)"
    users ||--o| user_profiles : "1:1 (role=user)"
    users ||--o{ rentals : "has many"
    admin_profiles ||--o{ items : "owns"
    categories ||--o{ items : "has many"
    items ||--o{ rentals : "rented via"
    rentals ||--o| payments : "1:1"
    rentals ||--o| reviews : "1:1"
    rentals ||--o| promo_redemptions : "1:1"
    admin_profiles ||--o| wallets : "1:1"
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

    admin_profiles {
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
        enum metode_pembayaran "transfer | cash | e_wallet | midtrans"
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

# 3. Build & jalankan semua service (microservices)
docker compose up -d --build

# 4. Cek status semua container
docker compose ps

# 5. Akses aplikasi
#    → http://localhost (melalui Nginx Gateway)
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

### 🔗 Akses Service

| Service | URL | Keterangan |
|---------|-----|------------|
| 🌐 Aplikasi (Gateway) | `http://localhost` | Entry point utama via Nginx |
| ⚛️ Frontend (dev/Vite) | `http://localhost:5173` | Vite dev server (mode development) |
| 🔐 Auth Service | `http://localhost:8001` | Autentikasi, profil & verifikasi KYC |
| 📦 Item Service | `http://localhost:8002` | Katalog, kategori & inventaris |
| 📋 Rental Service | `http://localhost:8003` | Penyewaan, review & promo |
| 💳 Payment Service | `http://localhost:8004` | Pembayaran, wallet & Midtrans |
| 💬 Chat Service | `http://localhost:8005` | Chat realtime (REST + WebSocket) |
| 🤖 Chatbot Service | `http://localhost:8006` | AI Chatbot (Gemini) |

> ℹ️ Port langsung `8001–8006` dan `5173` hanya terekspos saat menjalankan mode development (`docker-compose.dev.yml`). Dalam mode default, semua akses melalui gateway di port `80`.

### 🔑 Akun Default (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@sewain.id` | `superadmin123` |
| Admin | `admin@sewain.id` | `admin123` |
| User | `user@sewain.id` | `user123` |

---

## 📂 Struktur Proyek

```
cc-kelompok-harahetta-2/
│
├── 🔐 services/                    # Microservices (Docker Compose)
│   ├── auth-service/                # Auth & Profile (port 8001 → auth-db)
│   │   ├── main.py                  #   FastAPI — register, login, verify, profil, KYC
│   │   ├── models.py                #   SQLAlchemy models (users, profiles)
│   │   ├── schemas.py               #   Pydantic schemas
│   │   ├── database.py              #   PostgreSQL connection (auth_db)
│   │   ├── email_service.py         #   Verifikasi email & reset password
│   │   ├── logging_config.py        #   Structured logging
│   │   ├── logging_middleware.py    #   Request logging middleware
│   │   ├── metrics.py               #   Prometheus metrics
│   │   ├── Dockerfile               #   Python 3.12-slim, port 8001
│   │   └── tests/                   #   Unit tests
│   │
│   ├── item-service/                # Katalog & Kategori (port 8002 → item-db)
│   │   ├── main.py                  #   FastAPI — CRUD items, kategori, stats
│   │   ├── auth_client.py           #   HTTP client → Auth Service /verify
│   │   ├── circuit_breaker.py       #   Circuit breaker antar service
│   │   ├── models.py                #   SQLAlchemy Item & Category model
│   │   └── Dockerfile               #   Python 3.12-slim, port 8002
│   │
│   ├── rental-service/              # Sewa, Review & Promo (port 8003 → rental-db)
│   │   ├── main.py                  #   FastAPI — rentals, reviews, promos
│   │   ├── auth_client.py           #   → Auth Service (verify token)
│   │   ├── catalog_client.py        #   → Item Service (cek katalog)
│   │   ├── payment_client.py        #   → Payment Service (inisiasi bayar)
│   │   ├── circuit_breaker.py       #   Resilience antar service
│   │   └── Dockerfile               #   Python 3.12-slim, port 8003
│   │
│   ├── payment-service/             # Pembayaran & Wallet (port 8004 → payment-db)
│   │   ├── main.py                  #   FastAPI — payments, wallet, withdrawal
│   │   ├── midtrans_service.py      #   Integrasi Midtrans Snap & webhook
│   │   ├── auth_client.py           #   → Auth Service (verify token)
│   │   ├── rental_client.py         #   → Rental Service (update status sewa)
│   │   ├── circuit_breaker.py       #   Resilience antar service
│   │   └── Dockerfile               #   Python 3.12-slim, port 8004
│   │
│   ├── chat-service/                # Chat realtime (port 8005 → chat-db)
│   │   ├── main.py                  #   FastAPI — chat rooms, messages, WebSocket
│   │   ├── auth_client.py           #   → Auth Service (verify token)
│   │   ├── catalog_client.py        #   → Item Service (info item)
│   │   ├── circuit_breaker.py       #   Resilience antar service
│   │   └── Dockerfile               #   Python 3.12-slim, port 8005
│   │
│   ├── chatbot-service/             # AI Chatbot (port 8006, stateless)
│   │   ├── main.py                  #   FastAPI — chatbot via Gemini (SumoPod)
│   │   ├── requirements.txt         #   Dependencies: fastapi, litellm/openai
│   │   └── Dockerfile               #   Python 3.12-slim, port 8006
│   │
│   ├── shared/                      # Modul bersama antar service
│   │   ├── logging_config.py        #   Konfigurasi logging standar
│   │   ├── logging_middleware.py    #   Middleware logging request
│   │   └── metrics.py               #   Helper Prometheus metrics
│   │
│   └── gateway/                     # API Gateway
│       └── nginx.conf               #   Routing per-path ke 6 service + frontend
│
├── ⚙️ backend/                      # Monolith Backend (referensi / legacy full-featured)
│   ├── main.py                      #   FastAPI app — semua endpoint (2700+ lines)
│   ├── models.py                    #   12 tabel SQLAlchemy (users, items, rentals, dll.)
│   ├── schemas.py                   #   Request/Response Pydantic schemas
│   ├── crud.py                      #   Database operations layer
│   ├── auth.py                      #   JWT authentication & role guards
│   ├── config.py                    #   Environment-based configuration
│   ├── chat.py                      #   WebSocket chat (User ↔ Admin)
│   ├── chatbot.py                   #   AI chatbot integration (OpenAI)
│   ├── email_service.py             #   Email verification & password reset
│   ├── midtrans_service.py          #   Payment gateway integration
│   ├── database.py                  #   Database connection manager
│   ├── Dockerfile                   #   Multi-stage build
│   ├── requirements.txt             #   Python dependencies
│   └── tests/                       #   10 test files (pytest)
│       ├── conftest.py              #     Test fixtures & setup
│       ├── test_auth.py             #     Authentication tests
│       ├── test_admin.py            #     Admin endpoint tests
│       ├── test_items.py            #     Item CRUD tests
│       ├── test_categories.py       #     Category tests
│       ├── test_chat.py             #     Chat functionality tests
│       ├── test_reviews.py          #     Review system tests
│       ├── test_wallet.py           #     Wallet & withdrawal tests
│       ├── test_rental_due_at.py    #     Rental deadline tests
│       └── test_health.py           #     Health check tests
│
├── 🎨 frontend/                     # React SPA
│   ├── src/
│   │   ├── pages/                   #   21 halaman (Landing, Login, Dashboard, dll.)
│   │   ├── components/              #   20+ komponen reusable
│   │   │   ├── ui/                  #     Radix UI primitives
│   │   │   ├── __tests__/           #     Component tests
│   │   │   ├── ChatbotWidget.jsx    #     AI chatbot widget
│   │   │   ├── MapPicker.jsx        #     Leaflet map component
│   │   │   ├── PromoBanner.jsx      #     Promo display
│   │   │   └── ...
│   │   ├── context/                 #   AuthContext (global state)
│   │   ├── services/
│   │   │   ├── api.js               #     HTTP client (Axios-like)
│   │   │   └── chat.js              #     WebSocket chat client
│   │   ├── App.jsx                  #   Router & layout
│   │   └── main.jsx                 #   Entry point
│   ├── Dockerfile                   #   Multi-stage: build → nginx serve
│   ├── nginx.conf                   #   SPA fallback config
│   ├── package.json                 #   Node.js dependencies
│   └── vite.config.js               #   Vite build configuration
│
├── 📋 docs/                         #   Dokumentasi proyek
│   ├── architecture.md              #     Arsitektur microservices detail
│   ├── deployment-guide.md          #     Panduan deployment
│   ├── setup-guide.md               #     Panduan setup lengkap
│   ├── testing-guide.md             #     Strategi & panduan testing
│   ├── testing/                     #     Hasil testing (API, UI, Auth)
│   ├── seed-data.sql                #     Data awal database
│   └── img/                         #     Screenshots & gambar
│
├── 🔧 .github/
│   ├── workflows/
│   │   ├── ci.yml                   #   CI: test → build → notify
│   │   └── cd.yml                   #   CD: detect changes → deploy → health check
│   └── CODEOWNERS                   #   Auto-assign reviewers
│
├── docker-compose.yml               #   Microservices orchestration (13 containers)
├── docker-compose.dev.yml           #   Development overrides (hot-reload, port expose)
├── docker-compose.prod.yml          #   Production overrides
├── Makefile                         #   Developer workflow shortcuts
└── README.md                        #   ← You are here
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

### Microservices API Contract (via Gateway)

| Method | Endpoint | Service | Deskripsi |
|--------|----------|---------|-----------|
| `POST` | `/auth/register` | Auth Service | Registrasi user baru |
| `POST` | `/auth/login` | Auth Service | Login, dapatkan JWT token |
| `GET` | `/auth/verify` | Auth Service | Internal — verifikasi token (inter-service) |
| `GET` | `/profile` · `/admin/profile` | Auth Service | Profil user & profil usaha admin |
| `GET` | `/superadmin/users` · `/superadmin/verifications` | Auth Service | Manajemen user & verifikasi KYC |
| `GET` | `/items` · `/items/{id}` | Item Service | Katalog & detail item |
| `POST/PUT/DELETE` | `/admin/items` | Item Service | CRUD item (admin) |
| `GET` | `/categories` | Item Service | Daftar kategori |
| `POST` | `/rentals` | Rental Service | Ajukan penyewaan |
| `GET` | `/rentals` · `/admin/rentals` | Rental Service | Riwayat & manajemen sewa |
| `POST` | `/reviews` · `GET /reviews` | Rental Service | Ulasan & rating |
| `POST` | `/promos/validate` | Rental Service | Validasi kode promo |
| `POST` | `/payments` | Payment Service | Inisiasi pembayaran (Midtrans Snap) |
| `POST` | `/payments/notification` | Payment Service | Webhook notifikasi Midtrans |
| `GET` | `/admin/wallet` | Payment Service | Saldo & withdrawal admin |
| `GET` | `/chat` · `WS /chat/ws/{room}` | Chat Service | Chat REST & WebSocket realtime |
| `POST` | `/chatbot` | Chatbot Service | Kirim pesan ke AI chatbot |

> 📖 Setiap service mengekspos dokumentasi OpenAPI-nya sendiri di `/<service>/docs` saat mode development. Dokumentasi lengkap juga tersedia di file [docs/testing/api-documentation.md](./docs/testing/api-documentation.md)

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
| 15–16 | Final & UAS | Polish, documentation, final demo | 🔄 In Progress |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademis mata kuliah **Komputasi Awan** — Program Studi Sistem Informasi, Institut Teknologi Kalimantan (ITK).

