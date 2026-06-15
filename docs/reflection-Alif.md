# Reflection Paper Analitis — Lead DevOps
**Mata Kuliah:** Komputasi Awan (Cloud Computing)  
**Nama:** Muhammad Alif Setiawan  
**NIM:** 10231056  
**Peran:** Lead DevOps  
**Proyek:** Sewain — Platform Sewa Barang Online  

---

## 1. Pendahuluan dan Tanggung Jawab
Dalam pengembangan platform **Sewain**, peran DevOps (Development and Operations) bertindak sebagai jembatan kritis yang memastikan siklus hidup pengembangan perangkat lunak (SDLC) berjalan dengan cepat, aman, dan dapat diandalkan dari repositori lokal hingga lingkungan produksi. Sebagai Lead DevOps, tanggung jawab utama saya meliputi:
*   Merancang dan memelihara infrastruktur kontainerisasi menggunakan Docker dan Docker Compose, baik untuk arsitektur monolitik produksi maupun dekomposisi layanan microservices untuk eksperimen pembelajaran.
*   Mengembangkan pipeline Continuous Integration (CI) dan Continuous Deployment (CD) terotomatisasi menggunakan GitHub Actions untuk menjamin kualitas kode melalui pengujian otomatis dan menerapkan pembaruan ke server tanpa intervensi manual.
*   Mengelola alokasi sumber daya kontainer, variabel lingkungan (environment variables), rahasia (secrets management), dan konfigurasi jaringan guna menjamin reliabilitas dan keamanan sistem.

Secara analitis, fokus saya bukan sekadar membuat aplikasi "bisa diakses di internet", melainkan bagaimana proses rilis dapat didekati secara metodologis, meminimalkan risiko kegagalan rilis (deployment failures), mengoptimalkan biaya/utilisasi sumber daya VPS, dan mempertahankan efisiensi waktu eksekusi pipeline.

---

## 2. Analisis Keputusan Teknis dan Infrastruktur

### A. Kontainerisasi (Docker & Docker Compose)
Dalam merancang infrastruktur **Sewain**, kontainerisasi dipilih untuk menyelesaikan masalah klasik *"it works on my machine"*. Dengan Docker, kami dapat mengemas kode aplikasi beserta pustaka dependensinya ke dalam unit mandiri yang terisolasi. 

