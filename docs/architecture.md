# Dokumentasi Arsitektur Microservices 

Dokumen ini menjelaskan arsitektur sistem Sewain setelah didekomposisi dari struktur Monolith menjadi Microservices, lengkap dengan pemetaan port, API Contract, dan panduan operasional lokal. Tujuan penyusunan dokumen arsitektur ini adalah sebagai berikut:

- Menjadi panduan utama bagi seluruh tim dalam memahami arsitektur sistem microservices.
- Menstandarkan integrasi antar layanan melalui API Contract yang disepakati bersama.
- Mempermudah proses kolaborasi dan konfigurasi lingkungan pengembangan lokal.
- Menjadi pedoman dalam pemeliharaan, monitoring, dan troubleshooting sistem.

---

## 1. Diagram Arsitektur Sistem

Berikut adalah visualisasi arsitektur microservices Sewain saat ini. Fungsionalitas terbagi menjadi dua, Nginx bertindak sebagai API Gateway tunggal yang mengarahkan request client ke dua service utama (Auth Service dan Item Service) dengan database PostgreSQL yang saling terisolasi (Database per Service).

```mermaid
graph TD
    %% Client Tier
    User([User Browser]) -->|Akses UI Port 3000| FE[Frontend React]
    
    %% Gateway Tier
    FE -->|API Call Port 80| Gateway[Nginx API Gateway]
    
    %% Service Tier
    Gateway -->|Path /auth/* -> Port 8001| AuthService[Auth Service FastAPI]
    Gateway -->|Path /items/* -> Port 8002| ItemService[Item Service FastAPI]
    
    %% Database Tier
    AuthService -->|Port 5432| AuthDB[(Auth DB PostgreSQL)]
    ItemService -->|Port 5432| ItemDB[(Item DB PostgreSQL)]
    
    %% Inter-Service Communication
    ItemService -.->|HTTP POST /verify| AuthService

    %% Styling
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef gateway fill:#bbf,stroke:#333,stroke-width:2px;
    classDef service fill:#bfb,stroke:#333,stroke-width:2px;
    classDef db fill:#ffb,stroke:#333,stroke-width:2px;

    class User,FE client;
    class Gateway gateway;
    class AuthService,ItemService service;
    class AuthDB,ItemDB db;
```

---

## 2. Daftar Service dan Alokasi Port

Aplikasi dipetakan menjadi 6 container yang berjalan di dalam jaringan Docker internal (`docker-compose.yml`). Berikut adalah spesifikasi port eksternal (*host*) dan port internal (*container*) untuk masing-masing layanan:

| Service | Port Host | Port Container | Deskripsi Fungsional                                              |
| --------------------- | ----------------- | -------------- | ----------------------------------------------------------------- |
| `gateway`   | 80                | 80             | API Gateway — reverse proxy tunggal untuk semua request. |
| `frontend`            | 3000              | 3000           | React SPA — UI aplikasi yang melayani interaksi pengguna. |
| `auth-service`        | 8001              | 8001           | Registrasi, login, dan verifikasi JWT token.         |
| `item-service`        | 8002              | 8002           | CRUD items dan statistik inventaris sewa.  |
| `auth-db`             | 5433              | 5432           | Database PostgreSQL khusus untuk menyimpan kredensial pengguna.   |
| `item-db`             | 5434              | 5432           | Database PostgreSQL khusus untuk menyimpan data barang/item.      |

> Catatan: Port host database sengaja diarahkan ke 5433 dan 5434 agar tidak bentrok dengan instalasi PostgreSQL lokal bawaan sistem operasi (default 5432).
---

## 3. API Contract

Seluruh request dari client harus dikirim melalui API Gateway pada port `80`. Nginx akan meneruskan request secara otomatis ke service yang sesuai.

### A. Routing Table (Nginx Gateway Config)

| Path Pattern | Target Service | Keterangan |
|-------------|---------------|-------------|
| `/auth/*` | `auth-service:8001` | Semua endpoint autentikasi |
| `/items/*` | `item-service:8002` | Semua endpoint item dan statistik |
| `/health` | Gateway langsung | Health check aggregator |
| `/*` (default) | `frontend:3000` | Static files dan React SPA fallback |


### B. Microservices API Contract

#### 🔐 Auth Service

Layanan ini berfungsi untuk mengelola autentikasi pengguna, seperti registrasi akun, login, serta verifikasi token JWT untuk menjaga keamanan akses sistem.

| Method | Endpoint Path | Auth Level | Deskripsi Fungsional |
|---------|--------------|------------|---------------------|
| `POST` | `/auth/register` | Public | Mendaftarkan akun pengguna baru ke database `auth_db`. |
| `POST` | `/auth/login` | Public | Memvalidasi kredensial pengguna dan menghasilkan token akses JWT. |
| `GET` | `/auth/verify` | Internal | Endpoint internal untuk memverifikasi validitas token JWT dari `item-service`. |


#### 📦 Item Service

Layanan ini digunakan untuk mengelola data inventaris atau barang milik pengguna, mulai dari menambahkan, menampilkan, memperbarui, hingga menghapus data item.

