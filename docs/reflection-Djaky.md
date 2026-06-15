# Reflection Paper Analitis — Lead Backend
**Mata Kuliah:** Komputasi Awan (Cloud Computing)  
**Nama:** Djaky Abbyyu Fauzan Timumum  
**NIM:** 10231032  
**Peran:** Lead Backend  
**Proyek:** Sewain — Platform Sewa Barang Online  

---

## 1. Pendahuluan dan Tanggung Jawab
Dalam pengembangan platform **Sewain**, peran Backend bertanggung jawab atas seluruh logika bisnis, pengelolaan data, keamanan autentikasi, serta integrasi layanan eksternal yang menjadi fondasi aplikasi. Sebagai Lead Backend, tanggung jawab utama saya meliputi:
*   Merancang dan mengimplementasikan **arsitektur REST API** menggunakan framework FastAPI (Python), mencakup desain endpoint, validasi input/output dengan Pydantic schema, serta penanganan error yang konsisten.
*   Membangun sistem **autentikasi dan otorisasi berbasis JWT** dengan mekanisme Role-Based Access Control (RBAC) berlapis untuk tiga peran pengguna: Super Admin, Admin (Penyedia Barang), dan User (Penyewa).
*   Mendesain **skema database relasional** dengan 13 tabel terkoneksi menggunakan SQLAlchemy ORM, mencakup entitas utama (users, items, rentals, payments) hingga fitur pendukung (wallet, withdrawal, promo codes, chat, reviews).
*   Mengintegrasikan layanan eksternal seperti **Midtrans Payment Gateway** untuk pembayaran otomatis dan **Resend/SMTP** untuk pengiriman email transaksional (verifikasi akun & reset password).

Secara analitis, fokus saya bukan hanya membuat API yang berfungsi, melainkan memastikan setiap endpoint memiliki validasi bisnis yang ketat, penanganan edge case yang komprehensif, serta struktur kode yang modular dan mudah dipelihara oleh anggota tim lainnya.

---

## 2. Analisis Keputusan Teknis dan Arsitektur

### A. Arsitektur Dual: Monolith + Microservices
Keputusan arsitektural yang unik dalam proyek ini adalah penerapan **dua mode arsitektur secara bersamaan**: sebuah backend monolitik (`backend/`) yang menjadi sumber kebenaran utama (*single source of truth*) untuk lingkungan produksi, serta dekomposisi ke dalam microservices (`services/auth-service`, `services/item-service`, dst.) sebagai eksperimen pembelajaran arsitektur awan terdistribusi.

Backend monolitik terdiri dari file utama `main.py` (2.776 baris) yang mengorkestrasi seluruh endpoint, `crud.py` (2.323 baris) yang menampung logika CRUD dan validasi bisnis, serta `models.py` (624 baris) yang mendefinisikan 13 tabel database. Pendekatan ini dipilih karena:
1.  **Konsistensi Data:** Semua transaksi (rental → payment → wallet) terjadi dalam satu database, sehingga integritas referensial terjamin oleh foreign key constraint tanpa perlu mekanisme saga pattern.
2.  **Kecepatan Iterasi:** Dengan satu codebase, perubahan schema atau logika bisnis dapat langsung diterapkan tanpa koordinasi antar-service.

### B. Sistem Autentikasi dan Otorisasi Berlapis
Sistem autentikasi dibangun dengan pendekatan *defense in depth* menggunakan JWT token dan dependency injection FastAPI:

```python
# auth.py — 5 level akses sebagai dependency
def get_current_user(...)      # Semua user yang sudah login
def require_user(...)          # Alias get_current_user
def require_verified_user(...) # User + sudah verifikasi KTP
def require_admin(...)         # Admin + Super Admin
def require_super_admin(...)   # Super Admin saja
```

Keputusan desain kritis terkait autentikasi:
*   **Verifikasi Email Dua Tahap:** Setelah registrasi, user tidak bisa login sampai klik link verifikasi di email (token JWT berlaku 24 jam). Ini mencegah pembuatan akun massal dengan email palsu.
*   **Verifikasi Identitas (KTP) untuk Penyewa:** Sebelum bisa mengajukan sewa, user harus melengkapi profil (alamat, nomor telepon, foto KTP, foto selfie dengan KTP). Sistem menerapkan **auto-verify** — jika keempat field terisi, status verifikasi otomatis berubah menjadi `disetujui` tanpa perlu manual approval.
*   **Invalidasi Token Reset Password:** Setiap token reset password membawa timestamp `iat` (issued at). Setelah password diubah, field `password_changed_at` diperbarui. Jika ada token lama yang coba digunakan kembali, server menolak karena `iat < password_changed_at`.

### C. Integrasi Midtrans Payment Gateway
Integrasi pembayaran menggunakan Midtrans mendukung dua mode: **Snap API** (popup pembayaran) dan **Core API** (charge langsung) untuk metode QRIS, Bank Transfer (BCA/BNI/BRI/Mandiri), GoPay, dan ShopeePay.

```python
# midtrans_service.py — Order ID format unik per percobaan
def build_order_id(rental_id: int) -> str:
    return f"SEWAIN-{rental_id}-{int(time.time() * 1000)}"
```

Keputusan menambahkan epoch millisecond ke `order_id` dilatarbelakangi oleh aturan Midtrans yang tidak mengizinkan penggunaan ulang `order_id`. Tanpa ini, jika pembayaran pertama gagal/expired, user tidak bisa melakukan percobaan bayar ulang karena `order_id` sudah terpakai.

Keamanan webhook divalidasi menggunakan **SHA-512 signature verification**:
```python
def verify_signature(order_id, status_code, gross_amount, signature_key) -> bool:
    raw = f"{order_id}{status_code}{gross_amount}{server_key}"
    expected = hashlib.sha512(raw.encode("utf-8")).hexdigest()
    return expected == signature_key
```

### D. Migrasi Database Idempoten pada Startup
Salah satu tantangan pada proyek dengan iterasi cepat adalah evolusi skema database. Alih-alih menggunakan tool migrasi formal seperti Alembic, saya menerapkan **migrasi idempoten saat startup** yang aman dipanggil berulang kali:

```python
def _ensure_schema_migrations() -> None:
    # Cek kolom yang sudah ada, hanya tambah yang belum ada
    existing = {c["name"] for c in insp.get_columns(table)}
    if col_name not in existing:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN ..."))
```

Pendekatan ini mencakup migrasi untuk kolom pickup location pada rentals, field integrasi Midtrans pada payments, kolom koordinat lokasi pada admins, serta tabel promo codes beserta seed data awal. Keuntungannya: deployment tidak pernah gagal karena schema mismatch, dan developer baru bisa langsung menjalankan aplikasi tanpa menjalankan skrip migrasi terpisah.

---

## 3. Tantangan Teknis, Analisis Masalah, dan Solusi

### Masalah 1: State Machine Rental yang Kompleks
**Gejala:** Status rental memiliki 5 state (`pending → disetujui → sedang_disewa → selesai` atau `ditolak`) dengan banyak side effect: stok barang harus berubah, payment record harus dibuat, wallet harus terisi, dan pickup info harus di-snapshot saat disetujui.

**Analisis:** Tanpa validasi transisi yang ketat, admin bisa secara tidak sengaja mengubah rental yang sudah `selesai` kembali ke `pending`, atau menandai rental `ditolak` menjadi `sedang_disewa`, yang menyebabkan inkonsistensi data stok dan pembayaran.

**Solusi:** Saya mengimplementasikan **explicit state machine** dengan tabel transisi valid:
```python
VALID_RENTAL_TRANSITIONS = {
    RentalStatus.pending:       [disetujui, ditolak],
    RentalStatus.disetujui:     [sedang_disewa, ditolak],
    RentalStatus.sedang_disewa: [selesai],
    RentalStatus.selesai:       [],  # final state
    RentalStatus.ditolak:       [],  # final state
}
```
Setiap perubahan status divalidasi terhadap tabel ini, dan side effect (update stok, buat payment, isi wallet, snapshot pickup) dieksekusi secara atomik dalam satu transaksi database.

### Masalah 2: Kalkulasi Stok Otomatis vs Manual Admin
**Gejala:** Terdapat konflik antara stok yang otomatis berkurang saat rental disetujui dan kemampuan admin untuk mengatur stok secara manual (misal karena barang rusak).

**Analisis:** Jika admin secara manual set stok ke 0 (karena maintenance), tetapi sistem otomatis menimpa status item berdasarkan kalkulasi stok, maka barang bisa muncul kembali sebagai `available` setelah rental selesai.

**Solusi:** Saya merancang **dual-mode status calculation** pada `_recalculate_item_status()` yang membedakan antara perubahan stok otomatis (oleh sistem) dan manual (oleh admin). Jika admin secara eksplisit mengirim field `status` pada request update, nilai tersebut diterapkan terakhir dan menimpa hasil kalkulasi otomatis. Jika tidak, sistem menghitung status berdasarkan stok dan keberadaan rental aktif:
```python
def _recalculate_item_status(db, item):
    if item.stok > 0:
        item.status = ItemStatus.available
    else:
        active_rental = db.query(Rental).filter(
            Rental.item_id == item.id,
            Rental.status.in_([pending, disetujui, sedang_disewa])
        ).first()
        item.status = ItemStatus.rented if active_rental else ItemStatus.unavailable
```

### Masalah 3: Email Verifikasi Tidak Terkirim di Environment Docker
**Gejala:** Saat deployment menggunakan Docker Compose, email verifikasi tidak pernah sampai ke inbox pengguna, namun proses registrasi tetap berhasil tanpa error.

**Analisis:** Pengiriman email dieksekusi sebagai *background task* (`BackgroundTasks`) yang gagal secara diam-diam (*silent failure*). Variabel lingkungan `RESEND_API_KEY` tidak diatur di konfigurasi Docker Compose `auth-service`, sehingga default ke string kosong. Fungsi `_send_via_resend()` langsung melewatkan pengiriman dengan log warning yang hanya terlihat di container logs.

**Solusi:** Memastikan semua environment variable kritis untuk email service (`RESEND_API_KEY`, `MAIL_FROM`, `EMAIL_PROVIDER`) didaftarkan di konfigurasi Docker Compose dan didokumentasikan di `.env.example`. Selain itu, endpoint `POST /auth/resend-verification` disediakan sebagai fallback agar user bisa meminta kirim ulang jika email pertama gagal.

---

## 4. Refleksi Pembelajaran dan Kolaborasi

Proyek **Sewain** memberikan pemahaman praktis yang mendalam mengenai prinsip-prinsip rekayasa perangkat lunak backend yang sebelumnya hanya saya pelajari secara teoritis:
*   **API Design & RESTful Conventions:** Saya belajar merancang API yang konsisten dari segi penamaan endpoint, penggunaan HTTP method yang tepat, serta penerapan response code yang semantik. Dengan 60+ endpoint yang terorganisir dalam tag group (Auth, Super Admin, Admin, User, Items, Rentals, Payments, Chat), dokumentasi Swagger/OpenAPI menjadi sangat penting sebagai kontrak antara backend dan frontend.
*   **Database Design & ORM:** Merancang 13 tabel relasional dengan constraint yang tepat (foreign key, unique, check constraint) mengajarkan pentingnya data integrity sejak level database, bukan hanya di level aplikasi. Penggunaan SQLAlchemy ORM dengan `joinedload` untuk eager loading mencegah masalah N+1 query yang sering muncul di aplikasi dengan relasi data yang dalam.
*   **Security Mindset:** Mengimplementasikan bcrypt hashing, JWT token expiry, signature verification webhook, rate limiting, dan CORS configuration secara langsung mengajarkan bahwa keamanan bukan fitur tambahan, melainkan fondasi yang harus dibangun sejak awal.

**Kolaborasi Tim:**  
Sebagai Lead Backend, saya belajar bahwa API yang baik harus didokumentasikan dengan jelas dan dikomunikasikan secara proaktif. Koordinasi dengan Lead Frontend (Zaki) mengenai format response, pagination pattern, dan error handling contract sangat krusial agar integrasi berjalan lancar. Dengan Lead DevOps (Alif), diskusi mengenai environment variable, health check endpoint, dan database migration strategy memastikan bahwa kode yang saya tulis dapat di-deploy tanpa kendala. Bersama Lead QA & Docs (Riqqah), kami menyepakati format testing dan dokumentasi API agar setiap endpoint memiliki coverage pengujian yang memadai.

---

## 5. Kesimpulan
Melalui perancangan arsitektur backend yang modular, sistem autentikasi berlapis, integrasi payment gateway, dan pengelolaan state machine transaksi yang ketat, platform **Sewain** memiliki fondasi backend yang robust dan siap untuk diskalakan. Pengalaman ini membuktikan bahwa backend yang baik bukan sekadar menyediakan CRUD sederhana, melainkan harus mampu menjaga integritas data, menangani edge case bisnis, dan menyediakan API yang aman serta terdokumentasi dengan baik agar seluruh tim dapat berkolaborasi secara efektif.
