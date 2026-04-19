## BAGIAN 1: LIVE DEMO (10 Menit)

### 1. Inisialisasi & Infrastruktur (Lead DevOps) — 2 Menit

**Aksi:**  
Menjalankan perintah `docker compose up -d` dan `docker compose ps` pada terminal.

**Poin Penjelasan:**
- Proses pengaktifan seluruh layanan aplikasi secara detached mode.
- Verifikasi status ketiga container (`db`, `backend`, `frontend`) untuk memastikan semuanya berstatus **Up**.
- Pemeriksaan healthcheck pada database untuk memastikan layanan siap menerima koneksi sebelum backend berinteraksi dengan data.


### 2. Autentikasi & Dokumentasi API (Lead Backend) — 2 Menit

**Aksi:**  
Mengakses halaman Swagger UI (Dokumentasi API).

**Poin Penjelasan:**
- Penyajian daftar endpoint API yang telah terdaftar untuk operasi Auth dan CRUD.
- Penjelasan mengenai skema keamanan menggunakan JSON Web Token (JWT) untuk memproteksi endpoint privat.
- Validasi bahwa setiap permintaan ke database memerlukan otentikasi yang sah melalui sistem backend.


### 3. Alur Pengguna & Integrasi Autentikasi (Lead Frontend) — 2 Menit

**Aksi:**  
Melakukan proses Registrasi akun baru, Login, dan simulasi akses ilegal (tanpa login).

**Poin Penjelasan:**
- Demonstrasi alur registrasi user baru yang terintegrasi langsung dengan database melalui API backend.
- Proses login untuk mendapatkan token akses dan dialihkan ke halaman dashboard.
- Verifikasi sistem keamanan frontend yang membatasi akses URL dashboard bagi pengguna yang tidak memiliki token (*unauthorized*).


### 4. Operasi CRUD & Fitur Pencarian (Lead QA & Docs) — 2 Menit

**Aksi:**  
Menambah data, memperbarui data, melakukan pencarian kata kunci, dan menghapus data.

**Poin Penjelasan:**
- Uji coba fungsionalitas Create, Read, Update, dan Delete (CRUD) untuk memastikan data sinkron antara antarmuka pengguna dan database.
- Demonstrasi fitur pencarian untuk memfilter data secara dinamis dari frontend.
- Validasi penanganan dialog konfirmasi saat penghapusan data untuk mencegah kesalahan pengguna.


### 5. Uji Persistensi Data (Lead DevOps) — 2 Menit

**Aksi:**  
Menjalankan `docker compose down`, mengaktifkan kembali dengan `up`, dan melakukan login ulang.

**Poin Penjelasan:**
- Pembuktian bahwa data bersifat permanen dan tidak hilang meskipun seluruh container dihentikan atau dihapus.
- Penjelasan mengenai peran Docker Volumes yang memetakan direktori database di dalam container ke penyimpanan lokal host.
- Verifikasi akhir bahwa data yang diinput sebelumnya masih tersedia setelah sistem dijalankan ulang.

---

## BAGIAN 2: CODE WALKTHROUGH (5 Menit)

### 1. Konfigurasi Orchestrasi & Network (Lead DevOps) — 1.25 Menit

**Berkas:**  
`docker-compose.yml`

**Deskripsi Teknis:**  
Penjelasan mengenai definisi service, penggunaan properti `depends_on` dengan kondisi `service_healthy`, serta konfigurasi network internal yang memisahkan lalu lintas data antar container dari jaringan publik.


### 2. Backend & Manajemen Keamanan (Lead Backend) — 1.25 Menit

**Berkas:**  
`backend/Dockerfile` dan modul autentikasi.

**Deskripsi Teknis:**  
Penjelasan penggunaan base image yang efisien, teknik layer caching dalam Dockerfile, implementasi password hashing menggunakan library keamanan, dan manajemen rahasia melalui variabel lingkungan (*Environment Variables*).


### 3. Optimasi Frontend & Multi-stage Build (Lead Frontend) — 1.25 Menit

**Berkas:**  
`frontend/Dockerfile`

**Deskripsi Teknis:**  
Penjelasan strategi *multi-stage build* yang memisahkan tahap kompilasi (Node.js) dengan tahap distribusi (Nginx). Hal ini bertujuan untuk menghasilkan image akhir yang berukuran minimal dan memiliki tingkat keamanan lebih tinggi karena tidak menyertakan source code.


### 4. Struktur Proyek & Manajemen Repositori (Lead QA & Docs) — 1.25 Menit

**Berkas:**  
`README.md` dan riwayat commit Git.

**Deskripsi Teknis:**  
Penjelasan mengenai dokumentasi teknis langkah instalasi, penjelasan arsitektur sistem, serta demonstrasi alur kerja Git (branching dan commits) yang mencerminkan kontribusi terstruktur dari setiap anggota tim.

---