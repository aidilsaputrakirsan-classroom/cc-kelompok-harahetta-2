# Perencanaan Pengembangan Aplikasi "Sewain" (Minggu 1-15)

Dokumen ini berisi perencanaan detail (*Task Planning*) pengembangan aplikasi penyewaan barang "Sewain" berdasarkan modul praktikum Cloud Computing dari Minggu ke-1 hingga Minggu ke-15.

Setiap minggu memuat pembagian tugas spesifik untuk masing-masing *role* di kelompok (Frontend, Backend, DevOps, dan QA).

## Roles (Peran Tim)
1. **Frontend Developer (FE):** Bertanggung jawab atas UI/UX, integrasi API, dan aplikasi klien React.
2. **Backend Developer (BE):** Bertanggung jawab atas logika server, database, API, dan microservices dengan FastAPI.
3. **Lead DevOps (DevOps):** Bertanggung jawab pada infrastruktur, Docker, CI/CD Github Actions, dan monitoring server.
4. **QA & Documentation (QA):** Bertanggung jawab pada pengujian (testing), keandalan sistem, dokumentasi, dan validasi *security*.

---

## Rincian Task Mingguan

### 📝 Modul 1: Pengantar Cloud Computing & Setup Environment
Fokus: Persiapan repository dan environment lokal agar semua anggota bisa memulai ngoding.
* **DevOps:**
  - Membuat repository GitHub untuk project `Sewain`.
  - Mengatur branch protection (`main`) dan invite member kelompok.
  - Setup struktur folder awal (`frontend/` dan `backend/`).
* **Frontend:**
  - Inisialisasi project React Vite untuk frontend Sewain di folder `frontend/`.
  - Melakukan instalasi UI CSS framework (misal Tailwind CSS).
* **Backend:**
  - Inisialisasi environment Python (misal `venv`) untuk backend FastAPI di folder `backend/`.
  - Install dependencies awal (`fastapi`, `uvicorn`).
* **QA:**
  - Membuat `README.md` pada root project.
  - Dokumentasikan tata cara setup project secara lokal untuk seluruh anggota panduan.

---

### 📝 Modul 2: Backend REST API — FastAPI + PostgreSQL
Fokus: Pembuatan fondasi database dan skema API backend.
* **Backend:**
  - Membuat skema Database PostgreSQL untuk entitas dasar: `User`, `Item` (barang), dan `Transaction` (penyewaan).
  - Membuat endpoint CRUD sederhana untuk fitur `Item` (Tambah, Lihat, Hapus barang sewaan).
* **Frontend:**
  - Membuat *Mockup/Wireframe* halaman katalog barang dan halaman penyewaan.
* **DevOps:**
  - Menyediakan file setup DB simpel atau instruksi menjalankan PostgreSQL lokal untuk tim BE.
* **QA:**
  - Memastikan endpoint Backend memiliki spesifikasi (mis. Swagger Docs bisa dikunjungi) dan mengetes CRUD barang via Postman/cURL.

---

### 📝 Modul 3: Frontend React — UI & API Integration
Fokus: Pembuatan UI menggunakan React dan mulai menarik data dummy/API lokal.
* **Frontend:**
  - Membuat halaman utama (Home/Katalog Barang).
  - Membuat halaman detail barang sewaan (Item detail).
  - *State management* untuk menyimpan status jika suatu item ditekan tombol "Sewa".
* **Backend:**
  - Menyiapkan dummy data barang banyak lewat script (Seeder) untuk di-test Frontend.
* **DevOps:**
  - Menangani error dependensi di komputer anggota lain akibat beda versi Node.JS.
* **QA:**
  - Mengecek cross-browser compatibility dan UI responsive Frontend.

---

### 📝 Modul 4: Integrasi Full-Stack — CORS, ENV Variables & JWT Auth
Fokus: Menyambungkan Frontend dan Backend, implementasi sistem Autentikasi/Login.
* **Backend:**
  - Mengimplementasikan fitur JWT Authentication (Register, Login, Generate Token).
  - Mengatur CORS (Cross-Origin Resource Sharing) agar Endpoint bisa dipanggil React.
* **Frontend:**
  - Implementasi UI form Login/Register.
  - Mengirim `Authorization: Bearer <token>` pada saat menekan tombol "Sewa Barang".
* **DevOps:**
  - Menentukan *rules* untuk `.env` (Environment Variables) agar kunci JWT *secret* atau password DB tidak salah *commit* (cek `.gitignore`).