| Method | Endpoint Path | Auth Level | Deskripsi Fungsional |
|---------|--------------|------------|---------------------|
| `GET` | `/items` | Public | Mengambil seluruh daftar barang atau item yang tersedia untuk disewa. |
| `POST` | `/items` | Admin | Menambahkan data barang atau item baru ke dalam database `item_db`. |
| `GET` | `/items/{id}` | Public | Mengambil detail satu data barang berdasarkan ID item. |
| `PUT` | `/items/{id}` | Admin | Memperbarui informasi barang berdasarkan ID item. |
| `DELETE` | `/items/{id}` | Admin | Menghapus data barang secara permanen berdasarkan ID item. |
| `GET` | `/items/stats` | Admin | Menampilkan hasil analisis statistik item (total item, rata-rata harga, dan informasi lainnya). |

---

## 4. Panduan Menjalankan Sistem Secara Lokal

Panduan ini digunakan untuk membantu anggota tim atau pengguna baru menjalankan seluruh sistem microservices di komputer lokal.

### Prasyarat

Sebelum memulai, pastikan perangkat telah memenuhi kebutuhan berikut:

* Git telah terinstal untuk mengunduh kode program dari repositori.
* Docker dan Docker Desktop telah terinstal serta dalam kondisi aktif.
* Port `80` dan `3000` tidak digunakan oleh aplikasi lain agar tidak terjadi konflik port.


### Langkah-Langkah Operasional

**1. Mengunduh Repository Proyek**

Buka Terminal, Git Bash, atau Command Prompt, lalu jalankan perintah berikut:

```bash 
git clone [https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2.git](https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-harahetta-2.git)
cd cc-kelompok-harahetta-2
```

> Perintah ini digunakan untuk mengunduh seluruh source code proyek ke komputer lokal.


**2. Menyiapkan File Environment**

Jika proyek menggunakan file konfigurasi environment, jalankan:

```bash 
cp .env.example .env
```

> Langkah ini digunakan untuk menyalin konfigurasi environment agar service dapat saling terhubung dengan benar.


**3. Build dan Menjalankan Container**

Jalankan perintah berikut:

```bash 
docker-compose up --build -d
```

> Perintah `up` digunakan untuk menjalankan seluruh service, `--build` untuk melakukan build ulang image agar perubahan terbaru diterapkan, dan `-d` untuk menjalankan container di background.


**4. Memeriksa Status Container**

Jalankan perintah berikut untuk memastikan semua service berjalan normal:

```bash 
docker-compose ps
```

> Pastikan seluruh container memiliki status `Up` atau `healthy`.


**5. Menghentikan Seluruh Layanan**

Jika pengembangan atau pengujian telah selesai, jalankan:

```bash 
docker-compose down
```

> Perintah ini digunakan untuk menghentikan seluruh container dan membebaskan kembali port yang digunakan sistem.

---

## 5. Panduan Pelacakan Kesalahan 

Panduan ini membantu melacak dan mengatasi error yang umum terjadi pada sistem microservices.


### A. Melihat Log Container

Gunakan perintah berikut untuk melihat log dari service tertentu.

**Log API Gateway (Nginx)**

```bash 
docker-compose logs -f gateway
```

> Digunakan untuk memeriksa masalah routing atau gateway.


**Log Auth Service**

```bash 
docker-compose logs -f auth-service
```

> Digunakan untuk memeriksa error pada layanan autentikasi.


**Log Item Service**

```bash 
docker-compose logs -f item-service
```

> Digunakan untuk memeriksa error pada layanan item atau inventaris.


### B. Masalah Umum dan Solusi

| No | Permasalahan                                       | Penyebab                                                                    | Solusi                                                                                                                                                                        |
| -- | -------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | `Connection Refused` pada Item Service             | Konfigurasi `AUTH_SERVICE_URL` salah dan masih menggunakan `localhost`.     | Pastikan menggunakan nama service Docker.<br><br>Benar:<br>`AUTH_SERVICE_URL: http://auth-service:8001`<br><br>Salah:<br>`AUTH_SERVICE_URL: http://localhost:8001`            |
| 2  | Perubahan kode program tidak terefleksi di browser             | Docker masih menggunakan volume database atau image lama yang di-cache.     | Lakukan pembersihan paksa cache volume dan build ulang: <br>`docker compose down -v` <br> `docker compose up -d --build`            |
| 3  | Error `502 Bad Gateway`                            | Service backend mati atau crash.                                            | Periksa status container dengan:<br><br>`bash docker-compose ps `<br><br>Jika ada service `Exit`, cek log dengan:<br><br>`bash docker-compose logs <nama-service> `           |
| 4  | Error `CORS Blocked`                               | Frontend mengakses API langsung ke port backend atau CORS belum diaktifkan. | Pastikan frontend mengakses API melalui gateway `http://localhost/auth/...` dan tambahkan `CORSMiddleware` pada FastAPI.                                                      |
| 5  | Perubahan Database atau `.env` Tidak Berubah       | Docker masih menggunakan volume database lama.                              | Hapus volume lama lalu build ulang:<br><br>`bash docker-compose down -v` kemudian `docker-compose up --build -d `                                                                        |