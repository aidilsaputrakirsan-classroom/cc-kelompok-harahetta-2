# 📖 Dokumentasi API — Sewain Platform

> **Base URL (Development):** `http://localhost:8000`  
> **Base URL (Docker):** `http://localhost:8000`  
> **Swagger UI:** `http://localhost:8000/docs`  
> **ReDoc:** `http://localhost:8000/redoc`  
> **Versi API:** 1.0.0

---

## 🔐 Autentikasi

Sewain menggunakan **JWT Bearer Token**. Untuk mengakses endpoint yang protected:

1. `POST /auth/login` → dapatkan `access_token`
2. Sertakan di header: `Authorization: Bearer <token>`
3. Token valid selama **60 menit**

---

## 📋 Daftar Endpoint

### 🏠 Info (Public)

#### `GET /` — Info Aplikasi
```bash
curl http://localhost:8000/
```
**Response 200:**
```json
{
  "app": "Sewain",
  "tagline": "Platform Sewa Barang Online",
  "version": "1.0.0",
  "docs": "/docs",
  "team": "Kelompok Harahetta-2 — SI ITK",
  "status": "running"
}
```

---

#### `GET /health` — Health Check
```bash
curl http://localhost:8000/health
```
**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "app": "Sewain"
}
```

---

#### `GET /team` — Info Tim
```bash
curl http://localhost:8000/team
```
**Response 200:**
```json
{
  "team": "Kelompok Harahetta-2",
  "members": [
    {"nama": "Djaky Abbyyu Fauzan Timumum", "nim": "10231032", "peran": "Lead Backend"},
    {"nama": "Achmad Zaki Zaidan", "nim": "10231002", "peran": "Lead Frontend"},
    {"nama": "Muhammad Alif Setiawan", "nim": "10231056", "peran": "Lead DevOps"},
    {"nama": "Riqqah Khalda Karina", "nim": "10231082", "peran": "Lead QA & Docs"}
  ]
}
```

---

### 🔐 Auth (Public)

#### `POST /auth/register` — Daftar Akun Baru
- **Auth Required:** ❌ Tidak
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@itk.ac.id",
    "nama": "Budi Santoso",
    "password": "password123",
    "role": "user"
  }'
```
**Request Body:**
| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| `email` | string | ✅ | Format email valid |
| `nama` | string | ✅ | Nama lengkap |
| `password` | string | ✅ | Minimal 8 karakter |
| `role` | string | ❌ | `user` (default) / `admin` / `super_admin` |

**Response 201:**
```json
{
  "id": 1,
  "email": "user@itk.ac.id",
  "nama": "Budi Santoso",
  "role": "user",
  "is_active": true,
  "is_verified": false,
  "created_at": "2026-04-05T09:00:00"
}
```
**Error 400:** Email sudah terdaftar

---

#### `POST /auth/login` — Login & Dapatkan Token
- **Auth Required:** ❌ Tidak
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@itk.ac.id&password=password123"
```
> ⚠️ Gunakan `application/x-www-form-urlencoded` bukan JSON.  
> Field `username` diisi dengan **email**.

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": { "id": 1, "email": "user@itk.ac.id", "role": "user" }
}
```
**Error 401:** Email atau password salah  
**Error 403:** Akun dinonaktifkan

---

#### `GET /auth/me` — Info User yang Login
- **Auth Required:** ✅ Bearer Token
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <token>"
```
**Response 200:** Data profil user yang sedang login

---

### 👑 Super Admin

> Semua endpoint di bawah memerlukan role `super_admin`.

#### `GET /superadmin/users` — Daftar Semua User
```bash
curl "http://localhost:8000/superadmin/users?skip=0&limit=20&role=user" \
  -H "Authorization: Bearer <superadmin_token>"
```
**Query Params:** `skip`, `limit`, `role` (super_admin | admin | user)

---

#### `PUT /superadmin/users/{user_id}` — Update User
```bash
curl -X PUT http://localhost:8000/superadmin/users/5 \
  -H "Authorization: Bearer <superadmin_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

---

#### `DELETE /superadmin/users/{user_id}` — Hapus User
```bash
curl -X DELETE http://localhost:8000/superadmin/users/5 \
  -H "Authorization: Bearer <superadmin_token>"
```
**Response 204:** No Content

---

#### `GET /superadmin/stats` — Statistik Platform
```bash
curl http://localhost:8000/superadmin/stats \
  -H "Authorization: Bearer <superadmin_token>"
```

---

#### `PUT /superadmin/users/{user_id}/verify` — Verifikasi Identitas User
```bash
curl -X PUT http://localhost:8000/superadmin/users/3/verify \
  -H "Authorization: Bearer <superadmin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "disetujui", "catatan": "Identitas valid"}'
```
**Field `status`:** `disetujui` / `ditolak` / `menunggu`

---

### 📂 Kategori (Public GET, Super Admin POST/PUT/DELETE)

#### `GET /categories` — Daftar Semua Kategori
- **Auth Required:** ❌ Tidak
```bash
curl http://localhost:8000/categories
```
**Response 200:**
```json
[
  {"id": 1, "nama": "Elektronik", "deskripsi": "Gadget dan perangkat elektronik"},
  {"id": 2, "nama": "Outdoor", "deskripsi": "Perlengkapan outdoor dan camping"}
]
```

---

#### `POST /categories` — Tambah Kategori
- **Auth Required:** ✅ Super Admin
```bash
curl -X POST http://localhost:8000/categories \
  -H "Authorization: Bearer <superadmin_token>" \
  -H "Content-Type: application/json" \
  -d '{"nama": "Kendaraan", "deskripsi": "Motor, sepeda, dan kendaraan lainnya"}'
```

