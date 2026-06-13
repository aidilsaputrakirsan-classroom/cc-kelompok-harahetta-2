# 📝 API Contract — Sewain Platform (FastAPI Backend)

Dokumen ini mendefinisikan kontrak API yang digunakan pada backend produksi Sewain yang dikembangkan oleh Kelompok Harahetta-2.

## Lingkungan

| Lingkungan            | Protokol | URL Gateway / Host                                 | 
| --------------------- | -------- | -------------------------------------------------- | 
| Local Development     | HTTP     | `http://localhost:8000`                            |
| Production (DeployCC) | HTTPS    | `https://cc-kelompok-harahetta-2.akhzafachrozy.my.id/api/docs` | 

## 📌 Global Headers

| Header           | Keterangan                                                                | Sifat       |
| ---------------- | ------------------------------------------------------------------------- | ----------- |
| Content-Type     | `application/json` (atau `application/x-www-form-urlencoded` untuk login) | Wajib       |
| Authorization    | `Bearer <JWT_TOKEN>`                                                      | Kondisional |
| X-Correlation-ID | ID unik untuk melacak jalur request (tracing)                             | Opsional    |

## ⚠️ Error Response & Status Code

Format response error seragam untuk seluruh endpoint yang mengalami kegagalan:

```json
{
  "detail": "Deskripsi pesan kesalahan sistem."
}
```

| Status Code               | Keterangan                                               |
| ------------------------- | -------------------------------------------------------- |
| 200 OK                    | Request berhasil diproses                                |
| 201 Created               | Data berhasil dibuat                                     |
| 204 No Content            | Request sukses tanpa mengembalikan body response         |
| 400 Bad Request           | Data request atau parameter bisnis tidak valid           |
| 401 Unauthorized          | Token JWT tidak valid, kadaluarsa, atau belum login      |
| 403 Forbidden             | Tidak memiliki hak akses (Role/KYC belum terverifikasi)  |
| 404 Not Found             | Resource data tidak ditemukan di database                |
| 422 Unprocessable Entity  | Kegagalan validasi tipe data oleh skema Pydantic FastAPI |
| 500 Internal Server Error | Terjadi kegagalan sistem internal pada server backend    |

# 🔐 1. Modul Autentikasi (/auth)

## a. Register Akun

**Method:** `POST`

**Endpoint:** `/auth/register`

**Fungsi:** Membuat akun penyewa (user) baru.

### Request Body (UserCreate)

```json
{
  "email": "user@sewain.com",
  "password": "SecurePassword123!",
  "nama": "Budi Santoso"
}
```

### Response (201 Created)

```json
{
  "id": 12,
  "email": "user@sewain.com",
  "nama": "Budi Santoso",
  "role": "user",
  "is_active": true,
  "is_verified": false
}
```

## b. Login

**Method:** `POST`

**Endpoint:** `/auth/login`

**Fungsi:** Autentikasi menggunakan form data dan menghasilkan JWT token.

### Request Body (Form Data / URL-Encoded)

```text
username=user@sewain.com&password=SecurePassword123!
```

### Response (200 OK — TokenResponse)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "token_type": "bearer",
  "user": {
    "id": 12,
    "email": "user@sewain.com",
    "nama": "Budi Santoso",
    "role": "user"
  }
}
```

## c. Verifikasi Email

**Method:** `POST`

**Endpoint:** `/auth/verify-email`

**Fungsi:** Verifikasi email menggunakan token unik dari link verifikasi.

### Request Body (EmailVerifyRequest)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."
}
```

### Response (200 OK)

```json
{
  "message": "Email berhasil diverifikasi! Silakan login."
}
```

## d. Reset Password

**Method:** `POST`

**Endpoint:** `/auth/reset-password`

**Fungsi:** Mengganti password lama dengan password baru menggunakan token reset.

