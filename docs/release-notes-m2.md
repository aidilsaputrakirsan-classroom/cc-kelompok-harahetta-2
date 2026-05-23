# Release Notes — Milestone 2 

> Dokumen ini berisi rangkuman pengembangan aplikasi pada Milestone 2 yang berfokus pada implementasi *Continuous Integration* dan *Continuous Deployment* (CI/CD). Pada fase ini, aplikasi telah berhasil di-*deploy* ke server cloud dan terhubung dengan pipeline otomatis berbasis GitHub Actions.

---

## Deployment dan Infrastruktur Cloud

Pada tahap pengembangan awal, deployment aplikasi direncanakan menggunakan platform Railway. Namun, selama proses implementasi ditemukan beberapa kendala pada proses deployment dan kestabilan layanan sehingga deployment production tidak dapat berjalan secara optimal.

Sebagai solusi sementara agar aplikasi tetap dapat diakses dan diuji secara publik, seluruh kelompok menggunakan satu server bersama yang disediakan oleh asisten dosen untuk proses deployment aplikasi production.

Meskipun deployment production tidak menggunakan Railway secara penuh, pipeline CI/CD tetap dijalankan menggunakan GitHub Actions untuk proses otomatisasi pengujian dan workflow pengembangan aplikasi.

Setiap perubahan kode yang dikirim ke branch utama akan secara otomatis melalui proses:

1. Validasi source code  
2. Proses build aplikasi  
3. Pengujian otomatis (*automated testing*)  
4. Deployment ke server production  

Dengan implementasi ini, proses distribusi aplikasi menjadi lebih cepat, konsisten, dan meminimalkan kesalahan manual saat deployment.

---

## Production URLs

| Layanan | URL |
|---|---|
| Live Demo Application | `https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/` |

---

## Fitur Utama yang Tersedia

### 1. Sistem Autentikasi Pengguna

Aplikasi telah mendukung fitur autentikasi berbasis JSON Web Token (JWT), meliputi:

- Registrasi akun pengguna baru
- Login pengguna
- Validasi password
- Penyimpanan token autentikasi di browser


### 2. Manajemen Data (CRUD)

Pengguna dapat melakukan pengelolaan data secara langsung melalui dashboard aplikasi, meliputi:

- Menambahkan data
- Melihat daftar data
- Mengubah data
- Menghapus data

Seluruh proses telah terhubung dengan database PostgreSQL pada server production.


### 3. Integrasi Layanan Pihak Ketiga

Aplikasi juga telah mendukung integrasi layanan eksternal, antara lain:

- Simulasi pembayaran menggunakan Midtrans
- Pengiriman email verifikasi akun secara otomatis

---

## Tech Stack

### Frontend

- React.js
- Vite
- JavaScript / TypeScript

### Backend

- FastAPI
- Python 3.11
- Arsitektur ASGI

### Database

- PostgreSQL (Production Database)
- SQLite (`test.db`) untuk pengujian lokal

### DevOps & CI/CD

- GitHub Actions
- Docker Build Automation
- Cloud Deployment Server

---

## Implementasi CI/CD

Pipeline CI/CD pada proyek ini menggunakan GitHub Actions untuk membantu proses otomatisasi pengembangan dan deployment aplikasi.

Pipeline otomatis mencakup:

- Linting source code
- Automated testing menggunakan Pytest
- Build container aplikasi
- Deployment ke server production

Dengan sistem ini, setiap update kode dapat langsung diuji dan dipublikasikan secara otomatis tanpa perlu deployment manual.


---

##  Hasil Deployment

Deployment aplikasi berhasil dilakukan dengan status:

- Frontend berhasil berjalan di environment production
- Backend API aktif dan dapat diakses publik
- Database PostgreSQL berhasil terhubung
- Pipeline GitHub Actions berhasil menjalankan workflow otomatis
- Aplikasi dapat diakses secara publik melalui domain live demo