* **QA:**
  - Menguji *End-to-End flow*: Register -> Login -> Pinjam Barang dengan API asli yang berjalan.

---

### 📝 Modul 5: Docker Fundamentals — Dockerfile, Image & Container
Fokus: Membungkus Backend dan Frontend ke dalam Docker container untuk pertama kali.
* **DevOps:** 
  - Melatih anggota tim untuk menjalankan container Docker.
  - Review `Dockerfile` yang telah dibuat BE dan FE, memastikan tidak terlalu berat ukurannya.
* **Frontend:**
  - Membuat `Dockerfile` simpel untuk *development mode* React App.
* **Backend:**
  - Membuat `Dockerfile` untuk aplikasi FastAPI.
* **QA:**
  - Mencoba mem-build image Docker di PC secara mandiri agar memastikan `Dockerfile` jalan di Environment berbeda.

---

### 📝 Modul 6: Docker Lanjutan — Multi-Stage Build, Volumes & Networks
Fokus: Optimasi ukuran Image Node.JS dan persistent data Database.
* **DevOps:**
  - Mengatur *Docker Volumes* agar ketika Container database mati, data barang dan user tidak hilang.
  - Mengatur *Docker Network* agar container Backend mengetahui hostname container Database.
* **Frontend:**
  - Mengubah `Dockerfile` menjadi *Multi-Stage Build* (Build project React -> Serve HTML path statik menggunakan Nginx).
* **Backend:**
  - Membereskan hardcoded DB connection string (mengubahnya agar dinamis berdasarkan Network Docker).
* **QA:**
  - Melakukan *stress test* mematikan container DB dan menyalakan kembali untuk melihat status data sewaan apakah masih aman.

---

### 📝 Modul 7: Docker Compose — Orkestrasi Multi-Container
Fokus: Menyatukan React Container, FastAPI Container, dan Postgres Container ke 1 kali click deployment.
* **DevOps:**
  - Membuat skrip `docker-compose.yml` utama.
  - Merapikan struktur environment compose file `.env`.
* **Frontend:**
  - Menyesuaikan *Base URL API* React agar bergantung dinamis melalui build-time vars atau runtime vars di Compose.
* **Backend:**
  - Memastikan *startup dependencies* (misal Backend tunggu DB nyala dulu pakai depend-on conditions).
* **QA:**
  - Testing keseluruhan aplikasi hanya dengan command `docker-compose up -d`. Sistem app `sewain` harus siap digunakan seutuhnya.

---

### 📝 Modul 8 & 9: Git Workflow & Branching Strategy
Fokus: Bekerja pada level Enterprise, menggunakan branch dev, fitur-branch dan PR logic.
* **DevOps:**
  - Membersihkan repositori.
  - Mengatur Workflow/Strategy ke anggota tim (contoh format penamaan branch `feature/nama-fitur-sewa` atau `bugfix/crashed-login`).
* **Frontend & Backend (All Devs):**
  - Membuat satu fitur tambahan sederhana (misal halaman History Pinjaman untuk FE dan Endpoint History untuk BE) secara terpisah di dalam *Feature branch*, untuk dilakukan *Pull Request*.
* **QA:**
  - Bertugas menjadi *Reviewer*. Wajib meninjau *Pull Requests* dari para Devs lalu Appove/Merge PR ke `main`.

---

### 📝 Modul 10: Continuous Integration (CI) — Github Actions
Fokus: Testing otomatis setiap ada perubahaan / penambahan fitur (*Automated Testing & Build*).
* **DevOps:**
  - Setup Workflow YAML Github Actions. Menghidupkan *Action runners* pada Github.
* **Backend:**
  - Menulis *Unit Test* pada endpoint (misal menggunakan Pytest untuk tes endpoint *booking* barang).
* **Frontend:**
  - Memastikan *linter/ESLint* lolos dan build command dapat dilakukan pada Github Actions runner.
* **QA:**
  - Mengawasi indikator CI (*Red/Green builds*). Memberitahu developer apabila ada push code yang merusak tes aplikasi.

---

### 📝 Modul 11: Continuous Deployment (CD) — Automated Deploy ke Cloud
Fokus: Server/VPS dapat terkoneksi dan update otomatis bila ada perilisan baru.
* **DevOps:**
  - Meng-hook Github Actions workflow untuk otomatis menjalankan script rilis (mengirim Docker image ke Dockerhub, lalu SSH VPS di cloud untuk melakukan *pull* dan run).