Pada file [docker-compose.yml](file:///c:/tugaskuliah/cc-kelompok-harahetta-2/docker-compose.yml), saya menetapkan kebijakan manajemen sumber daya yang ketat (`deploy.resources.limits` dan `reservations`). Sebagai contoh, pada layanan database monolitik (`monolith-db`):
```yaml
deploy:
  resources:
    limits:
      cpus: "0.50"
      memory: 256M
    reservations:
      cpus: "0.10"
      memory: 128M
```
Keputusan ini sangat penting karena VPS target memiliki keterbatasan RAM dan CPU. Tanpa batasan ini, kebocoran memori (memory leak) atau kueri database yang tidak efisien dapat mengonsumsi seluruh memori host, memicu mekanisme *Out-Of-Memory (OOM) Killer* sistem operasi, dan menyebabkan seluruh layanan mati secara tidak terduga.

### B. Otomatisasi CI/CD (GitHub Actions)
Saya mengimplementasikan dua workflow utama:
1.  **CI Pipeline ([ci.yml](file:///c:/tugaskuliah/cc-kelompok-harahetta-2/.github/workflows/ci.yml)):** Berjalan pada setiap *push* dan *pull request* ke branch `main`. CI ini mencakup pengujian backend (menggunakan `pytest` dengan batas minimal cakupan pengujian/coverage 50%) dan pengujian frontend (menggunakan `vitest`). Hanya jika semua pengujian lulus dan proses build Docker berhasil, kode baru diperbolehkan untuk digabungkan ke cabang utama.
2.  **CD Pipeline ([cd.yml](file:///c:/tugaskuliah/cc-kelompok-harahetta-2/.github/workflows/cd.yml)):** Menerapkan konsep *Continuous Deployment* ke platform DeployCC. Untuk menghemat runtime runner GitHub Actions (yang memiliki kuota terbatas) dan mengurangi overhead beban build di server, saya menerapkan **Smart Deploy** menggunakan pustaka `dorny/paths-filter`. Pipeline CD mendeteksi direktori mana saja yang mengalami modifikasi:
    *   Jika perubahan hanya terjadi pada dokumentasi (`docs/**` atau `README.md`), proses build frontend dan instalasi backend dilewati (*skipped*).
    *   Jika berkas dependensi seperti `backend/requirements.txt` berubah, barulah perintah instalasi pustaka python dijalankan.
    *   Jika ada perubahan di frontend, proses build asset statis React dilakukan di runner GitHub Actions, lalu dikirim ke server dalam bentuk berkas terkompresi (.zip). Ini menghemat utilisasi CPU server karena tidak perlu melakukan proses build yang berat di lingkungan produksi.

---

## 3. Tantangan Teknis, Analisis Masalah, dan Solusi

Selama fase pengembangan dari Minggu 9 hingga Minggu 15, tim menghadapi beberapa kendala infrastruktur kritis yang menuntut investigasi mendalam dan pemecahan masalah (troubleshooting) secara sistematis:

### Masalah 1: Downtime Layanan saat Deployment Baru
**Gejala:** Pada awal pengujian deploy, ketika kode backend baru didorong ke server produksi, terdapat jeda waktu sekitar 10-30 detik di mana API Gateway (Nginx) mengembalikan error 502 Bad Gateway kepada pengguna saat proses restart kontainer backend berlangsung.

**Analisis:** Gateway Nginx langsung meneruskan request ke port backend tanpa memeriksa apakah backend baru tersebut sudah benar-benar siap (sudah selesai memuat modul python, membaca konfigurasi, dan terhubung ke database). 

**Solusi:** Saya menambahkan mekanisme `healthcheck` yang ketat di konfigurasi Docker Compose dan mengonfigurasi parameter Nginx proxy agar menunggu status kontainer berubah menjadi `healthy` sebelum mengarahkan lalu lintas data pengguna. Di sisi backend, dibuat endpoint khusus `/health` yang menguji koneksi database aktif. Konfigurasi `depends_on` pada Nginx gateway disesuaikan agar bergantung pada kondisi kesehatan backend:
```yaml
gateway:
  depends_on:
    backend:
      condition: service_healthy
```
Hal ini memastikan transisi rilis berjalan dengan meminimalkan downtime (zero-downtime deployment), karena kontainer lama tidak akan dimatikan sampai kontainer baru siap menerima trafik.

### Masalah 2: Ketidakstabilan CD Pipeline Akibat Respon Error Server (HTTP 500, 502, dan 524 Cloudflare Timeout)
**Gejala:** Saat pipeline CD dijalankan otomatis setelah CI selesai, proses pengiriman paket deployment `.zip` ke endpoint DeployCC sering kali terputus di tengah jalan dengan kode status HTTP 500 (Internal Server Error), HTTP 502 (Bad Gateway), atau HTTP 524 (A Timeout Occurred dari Cloudflare). Hal ini mengakibatkan kegagalan rilis meskipun kode aplikasi tidak bermasalah.

**Analisis:** Kegagalan ini disebabkan oleh beberapa faktor pada sisi server target:
1.  **Overload Server:** Proses dekompresi *source code*, instalasi dependensi backend via `pip`, dan kompilasi modul frontend secara bersamaan di server produksi memakan sumber daya CPU dan RAM yang sangat besar, memicu kemacetan (bottleneck) sementara yang menghasilkan respons HTTP 500/502.
2.  **Cloudflare 100-Second Timeout (Error 524):** Karena server DeployCC berada di balik Cloudflare, Cloudflare akan memutuskan koneksi HTTP jika tidak menerima respons dari server dalam 100 detik. Proses rilis lengkap (terutama ketika melakukan build frontend) sering kali memakan waktu lebih dari 2 menit, memicu error 524.

**Solusi:** Saya merancang solusi taktis dua arah di sisi pipeline CD:
1.  **Optimasi Payload CD (Smart Deploy & Prebuilt FE):** Memindahkan proses kompilasi asset frontend (`npm run build`) dari sisi server produksi ke runner GitHub Actions. Dengan cara ini, runner GitHub Actions yang melakukan pekerjaan komputasi berat, lalu hasilnya dimasukkan ke folder `dist` dan dikirim sebagai berkas statis siap pakai. Ukuran beban kerja server produksi pun berkurang drastis sehingga mempercepat waktu eksekusi deployment dan menghindari limitasi timeout Cloudflare.
2.  **Robust Curl Request & Retry Logic:** Pada berkas workflow [cd.yml](file:///c:/tugaskuliah/cc-kelompok-harahetta-2/.github/workflows/cd.yml), saya menambahkan konfigurasi ketahanan jaringan pada *curl call* dengan mengaktifkan pengulangan otomatis jika terjadi kegagalan jaringan atau server error:
    ```yaml
    --retry 3 \
    --retry-delay 15 \
    --retry-all-errors \
    --retry-connrefused \
    --max-time 1200 \
    --connect-timeout 30
    ```
    Mekanisme ini memaksa runner CD untuk mencoba kembali mengirimkan request hingga 3 kali dengan jeda waktu 15 detik jika menerima respon error 500/502/524, sehingga rilis tetap berjalan sukses meskipun server mengalami ketidakstabilan sesaat.

---

## 4. Refleksi Pembelajaran dan Kolaborasi

Proyek **Sewain** memberikan pemahaman praktis yang mendalam mengenai prinsip-prinsip metodologi DevOps yang sebelumnya hanya saya pelajari secara teoritis:
*   **Git & Branching Strategy:** Saya belajar pentingnya menetapkan *Branch Protection Rules* dan memanfaatkan berkas `CODEOWNERS` untuk memastikan setiap kode yang masuk ke branch utama telah melalui proses review secara objektif oleh anggota tim lain. Ini mencegah terjadinya kerusakan fitur secara tidak sengaja.
*   **Observability:** Penerapan *structured logging* dalam format JSON dan penggunaan *Correlation ID* lintas layanan memberikan transparansi penuh saat debugging. Di lingkungan produksi, mencari log dengan format teks biasa sangat melelahkan. Dengan JSON logging, kita dapat memfilter aktivitas pengguna tertentu secara instan berdasarkan ID korelasi unik mereka.
*   **Security Best Practices:** Konfigurasi pembatasan laju permintaan (*rate limiting*) di sisi Nginx Gateway dan pemisahan kredensial sensitif menggunakan variabel lingkungan (.env) yang diabaikan oleh Git merupakan langkah wajib untuk mencegah kebocoran data dan serangan brute-force.

**Kolaborasi Tim:**  
Sebagai Lead DevOps, saya belajar bahwa keberhasilan rilis bukan hanya tentang menulis script otomasi yang canggih, melainkan juga komunikasi aktif dengan Lead Backend (Djaky) mengenai kesesuaian schema database, Lead Frontend (Zaki) terkait API URL injection di berkas `.env.production`, dan Lead QA & Docs (Riqqah) untuk memastikan skenario pengujian unit terintegrasi dengan pipeline CI. DevOps berfungsi sebagai katalis yang membuat seluruh tim dapat bekerja secara independen namun tetap terintegrasi secara harmonis.

---

## 5. Kesimpulan
Melalui perancangan infrastruktur kontainer terisolasi, orkestrasi jaringan yang aman, dan pipeline CI/CD yang cepat serta efisien, platform **Sewain** kini siap untuk dijalankan di lingkungan produksi secara stabil. Pengalaman ini membuktikan bahwa kualitas kode yang baik harus didukung oleh sistem rilis dan manajemen infrastruktur awan yang solid agar dapat memberikan nilai maksimal bagi pengguna akhir secara konsisten.