### Request Body (ResetPasswordRequest)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "new_password": "NewSecurePassword123!"
}
```

### Response (200 OK)

```json
{
  "message": "Password berhasil direset! Silakan login dengan password baru."
}
```

## e. Update Profil Ringan

**Method:** `PUT`

**Endpoint:** `/auth/me`

**Fungsi:** Memperbarui data nama atau foto profil (format Base64) milik sendiri.

### Request Body (UserMeUpdate)

```json
{
  "nama": "Budi Santoso Update",
  "foto_profil": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Response (200 OK — UserResponse)

```json
{
  "id": 12,
  "email": "user@sewain.com",
  "nama": "Budi Santoso Update",
  "role": "user",
  "foto_profil": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

# 👑 2. Modul Super Admin (/superadmin)

## a. Daftar Semua User

**Method:** `GET`

**Endpoint:** `/superadmin/users`

**Fungsi:** Menampilkan seluruh daftar user terdaftar di platform (mendukung filter query role).

### Response (200 OK — List[UserResponse])

```json
[
  {
    "id": 12,
    "email": "user@sewain.com",
    "nama": "Budi Santoso",
    "role": "user",
    "is_active": true
  }
]
```

## b. Verifikasi Dokumen KYC

**Method:** `PUT`

**Endpoint:** `/superadmin/users/{user_id}/verify`

**Fungsi:** Menyetujui atau menolak dokumen identitas KYC fisik milik user.

### Request Body (VerificationAction)

```json
{
  "status_verifikasi": "disetujui"
}
```

**Catatan:** Nilai parameter `status_verifikasi` yang valid adalah `"disetujui"` atau `"ditolak"`.

### Response (200 OK — UserProfileResponse)

```json
{
  "id": 24,
  "user_id": 12,
  "nama_orang_tua": "Siti Aminah",
  "alamat": "Jl. Sepinggan Baru No. 12, Balikpapan",
  "status_verifikasi": "disetujui"
}
```

## c. Tambah Admin Usaha Baru

**Method:** `POST`

**Endpoint:** `/superadmin/admins`

**Fungsi:** Membuat akun admin toko baru beserta profil usaha awalnya.

### Request Body (AdminCreateRequest)

```json
{
  "email": "adminbaru@sewain.com",
  "nama": "Ahmad Dani",
  "password": "AdminPassword123!",
  "nama_usaha": "Dani Outdoor Rental",
  "alamat_usaha": "Jl. MT Haryono No. 89, Balikpapan",
  "nomor_telepon": "08122334455"
}
```

### Response (201 Created — AdminProfileResponse)

```json
{
  "id": 6,
  "user_id": 25,
  "nama_usaha": "Dani Outdoor Rental",
  "alamat_usaha": "Jl. MT Haryono No. 89, Balikpapan",
  "nomor_telepon": "08122334455",
  "latitude": null,
  "longitude": null
}
```

# 👤 3. Modul Profil Fisik & KYC User (/profile)

## a. Lengkapi Dokumen KYC

**Method:** `PUT`

**Endpoint:** `/profile`

**Fungsi:** User melengkapi data fisik KTP dan foto selfie untuk diverifikasi Super Admin.

### Request Body (UserProfileUpdate)

```json
{
  "nama_orang_tua": "Siti Aminah",
  "alamat": "Jl. Sepinggan Baru No. 12, Balikpapan",
  "foto_ktp": "data:image/png;base64,iVBORw0KGgoAAA...",
  "foto_selfie_ktp": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```

### Response (200 OK — UserProfileResponse)

```json
{
  "id": 24,
  "user_id": 12,
  "nama_orang_tua": "Siti Aminah",
  "alamat": "Jl. Sepinggan Baru No. 12, Balikpapan",
  "status_verifikasi": "pending",
  "foto_ktp": "https://image-storage/ktp_12.jpg",
  "foto_selfie_ktp": "https://image-storage/selfie_12.jpg"
}
```
# 🏪 4. Modul Profil Usaha Admin (/admin/profile)

## a. Buat Profil Usaha

**Method:** `POST`

**Endpoint:** `/admin/profile`

**Fungsi:** Membuat profil fisik usaha admin beserta koordinat GPS lokasi toko fisik.

### Request Body (AdminProfileCreate)

```json
{
  "nama_usaha": "Harahetta Rental Outdoor",
  "alamat_usaha": "Jl. Soekarno Hatta KM 15, Balikpapan",
  "nomor_telepon": "08123456789",
  "latitude": -1.150431,
  "longitude": 116.861214
}
```

### Response (201 Created — AdminProfileResponse)

```json
{
  "id": 5,
  "user_id": 15,
  "nama_usaha": "Harahetta Rental Outdoor",
  "alamat_usaha": "Jl. Soekarno Hatta KM 15, Balikpapan",
  "nomor_telepon": "08123456789",
  "latitude": -1.150431,
  "longitude": 116.861214
}
```

## b. Update Profil Usaha

**Method:** `PUT`

**Endpoint:** `/admin/profile`

**Fungsi:** Mengubah data profil usaha dan koordinat peta GPS.

### Request Body (AdminProfileUpdate)

```json
{
  "nama_usaha": "Harahetta Rental Outdoor Super",
  "alamat_usaha": "Jl. Soekarno Hatta KM 15 Baru, Balikpapan",
  "nomor_telepon": "08123456789",
  "latitude": -1.150431,
  "longitude": 116.861214
}
```

### Response (200 OK — AdminProfileResponse)

```json
{
  "id": 5,
  "user_id": 15,
  "nama_usaha": "Harahetta Rental Outdoor Super",
  "alamat_usaha": "Jl. Soekarno Hatta KM 15 Baru, Balikpapan",
  "nomor_telepon": "08123456789",
  "latitude": -1.150431,
  "longitude": 116.861214
}
```

# 📦 5. Modul Katalog Barang (/items)

## a. Tambah Barang Baru

**Method:** `POST`

**Endpoint:** `/items`

**Fungsi:** Menambahkan barang sewa baru ke dalam katalog toko admin.

### Request Body (ItemCreate)

```json
{
  "nama": "Tenda Dome 4 Orang",
  "category_id": 3,
  "harga_per_hari": 50000.0,
  "stok": 5,
  "foto_url": "https://images-storage/tenda.jpg"
}
```

### Response (201 Created — ItemResponse)

```json
{
  "id": 8,
  "admin_id": 5,
  "category_id": 3,
  "nama": "Tenda Dome 4 Orang",
  "harga_per_hari": 50000.0,
  "stok": 5,
  "status": "available",
  "foto_url": "https://images-storage/tenda.jpg"
}
```

## b. Daftar Barang Katalog

**Method:** `GET`

**Endpoint:** `/items`

**Fungsi:** Mendapatkan seluruh daftar barang aktif (Mendukung filter pencarian, rentang harga, kategori, dan kota).

### Response (200 OK — ItemListResponse)

```json
{
  "total": 1,
  "items": [
    {
      "id": 8,
      "admin_id": 5,
      "category_id": 3,
      "nama": "Tenda Dome 4 Orang",
      "harga_per_hari": 50000.0,
      "stok": 5,
      "status": "available",
      "foto_url": "https://images-storage/tenda.jpg"
    }
  ]
}
```

# 📋 6. Modul Penyewaan (/rentals)

## a. Ajukan Permintaan Sewa

**Method:** `POST`

**Endpoint:** `/rentals`

**Fungsi:** User mengajukan sewa barang menggunakan kode promo opsional.

### Request Body (RentalCreate)

```json
{
  "item_id": 8,
  "tanggal_mulai": "2026-06-15",
  "tanggal_selesai": "2026-06-18",
  "promo_code": "WELCOME50"
}
```

### Response (201 Created — RentalResponse)

```json
{
  "id": 33,
  "user_id": 12,
  "item_id": 8,
  "tanggal_mulai": "2026-06-15",
  "tanggal_selesai": "2026-06-18",
  "total_harga": 100000.0,
  "discount_amount": 50000.0,
  "status": "pending"
}
```

## b. Update Status Sewa

**Method:** `PUT`

**Endpoint:** `/rentals/{rental_id}/status`

**Fungsi:** Admin memperbarui status transaksi sewa (`pending`, `disetujui`, `ditolak`, `sedang_disewa`, `selesai`).

### Request Body (RentalStatusUpdate)

```json
{
  "status": "disetujui"
}
```

### Response (200 OK — RentalResponse)

```json
{
  "id": 33,
  "status": "disetujui",
  "total_harga": 100000.0,
  "discount_amount": 50000.0
}
```

## c. Ambil Alamat Pickup GPS

**Method:** `GET`

**Endpoint:** `/rentals/{rental_id}/pickup`

**Fungsi:** Mendapatkan titik koordinat lokasi toko untuk pengambilan barang fisik oleh penyewa (Leaflet Map).

### Response (200 OK — PickupInfoResponse)

```json
{
  "rental_id": 33,
  "pickup_alamat": "Jl. Soekarno Hatta KM 15 Baru, Balikpapan",
  "pickup_latitude": -1.150431,
  "pickup_longitude": 116.861214,
  "pickup_nama_usaha": "Harahetta Rental Outdoor Super",
  "pickup_telepon": "08123456789",
  "tanggal_mulai": "2026-06-15",
  "tanggal_selesai": "2026-06-18",
  "item_nama": "Tenda Dome 4 Orang"
}
```

## d. Kirim Permintaan Pengembalian Barang

**Method:** `POST`

**Endpoint:** `/rentals/{rental_id}/request-return`

**Fungsi:** Penyewa memberitahukan admin bahwa barang telah selesai digunakan dan dikembalikan.

### Response (200 OK)

```json
{
  "message": "Permintaan pengembalian berhasil dikirim. Tunggu konfirmasi admin.",
  "rental_id": 33,
  "return_requested_at": "2026-06-18T10:00:00Z"
}
```
# 💳 7. Modul Pembayaran (/payments)

## a. Generate Snap Token Midtrans

**Method:** `POST`

**Endpoint:** `/payments/rentals/{rental_id}/charge`

**Fungsi:** Membuat Snap token transaksi pembayaran otomatis dari Midtrans.

### Response (201 Created — MidtransChargeResponse)

```json
{
  "payment_id": 41,
  "rental_id": 33,
  "order_id": "RENTAL-33-1718274910",
  "snap_token": "snap-token-f9a8b7c6d5e4...",
  "snap_redirect_url": "[https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-f9a8b7c6d5e4](https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-f9a8b7c6d5e4)...",
  "client_key": "SB-Mid-client-xxxxxxx",
  "jumlah": 100000.0,
  "status": "pending"
}
```

## b. Charge Direct via Core API

**Method:** `POST`

**Endpoint:** `/payments/rentals/{rental_id}/charge-direct`

**Fungsi:** Pembayaran langsung tanpa Snap popup (QRIS, VA Transfer).

### Request Body (DirectChargeRequest)

```json
{
  "payment_type": "bank_transfer",
  "bank": "bca"
}
```

### Response (200 OK — MidtransChargeResponse)

```json
{
  "payment_id": 41,
  "order_id": "RENTAL-33-1718274910",
  "payment_type": "bank_transfer",
  "status": "pending",
  "midtrans_response": {
    "status_code": "201",
    "gross_amount": "100000.00"
  }
}
```

## c. Webhook IPN Midtrans

**Method:** `POST`

**Endpoint:** `/payments/midtrans/notification`

**Fungsi:** Webhook penerima status update pembayaran instan dari server Midtrans.

### Request Body

```json
{
  "order_id": "RENTAL-33-1718274910",
  "transaction_status": "settlement",
  "status_code": "200",
  "gross_amount": "100000.00",
  "signature_key": "SHA512_verification_key_generated_by_midtrans_and_server_key..."
}
```

### Response (200 OK)

```json
{
  "status": "ok",
  "payment_id": 41,
  "payment_status": "completed"
}
```

# 💰 8. Modul Dompet & Penarikan (/admin/wallet)

## a. Lihat Saldo Wallet

**Method:** `GET`

**Endpoint:** `/admin/wallet`

**Fungsi:** Mengambil sisa saldo wallet pendapatan aktif admin toko.

### Response (200 OK — WalletResponse)

```json
{
  "id": 2,
  "admin_id": 5,
  "saldo": 500000.0,
  "total_pendapatan": 750000.0,
  "total_withdrawn": 250000.0
}
```

## b. Pengajuan Penarikan Saldo

**Method:** `POST`

**Endpoint:** `/admin/wallet/withdraw`

**Fungsi:** Admin toko mengajukan penarikan dana saldo ke rekening bank tertentu.

### Request Body (WithdrawalCreate)

```json
{
  "jumlah": 100000.0,
  "bank_name": "BCA",
  "account_number": "1234567890"
}
```

### Response (201 Created — WithdrawalResponse)

```json
{
  "id": 9,
  "wallet_id": 2,
  "jumlah": 100000.0,
  "bank_name": "BCA",
  "account_number": "1234567890",
  "status": "pending"
}
```

# 🤖 9. Modul Chatbot & WebSockets Chat

## a. Asisten Chatbot Gemini AI

**Method:** `POST`

**Endpoint:** `/chatbot`

**Fungsi:** Mengirim pesan konsultasi dan mendapatkan rekomendasi dari Gemini AI.

### Request Body (ChatbotMessage)

```json
{
  "message": "Halo AI, tolong carikan saya tenda dome di Balikpapan!"
}
```

### Response (200 OK — ChatbotResponse)

```json
{
  "query": "Halo AI, tolong carikan saya tenda dome di Balikpapan!",
  "response": "Halo! Saya menemukan 'Tenda Dome 4 Orang' yang disewakan oleh Harahetta Rental Outdoor di Balikpapan.",
  "status": "success"
}
```

## b. WebSocket Live-Chat Room

**Protocol:** `WebSocket`

**Endpoint:** `/chat/ws/{room_id}`

**Fungsi:** Koneksi jabat tangan (handshake) komunikasi real-time antar pengguna.

### Client Send Message (JSON Payload)

```json
{
  "message": "Halo Admin, saya ingin menanyakan kondisi tenda domenya."
}
```

### Server Broadcast Message (JSON Payload)

```json
{
  "id": 1024,
  "room_id": 4,
  "sender_id": 12,
  "body": "Halo Admin, saya ingin menanyakan kondisi tenda domenya.",
  "is_read": false,
  "timestamp": "2026-06-13T10:45:00Z"
}
```