---

### 🏪 Admin — Profil Usaha

#### `POST /admin/profile` — Buat Profil Usaha
- **Auth Required:** ✅ Admin
```bash
curl -X POST http://localhost:8000/admin/profile \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_usaha": "Toko Sewa Bahagia",
    "alamat_usaha": "Jl. Soekarno-Hatta No.15, Balikpapan",
    "nomor_telepon": "081234567890"
  }'
```

---

#### `GET /admin/profile` — Lihat Profil Usaha
```bash
curl http://localhost:8000/admin/profile \
  -H "Authorization: Bearer <admin_token>"
```

---

### 📦 Items — Barang Sewa

#### `GET /items` — Katalog Barang
- **Auth Required:** ✅ Login (semua role)
```bash
curl "http://localhost:8000/items?search=tenda&category_id=2&status=available&skip=0&limit=10" \
  -H "Authorization: Bearer <token>"
```
**Query Params:**
| Param | Type | Keterangan |
|-------|------|------------|
| `search` | string | Cari nama atau deskripsi |
| `category_id` | int | Filter by ID kategori |
| `status` | string | `available` / `rented` / `unavailable` |
| `skip` | int | Offset pagination (default: 0) |
| `limit` | int | Jumlah data per halaman (default: 20, max: 100) |

**Response 200:**
```json
{
  "total": 25,
  "items": [
    {
      "id": 1,
      "nama": "Tenda Dome 4 Orang",
      "deskripsi": "Tenda outdoor waterproof",
      "harga_per_hari": 75000,
      "stok": 3,
      "status": "available",
      "foto_url": "https://example.com/tenda.jpg",
      "category_id": 2
    }
  ]
}
```

---

#### `GET /items/{item_id}` — Detail Barang
```bash
curl http://localhost:8000/items/1 \
  -H "Authorization: Bearer <token>"
```

---

#### `POST /items` — Tambah Barang
- **Auth Required:** ✅ Admin
```bash
curl -X POST http://localhost:8000/items \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Kamera DSLR Canon 700D",
    "deskripsi": "Kamera DSLR profesional, cocok untuk fotografi",
    "harga_per_hari": 150000,
    "stok": 2,
    "category_id": 1,
    "foto_url": "https://example.com/kamera.jpg"
  }'
```

---

#### `PUT /items/{item_id}` — Update Barang
- **Auth Required:** ✅ Admin (pemilik barang)
```bash
curl -X PUT http://localhost:8000/items/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"harga_per_hari": 160000, "stok": 1}'
```

---

#### `DELETE /items/{item_id}` — Hapus Barang
```bash
curl -X DELETE http://localhost:8000/items/1 \
  -H "Authorization: Bearer <admin_token>"
```
**Response 204:** No Content

---

### 📋 Rentals — Transaksi Penyewaan

#### `POST /rentals` — Ajukan Permintaan Sewa
- **Auth Required:** ✅ User yang sudah terverifikasi identitasnya
```bash
curl -X POST http://localhost:8000/rentals \
  -H "Authorization: Bearer <verified_user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "tanggal_mulai": "2026-04-10",
    "tanggal_selesai": "2026-04-13",
    "catatan": "Tolong dikirim ke alamat saya"
  }'
```
**Response 201:**
```json
{
  "id": 1,
  "item_id": 1,
  "user_id": 3,
  "tanggal_mulai": "2026-04-10",
  "tanggal_selesai": "2026-04-13",
  "total_harga": 225000,
  "status": "pending",
  "catatan": "Tolong dikirim ke alamat saya",
  "created_at": "2026-04-05T09:00:00"
}
```

---

#### `GET /rentals/my` — Riwayat Sewa Saya
```bash
curl "http://localhost:8000/rentals/my?status=pending" \
  -H "Authorization: Bearer <user_token>"
```

---

#### `PUT /admin/rentals/{rental_id}/status` — Update Status Sewa
- **Auth Required:** ✅ Admin
```bash
curl -X PUT http://localhost:8000/admin/rentals/1/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "disetujui", "catatan": "Silakan ambil besok pagi"}'
```
**Status flow:** `pending` → `disetujui` → `sedang_disewa` → `selesai`  
**Atau:** `pending` → `ditolak`

---

## 📊 HTTP Status Codes

| Code | Keterangan |
|------|------------|
| 200 | OK — Request berhasil |
| 201 | Created — Data baru berhasil dibuat |
| 204 | No Content — Berhasil (hapus/update tanpa response body) |
| 400 | Bad Request — Data tidak valid atau sudah ada |
| 401 | Unauthorized — Token tidak ada atau tidak valid |
| 403 | Forbidden — Role tidak cukup |
| 404 | Not Found — Data tidak ditemukan |
| 422 | Unprocessable Entity — Validasi input gagal |

---

## 🔑 Role & Akses

| Endpoint | user | admin | super_admin |
|----------|------|-------|-------------|
| `GET /items` | ✅ | ✅ | ✅ |
| `POST /items` | ❌ | ✅ | ✅ |
| `POST /rentals` | ✅ (verified) | ❌ | ❌ |
| `PUT /admin/rentals/*/status` | ❌ | ✅ | ✅ |
| `POST /categories` | ❌ | ❌ | ✅ |
| `GET /superadmin/users` | ❌ | ❌ | ✅ |

---

*Dibuat oleh Lead QA & Docs + Lead DevOps — Kelompok Harahetta-2*  
*Komputasi Awan SI ITK — April 2026*