* **Frontend & Backend:**
  - Membuat rilis aplikasi "Sewain versi 1.0", memastikan segala variabel production server berbeda dengan local environment.
* **QA:**
  - Final Production test — Uji coba web app *Sewain* via *Public IP* VPS, cek kapabilitas peminjaman dan rendering server.

---

### 📝 Modul 12: Microservices — Konsep & Dekomposisi
Fokus: Membongkar model *Monolith* API menjadi Microservices.
* **Backend (Sistem Arsitek):**
  - Mengidentifikasi Service/Dekomposisi (misal memecah API menjadi `Auth Service` *port 8001*, `Item Catalog Service` *port 8002*, dan `Transaction Service` *port 8003*).
* **Frontend:**
  - Menyesuaikan koneksi (*proxy/router*) ke banyak Service URL (atau menunggu adanya API Gateway).
* **DevOps:**
  - Memetakan skema infrastruktur Microservices dan port mappings yang akan diaplikasikan di Docker Compose versi 2.
* **QA:**
  - Membuat rancangan Contract Test dan API Docs versi terpisah sesuai Service masing-masing.

---

### 📝 Modul 13: Microservices — Implementasi & Reliability
Fokus: Eksekusi dekomposisi API dan menambahkan API Gateway.
* **Backend:**
  - Melakukan coding implementasi 3 service terpisah dan merangkai API Gateway (menggunakan Nginx/Kong/atau script Gateway khusus FastAPI). Service inter-komunikasi dikoordinasikan.
* **DevOps:**
  - Mengupdate `docker-compose.yml` agar memiliki banyak Service Backend + 1 Gateway + Database tersendiri (*Database per service approach* apabila dimungkinkan/diminta modul).
* **Frontend:**
  - Frontend kini diarahkan satu pintu melalui API Gateway dan tak lagi tahu secara eksplisit microservices di belakangnya.
* **QA:**
  - Pengujian keandalan: matikan 1 service (misalnya matikan `Transaction`). Test apakah web Sewain masih bisa menampillkan Katalog (berarti *graceful degradation* aktif).

---

### 📝 Modul 14: Monitoring, Logging & Observability
Fokus: Aplikasi kini bisa mengeluarkan log sistem dan parameter *metrics* kesehatan server.
* **DevOps:**
  - Implementasi *Monitoring Stack* (Prometheus + Grafana atau tool serupa di modul praktikum) di docker compose env.
* **Backend:**
  - Standardisasi Format Log: Memastikan service FastAPI mengeluarkan log JSON di console ketika terjadi error atau transkasi validase (Booking success, etc). Menambahkan metric endpoint stat (`/metrics`).
* **Frontend:**
  - Implementasi *Error Handling* di React jika mendapat server timeout (menampilkan banner error pada halaman Sewain App ketimbang layar putih/crash).
* **QA:**
  - Melakukan simulasi spam login/spam transaksi, lalu merekam buktinya pada grafik *Grafana* dashboard.

---

### 📝 Modul 15: Final Polish — Security, Cleanup & Dokumentasi
Fokus: Penyelesaian rapih app "Sewain" sebelum submit final / Ujian Akhir, memfokuskan *Security Posturing* dan persiapan rilis final.
* **DevOps:**
  - **Security Scan:** Merapikan dan membersihkan *env variable* bocor, memastikan tidak ada hardcoded password dalam repo atau history git.
  - **Rate Limiting:** Mengimplementasikan anti-spam limiter pada gateway API.
* **Backend & Frontend:**
  - Melakukan pembersihan *TODO* comments.
  - Mematikan / menghapus *console.log()* atau statement debug `print` di area production.
  - Validasi *formatter*.
* **QA (Tim Seluruhnya):**
  - Membuat *Final Release Notes*.
  - Menyatukan file presentasi, *Slide Demo*.
  - Melakukan rekaman *Screen Recording* Backup penggunaan App `Sewain` mulai dari Register user -> Login -> Lihat katalog benda -> Sewa benda.

---

## Open Questions
Apakah rincian dan alur pembagian di atas sudah sesuai seperti yang Kakak harapkan? Jika ya, silahkan *Approve*. Jika ada *role* spesifik yang ingin diubah atau ditambah, beri tahu saya agar bisa saya revisi!
