# ☁️ Cloud App - [SEWAIN - SYSTEM FITUR]

SEWAIN adalah platform berbasis web yang memfasilitasi proses penyewaan barang secara online secara lebih mudah, aman, dan terstruktur. Melalui sistem ini, penyedia dapat menampilkan dan mengelola barang yang disewakan, sementara pengguna dapat mencari barang, melihat detail, menentukan periode sewa, serta mengajukan permintaan penyewaan secara langsung. Platform ini juga dilengkapi dengan pengelolaan status transaksi secara real-time dan fitur verifikasi identitas penyewa untuk meningkatkan keamanan selama proses penyewaan.

SEWAIN ditujukan untuk pelaku usaha penyewaan, khususnya UMKM, serta masyarakat yang membutuhkan barang tanpa harus membelinya. Aplikasi ini membantu mengatasi berbagai kendala dalam sistem penyewaan manual, seperti pencatatan yang tidak rapi, jangkauan pelanggan yang terbatas, kesulitan dalam promosi, serta risiko penyalahgunaan barang. Dengan digitalisasi melalui SEWAIN, proses pengelolaan menjadi lebih efisien, transparan, dan mampu menjangkau lebih banyak pengguna.

# Fitur Sistem

SEWAIN memiliki tiga peran utama dalam sistem:

- Super Admin  
- Admin (Penyedia Barang)  
- User (Penyewa)

---

## 1. Super Admin

Super Admin bertugas mengelola keseluruhan sistem dan penyedia layanan.

### Fitur:
- Login sebagai Super Admin
- Melihat daftar seluruh Admin (Penyedia)
- Menambahkan Admin baru
- Mengedit data Admin
- Menghapus Admin
- Mengelola kategori barang
- Melihat seluruh aktivitas penyewaan
- Monitoring keseluruhan platform

---

## 2. Admin (Penyedia Barang)

Admin merupakan pemilik usaha atau penyedia jasa penyewaan.

### Fitur:
- Login sebagai Admin
- Mengelola profil usaha
- Menambahkan barang yang disewakan
- Mengedit data barang
- Menghapus barang
- Mengatur harga sewa
- Mengatur jumlah / stok barang
- Melihat daftar permintaan sewa dari User
- Menyetujui atau menolak permintaan sewa
- Mengubah status penyewaan:
  - Pending
  - Disetujui
  - Sedang Disewa
  - Selesai

---

## 3. User (Penyewa)

User adalah pelanggan yang menyewa barang melalui platform SEWAIN.

### A. Registrasi & Profil
- Registrasi akun
- Login
- Melengkapi data diri:
  - Nama lengkap
  - Nama orang tua
  - Alamat tempat tinggal
  - Share location (berbagi lokasi tempat tinggal melalui peta/koordinat)

### B. Verifikasi Identitas
- Upload foto KTP
- Upload foto selfie dengan KTP
- Melihat status verifikasi:
  - Menunggu verifikasi
  - Disetujui
  - Ditolak

**Catatan Sistem:**
User hanya dapat melakukan penyewaan jika data diri lengkap dan verifikasi identitas telah disetujui oleh admin.

### C. Penyewaan
- Melihat katalog barang dari berbagai penyedia
- Melihat detail barang
- Mencari barang
- Mengajukan penyewaan:
  - Pilih tanggal mulai
  - Pilih tanggal selesai

### D. Monitoring
- Melihat status penyewaan:
  - Pending
  - Disetujui
  - Sedang Disewa
  - Selesai
- Melihat riwayat penyewaan

## 👥 Tim

| Nama | NIM | Peran |
|------|-----|-------|
| Djaky Abbyyu Fauzan Timumum | 10231032 | Lead Backend |
| Achmad Zaki Zaidan | 10231002 | Lead Frontend |
| Muhammad Alif Setiawan | 10231056 | Lead DevOps |
| Riqqah Khalda Karina | 10231082 | Lead QA & Docs |

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| FastAPI   | Backend REST API |
| React     | Frontend SPA |
| PostgreSQL | Database |
| Docker    | Containerization |
| GitHub Actions | CI/CD |
| Railway/Render | Cloud Deployment |

## 🏗️ Architecture

```
[React Frontend] <--HTTP--> [FastAPI Backend] <--SQL--> [PostgreSQL]
```

*(Diagram ini akan berkembang setiap minggu)*

## 🚀 Getting Started

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

## 📅 Roadmap

| Minggu | Target | Status |
|--------|--------|--------|
| 1 | Setup & Hello World | ✅ |
| 2 | REST API + Database | ⬜ |
| 3 | React Frontend | ⬜ |
| 4 | Full-Stack Integration | ⬜ |
| 5-7 | Docker & Compose | ⬜ |
| 8 | UTS Demo | ⬜ |
| 9-11 | CI/CD Pipeline | ⬜ |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |
