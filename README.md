# 🛵 SEWAIN — Platform Sewa Barang Online

> Aplikasi web platform penyewaan barang berbasis multi-role, dibangun dengan FastAPI + React + PostgreSQL,
> dan di-deploy menggunakan Docker.
>
> **Mata Kuliah:** Komputasi Awan — Sistem Informasi, Institut Teknologi Kalimantan (ITK)
> **Tim:** Kelompok Harahetta-2

---

## Daftar Isi

1. [Deskripsi Aplikasi](#1-deskripsi-aplikasi)
2. [Tim](#2-tim)
3. [Fitur Utama](#3-fitur-utama)
4. [Tech Stack](#4-tech-stack)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
- [Struktur Proyek](#struktur-proyek)
- [Struktur Database](#struktur-database)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
  - [Menggunakan Docker (Rekomendasi)](#menggunakan-docker-rekomendasi)
  - [Manual (Tanpa Docker)](#manual-tanpa-docker)
- [Akun Demo](#akun-demo)
- [Dokumentasi API](#dokumentasi-api)

---

## 1. Deskripsi Aplikasi

SEWAIN adalah platform berbasis web yang memfasilitasi proses penyewaan barang secara online secara lebih mudah, aman, dan terstruktur. Melalui sistem ini, penyedia dapat menampilkan dan mengelola barang yang disewakan, sementara pengguna dapat mencari barang, melihat detail, menentukan periode sewa, serta mengajukan permintaan penyewaan secara langsung. Platform ini juga dilengkapi dengan pengelolaan status transaksi secara real-time dan fitur verifikasi identitas penyewa untuk meningkatkan keamanan selama proses penyewaan.

SEWAIN ditujukan bagi pelaku usaha penyewaan khususnya UMKM, serta masyarakat yang membutuhkan suatu barang tanpa harus membelinya melainkan cukup dengan menyewanya. Platform ini membantu mengatasi berbagai kendala dalam sistem penyewaan manual, seperti pencatatan yang tidak rapi, jangkauan pelanggan yang terbatas, serta risiko penyalahgunaan barang. Dengan digitalisasi melalui Sewain, proses pengelolaan menjadi lebih efisien, transparan, dan dapat menjangkau lebih banyak pengguna.

---

## 2. Tim

| Nama | NIM | Peran |
|------|-----|-------|
| Djaky Abbyyu Fauzan Timumum | 10231032 | Lead Backend |
| Achmad Zaki Zaidan | 10231002 | Lead Frontend |
| Muhammad Alif Setiawan | 10231056 | Lead DevOps |
| Riqqah Khalda Karina | 10231082 | Lead QA & Docs |

---

## 3. Fitur Sistem

SEWAIN memiliki tiga peran utama dalam sistem:

- Super Admin  
- Admin (Penyedia Barang)  
- User (Penyewa)

| Peran | Kategori | Fitur Utama | Detail / Deskripsi |
|-------|----------|-------------|--------------------|
| Super Admin | Manajemen Admin | Pengelolaan Penyedia | Login sebagai Super Admin, melihat daftar seluruh admin (penyedia), menambahkan admin baru, mengedit data admin, dan menghapus admin. |
|  | Manajemen Konten | Pengelolaan Kategori Barang | Mengelola kategori barang yang tersedia di dalam platform. |
|  | Monitoring | Pengawasan Platform | Melihat seluruh aktivitas penyewaan dan melakukan monitoring keseluruhan platform secara menyeluruh. |
| Admin (Penyedia Barang) | Profil & Usaha | Pengelolaan Profil Usaha | Login sebagai admin dan mengelola profil usaha penyewaan. |
|  | Manajemen Produk | Pengelolaan Barang | Menambahkan barang yang disewakan, mengedit data barang, menghapus barang, mengatur harga sewa, dan mengatur jumlah atau stok barang. |
|  | Manajemen Order | Kontrol Permintaan Sewa | Melihat daftar permintaan sewa dari user, menyetujui atau menolak permintaan sewa. |
|  | Monitoring Transaksi | Status Penyewaan | Mengubah status penyewaan menjadi Pending, Disetujui, Sedang Disewa, atau Selesai. |
| User (Penyewa) | Akun & Profil | Registrasi & Data Diri | Registrasi akun, login, melengkapi data diri berupa nama lengkap, nama orang tua, alamat tempat tinggal, dan share location melalui peta atau koordinat. |
|  | Verifikasi Identitas | Validasi Legalitas | Upload foto KTP, upload foto selfie dengan KTP, dan melihat status verifikasi berupa Menunggu Verifikasi, Disetujui, atau Ditolak. |
|  | Aturan Sistem | Validasi Penyewaan | User hanya dapat melakukan penyewaan apabila data diri telah lengkap dan verifikasi identitas telah disetujui oleh admin. |
|  | Penyewaan | Proses Pemesanan | Melihat katalog barang dari berbagai penyedia, melihat detail barang, mencari barang, serta mengajukan penyewaan dengan memilih tanggal mulai dan tanggal selesai. |
|  | Monitoring | Status & Riwayat | Melihat status penyewaan berupa Pending, Disetujui, Sedang Disewa, atau Selesai, serta melihat riwayat penyewaan sebelumnya. |

---

## 4. Tech Stack

Bagian ini menjelaskan teknologi yang digunakan untuk membangun dan menjalankan aplikasi SEWAIN.

| Teknologi | Fungsi |
|-----------|--------|
| Python | Bahasa pemrograman utama untuk backend |
| FastAPI | Framework untuk membangun REST API |
| Uvicorn | Server untuk menjalankan aplikasi FastAPI |
| SQLAlchemy | ORM untuk menghubungkan aplikasi dengan database |
| PostgreSQL | Sistem database untuk menyimpan data |
| python-jose | Mengelola autentikasi berbasis JWT |
| passlib + bcrypt | Mengamankan password dengan hashing |
| Pydantic | Validasi data dan schema API |
| React | Library untuk membangun antarmuka pengguna |
| Vite | Tools untuk build dan pengembangan frontend |
| React Router DOM | Mengatur navigasi antar halaman |
| Tailwind CSS | Framework styling antarmuka |
| Radix UI | Komponen UI yang mudah diakses |
| Lucide React | Library ikon pada antarmuka |
| Sonner | Menampilkan notifikasi pada sistem |
| Docker | Containerisasi seluruh aplikasi |
| Docker Compose | Mengelola beberapa container sekaligus |
| Nginx | Web server untuk frontend |
| Docker Hub | Penyimpanan image aplikasi |

---

## 5. Architecture

Bagian ini menunjukkan hubungan antar komponen utama dalam aplikasi Sewain, mulai dari pengguna, frontend, backend, hingga database dalam menjalankan sistem.

```
graph TD
    User([User Browser])

    FE[Frontend]
    BE[Backend FastAPI]
    DB[(PostgreSQL Database)]

    User --> FE
    FE --> BE
    BE --> DB
```

Diagram di atas menunjukkan alur kerja utama dalam sistem Sewain secara sederhana. Setiap komponen memiliki peran masing-masing dalam menjalankan aplikasi, yaitu sebagai berikut:

- User Browser

  Pengguna mengakses aplikasi melalui browser untuk melihat tampilan sistem dan melakukan berbagai aktivitas seperti login, mencari barang, maupun melakukan penyewaan.

- Frontend

  Frontend berfungsi sebagai antarmuka pengguna yang menampilkan halaman aplikasi serta menerima input dari pengguna sebelum diteruskan ke backend.

- Backend FastAPI

  Backend bertugas memproses permintaan dari frontend, menjalankan logika sistem, dan mengatur komunikasi dengan database.

- PostgreSQL Database

  Database digunakan untuk menyimpan, mengambil, dan memperbarui seluruh data yang dibutuhkan oleh sistem.

---

## 6. Getting Started

### Prasyarat
- Python 3.10+
- Node.js 18+
- Git

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
<!--
## 7. Cara Menjalankan Aplikasi Menggunakan Docker

#### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall
- Port `3000`, `8000`, `15432` tidak dipakai aplikasi lain

#### Langkah-langkah

**1. Clone repositori**
```bash
git clone <url-repo>
cd cc-kelompok-harahetta-2
```

**2. Siapkan environment file**
```bash
cp backend/.env.docker.example backend/.env.docker
```
> File `.env.docker` sudah siap pakai dengan konfigurasi default. Ubah `SECRET_KEY` jika diperlukan.

**3. Jalankan semua service**
```bash
docker compose up -d
```

**4. Seed data awal (opsional)**
```bash
# Tunggu ~10 detik hingga DB siap, lalu:
docker compose exec db psql -U postgres -d data_sewain -f /dev/stdin < docs/seed-data.sql
```

**5. Akses aplikasi**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Database | `localhost:15432` (user: `postgres`, pass: `setiawan`) |
-->
---

## 8. Roadmap

| Minggu | Target | Status |
|--------|--------|--------|
| 1 | Setup & Hello World | ✅ |
| 2 | REST API + Database | ✅ |
| 3 | React Frontend | ✅ |
| 4 | Full-Stack Integration | ✅ |
| 5-7 | Docker & Compose | ⬜ |
| 8 | UTS Demo | ⬜ |
| 9-11 | CI/CD Pipeline | ⬜ |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |

---

## 9. Project Structure

```
cc-kelompok-harahetta-2/
├── backend/
│   ├── main.py                 # Entry point & semua endpoint API
│   ├── models.py               # Database models (SQLAlchemy)
│   ├── schemas.py              # Request/Response schemas (Pydantic)
│   ├── crud.py                 # Operasi database (CRUD)
│   ├── auth.py                 # JWT authentication & role guards
│   ├── database.py             # Koneksi database
│   ├── requirements.txt        # Dependensi Python
│   ├── Dockerfile              # Docker image backend
│   ├── setup.sh                # Script setup manual
│   ├── .env.example            # Template .env (local)
│   └── .env.docker.example     # Template .env (Docker)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Halaman utama (Dashboard, Login, dll.)
│   │   ├── components/         # Komponen UI reusable
│   │   ├── context/            # AuthContext (state global)
│   │   ├── services/api.js     # HTTP client ke backend
│   │   ├── App.jsx             # Router & layout utama
│   │   └── main.jsx            # Entry point React
│   ├── public/                 # Aset statis
│   ├── nginx.conf              # Konfigurasi Nginx
│   ├── Dockerfile              # Docker image frontend
│   ├── package.json            # Dependensi Node.js
│   └── vite.config.js          # Konfigurasi Vite
│
├── docs/
│   └── seed-data.sql           # Data awal untuk database
│
├── docker-compose.yml          # Orkestrasi semua service
└── README.md
```

---

<!-- 
## 10. API DOCUMENTATION TESTING

Pengujian dilakukan melalui Swagger UI untuk memastikan seluruh endpoint berjalan sesuai spesifikasi.  
Semua skenario pengujian menghasilkan output yang sesuai (SEMUA PASS).

#### 4.1 Hasil Pengujian 

1️⃣ **POST /items**

**Method:** POST  
**URL:** `/items`  
**Status Code:** 201 Created  

**Request Body:**
```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10
}
```

**Response Body:**
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "created_at": "2026-03-06T22:45:09.421640+08:00",
  "updated_at": null
}
```


2️⃣ **GET /items**

**Method:** GET  
**URL:** `/items`  
**Status Code:** 200 OK  

**Response Body:**
```json
{
  "total": 3,
  "items": [
    {
      "name": "Keyboard Mechanical",
      "description": "Keyboard untuk coding",
      "price": 1200000,
      "quantity": 8,
      "id": 4,
      "created_at": "2026-03-06T22:48:30.987654+08:00",
      "updated_at": null
    },
    {
      "name": "Mouse Wireless",
      "description": "Mouse bluetooth",
      "price": 250000,
      "quantity": 20,
      "id": 3,
      "created_at": "2026-03-06T22:47:15.123456+08:00",
      "updated_at": null
    },
    {
      "name": "Laptop",
      "description": "Laptop untuk cloud computing",
      "price": 15000000,
      "quantity": 10,
      "id": 1,
      "created_at": "2026-03-06T22:45:09.421640+08:00",
      "updated_at": null
    }
  ]
}
```


3️⃣ **GET /items/1**

**Method:** GET  
**URL:** `/items/1`  
**Status Code:** 200 OK  

**Response Body:**
```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 10,
  "id": 1,
  "created_at": "2026-03-06T22:45:09.421640+08:00",
  "updated_at": null
}
```


4️⃣ **PUT /items/1**

**Method:** PUT  
**URL:** `/items/1`  
**Status Code:** 200 OK  

**Request Body:**
```json
{
  "price": 14000000
}
```

**Response Body:**
```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 14000000,
  "quantity": 10,
  "id": 1,
  "created_at": "2026-03-06T22:45:09.421640+08:00",
  "updated_at": "2026-03-06T22:52:47.410707+08:00"
}
```


5️⃣ **GET /items/1 (Verifikasi Update)**

**Method:** GET  
**URL:** `/items/1`  
**Status Code:** 200 OK  

**Response Body:**
```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 14000000,
  "quantity": 10,
  "id": 1,
  "created_at": "2026-03-06T22:45:09.421640+08:00",
  "updated_at": "2026-03-06T22:52:47.410707+08:00"
}
```


6️⃣ **GET /items?search=laptop**

**Method:** GET  
**URL:** `/items?search=laptop`  
**Status Code:** 200 OK  

**Response Body:**
```json
{
  "total": 1,
  "items": [
    {
      "name": "Laptop",
      "description": "Laptop untuk cloud computing",
      "price": 14000000,
      "quantity": 10,
      "id": 1,
      "created_at": "2026-03-06T22:45:09.421640+08:00",
      "updated_at": "2026-03-06T22:52:47.410707+08:00"
    }
  ]
}
```


7️⃣ **DELETE /items/1**

**Method:** DELETE  
**URL:** `/items/1`  
**Status Code:** 204 No Content  

**Response Body:**  
Kosong (No Content)



8️⃣ **GET /items/1 (Verifikasi Delete)**

**Method:** GET  
**URL:** `/items/1`  
**Status Code:** 404 Not Found  

**Response Body:**
```json
{
  "detail": "Item dengan id=1 tidak ditemukan"
}
```

9️⃣ **GET /items/stats**

**Method:** GET  
**URL:** `/items/stats`  
**Status Code:** 200 OK

**Response Body:**
```json
{
  "total_items": 3,
  "total_value": 84600000,
  "most_expensive": {
    "name": "Laptop",
    "price": 14000000
  },
  "cheapest": {
    "name": "Mouse Wireless",
    "price": 250000
  }
}
```

#### 4.2 Ringkasan Hasil Pengujian
Seluruh endpoint telah diuji melalui Swagger UI dan berjalan sesuai dengan spesifikasi fungsional. Validasi data, pagination, search, serta error handling berfungsi dengan baik. Backend dinyatakan stabil dan siap untuk tahap integrasi frontend maupun deployment ke lingkungan cloud.

| No | Method | URL | Request Body | Response Body (Actual) | HTTP Status Code | Hasil Pengujian |
|----|--------|-----|--------------|------------------------|------------------|-----------------|
| 1 | POST | /items | `{name, description, ...}` | Data item baru + ID & Timestamp | 201 Created | ✅ Sesuai |
| 2 | GET | /items | - | List 3 item (JSON Array) | 200 OK | ✅ Sesuai |
| 3 | GET | /items/1 | - | Detail item ID 1 (Laptop) | 200 OK | ✅ Sesuai |
| 4 | PUT | /items/1 | `{price: 14000000}` | Data ter-update & Timestamp berubah | 200 OK | ✅ Sesuai |
| 5 | GET | /items/1 | - | Detail item ID 1 (Harga terbaru) | 200 OK | ✅ Sesuai |
| 6 | GET | /items?search=laptop | - | List item hasil pencarian (Laptop) | 200 OK | ✅ Sesuai |
| 7 | DELETE | /items/1 | - | Kosong (No Content) | 204 No Content | ✅ Sesuai |
| 8 | GET | /items/1 | - | Error Message: Not Found | 404 Not Found | ✅ Sesuai |
| 9 | GET | /items/stats | - | Statistik total item & nilai inventaris | 200 OK | ✅ Sesuai |

---

## 🚀 Frontend React — UI & API Integration

Pada tahap ini, aplikasi SEWAIN mulai mengintegrasikan antarmuka pengguna (Frontend) dengan layanan API (Backend) menggunakan React.js.

**1. Fitur Frontend yang Diimplementasikan**

Berdasarkan panduan Modul 3, pada tahap ini telah berhasil dikembangkan berbagai fitur pada sisi frontend. Aplikasi telah memiliki tampilan antarmuka (UI) yang memungkinkan pengguna berinteraksi secara langsung dengan sistem.

Fitur yang tersedia meliputi dashboard item yang berfungsi untuk menampilkan katalog barang sewa secara dinamis dari database. Selain itu, telah diimplementasikan fitur management UI berbasis CRUD, yaitu form penambahan barang baru dengan validasi field, fitur edit detail barang langsung melalui interface, serta tombol hapus yang telah terintegrasi dengan database secara real-time.

Dari sisi interaktivitas, aplikasi dilengkapi dengan SearchBar untuk melakukan pencarian barang secara instan (client-side filtering). Terdapat juga API Status Indicator yang menampilkan status koneksi ke server (Connected/Disconnected). 

**2. Arsitektur Kode**

Struktur folder pada sisi frontend `(/frontend/src)` telah diorganisir secara sistematis untuk mendukung pengembangan yang rapi dan terstruktur.

Folder `services/api.js` digunakan untuk menangani logika komunikasi dengan backend FastAPI menggunakan pendekatan async/await.

Komponen antarmuka pengguna ditempatkan dalam folder `components/` agar bersifat reusable, yang terdiri dari `Header.jsx, SearchBar.jsx, ItemForm.jsx, ItemList.jsx, dan ItemCard.jsx.`

Sementara itu, `App.jsx` berfungsi sebagai pengelola state utama aplikasi dengan memanfaatkan React Hooks seperti `useState` dan `useEffect`. Struktur ini menunjukkan penerapan konsep clean architecture dalam pengembangan frontend.

**3. Cara Menjalankan Aplikasi (Local Development)**

Untuk menjalankan aplikasi secara keseluruhan, pastikan database PostgreSQL dalam keadaan aktif. Selanjutnya, aplikasi dijalankan menggunakan dua terminal karena terdiri dari backend dan frontend.

Terminal pertama digunakan untuk menjalankan backend pada port 8000:
```bash
cd backend
source venv/bin/activate (atau venv\Scripts\activate untuk Windows)
uvicorn main:app --reload
```

Terminal kedua digunakan untuk menjalankan frontend pada port 5173:
```bash
cd frontend
npm install
npm run dev
```

Kedua server harus dijalankan secara bersamaan agar aplikasi dapat berjalan dengan baik. Jika backend tidak aktif, maka frontend tidak dapat mengambil data sehingga tampilan tidak akan muncul dengan semestinya.

**4. Penggunaan Environment Variables**

Dalam implementasinya, URL API seperti http://localhost:8000
tidak dituliskan secara langsung di dalam kode program, melainkan disimpan dalam file .env. Pendekatan ini bertujuan untuk meningkatkan keamanan serta memudahkan proses konfigurasi apabila aplikasi dipindahkan ke lingkungan lain, seperti server cloud.

**5. Laporan Hasil Pengujian UI (QA Testing)**

Berdasarkan hasil pengujian yang telah dilakukan, seluruh fitur CRUD dan interaktivitas aplikasi berjalan dengan baik dan sesuai dengan yang diharapkan. Setiap aksi yang dilakukan pada antarmuka pengguna telah terhubung dengan backend dan database secara sinkron.

Berikut adalah ringkasan hasil pengujian yang telah dilakukan:
| No | Skenario Pengujian | Langkah Pengerjaan                                         | Hasil Sebenarnya                                           | Status   |
| -- | ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| 1  | Status API         | Membuka dashboard dan mengecek indikator koneksi di header | Indikator berubah menjadi "Connected" saat backend aktif   | ✅ Sesuai |
| 2  | Sync Data          | Me-refresh halaman utama aplikasi                          | Data dari PostgreSQL berhasil di-fetch dan tampil otomatis | ✅ Sesuai |
| 3  | Create Item        | Mengisi form tambah barang dan submit                      | Data baru terkirim ke API dan muncul tanpa refresh         | ✅ Sesuai |
| 4  | Read Data          | Melihat kartu barang di dashboard                          | Informasi nama, harga, dan deskripsi tampil akurat         | ✅ Sesuai |
| 5  | Edit Mode          | Menekan tombol edit pada item                              | Form otomatis terisi data awal                             | ✅ Sesuai |
| 6  | Update Data        | Mengubah data dan menyimpan                                | Data ter-update dan langsung terlihat di UI                | ✅ Sesuai |
| 7  | Search Feature     | Mengetik kata kunci di SearchBar                           | Data terfilter sesuai input                                | ✅ Sesuai |
| 8  | Delete Item        | Menekan tombol hapus dan konfirmasi                        | Data terhapus dari UI dan database                         | ✅ Sesuai |
| 9  | Loading State      | Mensimulasikan delay koneksi                               | Muncul indikator "Loading..."                              | ✅ Sesuai |
| 10 | Validation         | Mengosongkan field lalu submit                             | Muncul pesan error dan data tidak dikirim                  | ✅ Sesuai |

---

## 🔐 Authentication

Pengujian sistem dilakukan untuk memastikan seluruh fitur aplikasi berjalan dengan baik sesuai dengan kebutuhan yang telah dirancang. Proses pengujian mencakup fitur autentikasi (authentication), pengelolaan data (CRUD), serta pengujian alur penggunaan secara menyeluruh (end-to-end). Untuk melihat hasil pengujian berupa screenshot, silakan buka folder berikut:
[Folder Screenshot Testing](./docs/img/imgw4/)

Pengujian dilakukan dengan mensimulasikan interaksi langsung pengguna terhadap aplikasi, mulai dari proses registrasi, login, pengelolaan data barang, hingga logout. Setiap skenario diuji untuk memastikan bahwa sistem dapat memberikan respon yang sesuai, data tersimpan dengan benar di database, serta tampilan antarmuka tetap sinkron dengan kondisi sistem.

Berikut adalah hasil pengujian yang telah dilakukan:

### Authentication Testing

| Kode | Skenario Pengujian | Langkah Pengerjaan | Hasil Sebenarnya | Status |
|----|-------------------|------------------|----------------------|--------|
| auth1 | Register User | Mengisi semua field dan klik register | User berhasil dibuat dan masuk ke dashboard | ✅ Sesuai |
| auth2 | Validasi Register | Mengosongkan field | Muncul pesan error dan data tidak dikirim | ✅ Sesuai |
| auth3 | Login Berhasil | Login dengan email & password yang benar | User berhasil masuk ke dashboard | ✅ Sesuai |
| auth4 | Login Gagal | Input email/password salah | Muncul error login gagal | ✅ Sesuai |
| auth5 | Logout | Klik tombol logout | Kembali ke halaman login | ✅ Sesuai |

### CRUD Testing 

| No | Skenario Pengujian | Langkah Pengerjaan | Hasil Sebenarnya | Status |
|----|-------------------|------------------|----------------------|--------|
| crud1 | Create Item | Mengisi form dan klik tambah | Item baru muncul di dashboard | ✅ Sesuai |
| crud2 | Validasi Form | Mengosongkan field wajib | Muncul error dan data tidak dikirim | ✅ Sesuai |
| crud3 | Read Data | Membuka dashboard | Semua item tampil dengan data lengkap | ✅ Sesuai |
| crud4 | Update Item | Klik edit, ubah data, simpan | Data berubah di UI dan database | ✅ Sesuai |
| crud5 | Delete Item | Klik hapus dan konfirmasi | Item terhapus dari UI dan database | ✅ Sesuai |
| crud6 | Search Feature | Ketik di search bar | Data terfilter sesuai kata kunci | ✅ Sesuai |
| crud7 | Sorting | Mengubah urutan data | Data terurut sesuai pilihan | ✅ Sesuai |

### End-to-End Testing (Modul 4)

| No | Skenario Pengujian | Langkah Pengerjaan | Hasil Sebenarnya | Status |
|----|-------------------|------------------|----------------------|--------|
| ee1 | Buka aplikasi | Membuka localhost:5173 di browser | Halaman login muncul | ✅ Sesuai |
| ee2 | Register user | Mengisi form register dan submit | User berhasil terdaftar | ✅ Sesuai |
| ee3 | Auto login | Setelah register selesai | User otomatis masuk ke dashboard | ✅ Sesuai |
| ee4 | Dashboard tampil | Setelah login berhasil | Halaman dashboard dan data item muncul | ✅ Sesuai |
| ee5 | Nama user muncul | Melihat bagian header | Nama user tampil di header | ✅ Sesuai |
| ee6 | CRUD berjalan | Menambah, edit, dan hapus item | Semua fitur CRUD berjalan dengan baik | ✅ Sesuai |
| ee7 | Logout | Klik tombol logout | User keluar dari sistem | ✅ Sesuai |
| ee8 | Kembali ke login | Setelah logout | Halaman login ditampilkan kembali | ✅ Sesuai |
| ee9 | Login ulang | Login dengan akun yang sama | User berhasil masuk kembali | ✅ Sesuai |
| ee10 | Data tetap ada | Setelah login ulang | Data item tetap tersimpan dan tampil | ✅ Sesuai |

---
-->