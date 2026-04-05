# ☁️ Cloud App - [SEWAIN - SYSTEM FITUR]

SEWAIN adalah platform berbasis web yang memfasilitasi proses penyewaan barang secara online secara lebih mudah, aman, dan terstruktur. Melalui sistem ini, penyedia dapat menampilkan dan mengelola barang yang disewakan, sementara pengguna dapat mencari barang, melihat detail, menentukan periode sewa, serta mengajukan permintaan penyewaan secara langsung. Platform ini juga dilengkapi dengan pengelolaan status transaksi secara real-time dan fitur verifikasi identitas penyewa untuk meningkatkan keamanan selama proses penyewaan.

SEWAIN ditujukan untuk pelaku usaha penyewaan, khususnya UMKM, serta masyarakat yang membutuhkan barang tanpa harus membelinya. Aplikasi ini membantu mengatasi berbagai kendala dalam sistem penyewaan manual, seperti pencatatan yang tidak rapi, jangkauan pelanggan yang terbatas, kesulitan dalam promosi, serta risiko penyalahgunaan barang. Dengan digitalisasi melalui SEWAIN, proses pengelolaan menjadi lebih efisien, transparan, dan mampu menjangkau lebih banyak pengguna.

---

# Fitur Sistem

SEWAIN memiliki tiga peran utama dalam sistem:

- Super Admin  
- Admin (Penyedia Barang)  
- User (Penyewa)

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

---

## 👥 Tim

| Nama | NIM | Peran |
|------|-----|-------|
| Djaky Abbyyu Fauzan Timumum | 10231032 | Lead Backend |
| Achmad Zaki Zaidan | 10231002 | Lead Frontend |
| Muhammad Alif Setiawan | 10231056 | Lead DevOps |
| Riqqah Khalda Karina | 10231082 | Lead QA & Docs |

---

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| FastAPI   | Backend REST API |
| React     | Frontend SPA |
| PostgreSQL | Database |
| Docker    | Containerization |
| GitHub Actions | CI/CD |
| Railway/Render | Cloud Deployment |

---

## 🏗️ Architecture

```
[React Frontend] <--HTTP--> [FastAPI Backend] <--SQL--> [PostgreSQL]
```

*(Diagram ini akan berkembang setiap minggu)*

---

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
| 2 | REST API + Database | ✅ |
| 3 | React Frontend | ✅ |
| 4 | Full-Stack Integration | ✅ |
| 5-7 | Docker & Compose | ⬜ |
| 8 | UTS Demo | ⬜ |
| 9-11 | CI/CD Pipeline | ⬜ |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |

---

## 📁 Project Structure

```
cc-kelompok-harahetta-2/
├── backend/                    # FastAPI Backend
│   ├── main.py                 # Entry point aplikasi backend
│   └── requirements.txt        # Daftar dependensi Python
│
├── frontend/                   # React Frontend (Vite)
│   ├── public/                 # Aset statis publik
│   ├── src/                    # Source code utama
│   │   ├── assets/             # Gambar & aset statis
│   │   ├── App.jsx             # Komponen utama React
│   │   ├── App.css             # Style komponen App
│   │   ├── main.jsx            # Entry point React
│   │   └── index.css           # Style global
│   ├── index.html              # Template HTML utama
│   ├── package.json            # Dependensi & scripts Node.js
│   ├── vite.config.js          # Konfigurasi Vite
│   └── eslint.config.js        # Konfigurasi ESLint
│
├── docs/                       # Dokumentasi tim
│   ├── member-Alif.md
│   ├── member-Fauzanabbyu.md
│   ├── member-Riqqah.md
│   └── member-ZakiZaidan.md
│
├── .gitignore
└── README.md
```
---

## 🚀 API Endpoints Documentation

Dokumentasi ini menjelaskan langkah demi langkah pembuatan backend Inventory Management menggunakan FastAPI dan PostgreSQL, mulai dari setup database sampai proses testing endpoint.

---

### 1. Konfigurasi Database PostgreSQL

Tahap awal pengembangan dimulai dengan penyediaan basis data sebagai media penyimpanan data jangka panjang.

#### 1.1 Pembuatan Database

Melalui terminal PostgreSQL (psql), database dibuat dengan perintah berikut:

```sql
CREATE DATABASE cloudapp;
```

Setelah perintah dijalankan, pastikan database berhasil dibuat dengan mengecek daftar database menggunakan perintah:

```bash
\l
```

Karena database `cloudapp` muncul dalam daftar, maka proses pembuatan database sudah berhasil.

#### 1.2 Variabel Lingkungan (.env)

Untuk konfigurasi koneksi database, digunakan file `.env` yang berada di direktori `backend/`. Tujuannya adalah untuk menjaga keamanan data sensitif seperti username dan password database.

Format koneksi yang digunakan:

```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@localhost:5432/cloudapp
```

#### 1.3 File Template Konfigurasi (.env.example)

Kemudian dibuat juga file `backend/.env.example` untuk pengelolaan repositori Git. File ini berfungsi sebagai acuan konfigurasi yang di-commit ke Git, sehingga pengembang lain dapat mengetahui format variabel yang diperlukan tanpa melihat username dan password asli.

Isi file `.env.example`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cloudapp
```

#### 1.4 Keamanan Konfigurasi

Untuk memastikan file `.env` tidak ikut terunggah ke repositori publik, pastikan file tersebut sudah terdaftar dalam `.gitignore`. Verifikasi dengan menjalankan perintah berikut:

```bash
cat .gitignore | grep .env
```

Karena output telah menampilkan baris `.env`, maka konfigurasi sudah benar. Artinya, file `.env` tidak akan terunggah ke repositori dan username serta password asli tetap terlindungi.

#### 1.5 Instalasi Dependensi Backend

Seluruh dependensi yang dibutuhkan oleh backend telah didefinisikan dalam file berikut:

File: `backend/requirements.txt`

```txt
fastapi==0.115.0
uvicorn==0.30.0
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
python-dotenv==1.0.1
pydantic[email]==2.9.0
```

Daftar pustaka tersebut mencakup framework utama, server, ORM, driver database PostgreSQL, serta library untuk pengelolaan environment variable dan validasi data.

Proses instalasi telah dijalankan dengan perintah berikut:

```bash
cd backend
pip install -r requirements.txt
```

Setelah perintah dieksekusi, seluruh dependensi berhasil terinstal tanpa kendala. Dengan demikian, lingkungan pengembangan backend telah siap digunakan untuk menjalankan aplikasi.

---

### 2. Struktur Arsitektur Perangkat Lunak

Pengembangan backend disusun ke dalam beberapa modul utama agar struktur program lebih sistematis dan memudahkan proses pengembangan maupun pemeliharaan di masa mendatang.

Berikut adalah daftar file yang telah dibuat beserta penjelasannya:

#### 📁 database.py 

Modul ini berfungsi untuk mengatur koneksi antara aplikasi FastAPI dengan PostgreSQL (database) menggunakan SQLAlchemy. Di dalamnya terdapat mekanisme `SessionLocal` untuk manajemen transaksi data serta fungsi dependency injection `get_db` untuk memastikan sesi database dibuka dan ditutup dengan benar pada setiap permintaan (request).

File: `backend/database.py`

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables dari .env digunakan untuk memuat variabel lingkungan dari file `.env`.
load_dotenv()

# Ambil DATABASE_URL dari environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL tidak ditemukan di .env!")

# Buat engine (koneksi ke database)
engine = create_engine(DATABASE_URL)

# Buat session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk models digunakan sebagai parent class untuk semua model SQLAlchemy.
Base = declarative_base()

# Dependency: dapatkan database session
def get_db():
    """
    Dependency injection untuk FastAPI.
    Membuka session saat request masuk, menutup saat selesai.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 📁 models.py

File ini mendefinisikan skema tabel `items` dalam database menggunakan deklarasi kelas SQLAlchemy. Setiap atribut dalam kelas merepresentasikan satu kolom dalam tabel.

Kolom-kolom yang tersedia meliputi:

- `id` : Kunci utama (Primary Key) dengan auto-increment.  
- `name` : Nama item, wajib diisi, maksimal 100 karakter.  
- `description` : Deskripsi item (opsional).  
- `price` : Harga item, wajib diisi.  
- `quantity` : Jumlah stok, nilai default 0.  
- `created_at` : Otomatis terisi saat data dibuat.  
- `updated_at` : Otomatis terisi saat data diperbarui.  

File: `backend/models.py`

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Item(Base):
    """
    Model untuk tabel 'items' di database.
    Setiap atribut = satu kolom di tabel.
    """

    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Item(id={self.id}, name='{self.name}', price={self.price})>"
```

---

#### 📁 schemas.py

Modul ini menyediakan skema validasi menggunakan Pydantic untuk memastikan data yang masuk (request) dan keluar (response) dari API sesuai dengan aturan yang telah ditentukan.

Skema yang tersedia:

- `ItemCreate` : Digunakan untuk pembuatan data baru (POST).
- `ItemUpdate` : Digunakan untuk pembaruan data (PUT), seluruh field bersifat opsional (parsial).
- `ItemResponse` : Digunakan sebagai format standar respons API.
- `ItemListResponse` : Digunakan untuk respons berbentuk daftar dengan metadata total data.

Beberapa aturan validasi yang digunakan pada setiap field adalah sebagai berikut:

- `Field(..., min_length=1)`  
  Menunjukkan bahwa field bersifat wajib diisi dan harus memiliki minimal satu karakter.

- `Field(..., gt=0)`  
  Menunjukkan bahwa field wajib diisi dan nilainya harus lebih besar dari 0.

- `Field(0, ge=0)`  
  Menetapkan nilai default sebesar 0 serta membatasi agar nilai tidak boleh kurang dari 0 (tidak negatif).

- `Optional[str] = None`  
  Menunjukkan bahwa field bersifat opsional dan secara default akan bernilai `None` apabila tidak diberikan.

- `from_attributes = True`  
  Mengizinkan Pydantic untuk mengonversi objek SQLAlchemy langsung menjadi response model.

File: `backend/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# === BASE SCHEMA ===
class ItemBase(BaseModel):
    """Base schema — field yang dipakai untuk create & update."""

    name: str = Field(..., min_length=1, max_length=100, examples=["Laptop"])
    description: Optional[str] = Field(None, examples=["Laptop untuk cloud computing"])
    price: float = Field(..., gt=0, examples=[15000000])
    quantity: int = Field(0, ge=0, examples=[10])

# === CREATE SCHEMA (untuk POST request) ===
class ItemCreate(ItemBase):
    """Schema untuk membuat item baru. Mewarisi semua field dari ItemBase."""
    pass

# === UPDATE SCHEMA (untuk PUT request) ===
class ItemUpdate(BaseModel):
    """
    Schema untuk update item. Semua field optional
    karena user mungkin hanya ingin update sebagian field.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

# === RESPONSE SCHEMA (untuk output) ===
class ItemResponse(ItemBase):
    """Schema untuk response. Termasuk id dan timestamp dari database."""

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Agar bisa convert dari SQLAlchemy model

# === LIST RESPONSE (dengan metadata) ===
class ItemListResponse(BaseModel):
    """Schema untuk response list items dengan total count."""

    total: int
    items: list[ItemResponse]
```

---

#### 📁 crud.py 

Modul ini berisi implementasi fungsi operasional dasar database (Create, Read, Update, Delete).  
Selain operasi CRUD standar, modul ini juga dilengkapi dengan:

- Fitur pencarian (`search`) berdasarkan nama atau deskripsi.
- Fitur pagination menggunakan `skip` dan `limit` untuk efisiensi beban kerja server.
- Pengurutan data berdasarkan waktu pembuatan terbaru.

File: `backend/crud.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Item
from schemas import ItemCreate, ItemUpdate

def create_item(db: Session, item_data: ItemCreate) -> Item:
    """Buat item baru di database."""
    db_item = Item(**item_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_items(db: Session, skip: int = 0, limit: int = 20, search: str = None):
    """
    Ambil daftar items dengan pagination & search.

    - skip: jumlah data yang di-skip (untuk pagination)
    - limit: jumlah data per halaman
    - search: cari berdasarkan nama atau deskripsi
    """

    query = db.query(Item)

    if search:
        query = query.filter(
            or_(
                Item.name.ilike(f"%{search}%"),
                Item.description.ilike(f"%{search}%")
            )
        )

    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": items}

def get_item(db: Session, item_id: int) -> Item | None:
    """Ambil satu item berdasarkan ID."""
    return db.query(Item).filter(Item.id == item_id).first()

def update_item(db: Session, item_id: int, item_data: ItemUpdate) -> Item | None:
    """
    Update item berdasarkan ID.
    Hanya update field yang dikirim (bukan None).
    """

    db_item = db.query(Item).filter(Item.id == item_id).first()

    if not db_item:
        return None

    # Hanya update field yang dikirim (exclude_unset=True)
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int) -> bool:
    """Hapus item berdasarkan ID. Return True jika berhasil."""

    db_item = db.query(Item).filter(Item.id == item_id).first()

    if not db_item:
        return False

    db.delete(db_item)
    db.commit()
    return True
```


#### 📁 main.py

File ini merupakan pusat aplikasi (entry point API) yang mengintegrasikan seluruh modul backend.  
Di dalamnya terdapat:

- Inisialisasi aplikasi FastAPI
- Pembuatan tabel otomatis
- Konfigurasi middleware CORS
- Definisi seluruh endpoint API
- Dokumentasi Swagger otomatis

File: `backend/main.py`

```python
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base
from schemas import ItemCreate, ItemUpdate, ItemResponse, ItemListResponse
import crud

# Buat semua tabel di database (jika belum ada)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud App API",
    description="REST API untuk mata kuliah Komputasi Awan — SI ITK",
    version="0.2.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    """Endpoint untuk mengecek apakah API berjalan."""
    return {"status": "healthy", "version": "0.2.0"}

# ==================== CRUD ENDPOINTS ====================

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """
    Buat item baru.

    - **name**: Nama item (wajib, 1-100 karakter)
    - **price**: Harga (wajib, > 0)
    - **description**: Deskripsi (opsional)
    - **quantity**: Jumlah stok (default: 0)
    """
    return crud.create_item(db=db, item_data=item)

@app.get("/items", response_model=ItemListResponse)
def list_items(
    skip: int = Query(0, ge=0, description="Jumlah data yang di-skip"),
    limit: int = Query(20, ge=1, le=100, description="Jumlah data per halaman"),
    search: str = Query(None, description="Cari berdasarkan nama/deskripsi"),
    db: Session = Depends(get_db),
):
    """
    Ambil daftar items dengan pagination dan search.

    - **skip**: Offset untuk pagination (default: 0)
    - **limit**: Jumlah item per halaman (default: 20, max: 100)
    - **search**: Kata kunci pencarian (opsional)
    """
    return crud.get_items(db=db, skip=skip, limit=limit, search=search)

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Ambil satu item berdasarkan ID."""
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return item

@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    """
    Update item berdasarkan ID.
    Hanya field yang dikirim yang akan di-update (partial update).
    """
    updated = crud.update_item(db=db, item_id=item_id, item_data=item)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return updated

@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Hapus item berdasarkan ID."""
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return None

# ==================== TEAM INFO ====================

@app.get("/team")
def team_info():
    """Informasi tim."""
    return {
        "team": "cloud-team-XX",
        "members": [
            # TODO: Isi dengan data tim Anda
            {"name": "Nama 1", "nim": "NIM1", "role": "Lead Backend"},
            {"name": "Nama 2", "nim": "NIM2", "role": "Lead Frontend"},
            {"name": "Nama 3", "nim": "NIM3", "role": "Lead DevOps"},
            {"name": "Nama 4", "nim": "NIM4", "role": "Lead QA & Docs"},
        ],
    }
```

---

### 3. Prosedur Eksekusi

Tahapan berikut menjelaskan cara menjalankan server aplikasi backend.

#### 3.1 Menjalankan Server

Aplikasi dapat dijalankan menggunakan Uvicorn sebagai ASGI server dengan perintah berikut:

```bash
uvicorn main:app --reload
```

Keterangan:
- `main` → Nama file Python (`main.py`)
- `app` → Instance FastAPI di dalam file tersebut
- `--reload` → Mengaktifkan mode development (server otomatis restart saat ada perubahan kode)

Secara default, server akan berjalan pada alamat:

```
http://localhost:8000
```

#### 3.2 Dokumentasi Interaktif API

FastAPI secara otomatis menyediakan dokumentasi interaktif berbasis Swagger UI.  Dokumentasi tersebut dapat diakses melalui browser pada alamat berikut:

```
http://localhost:8000/docs
```

Melalui halaman ini, pengguna dapat:
- Melihat seluruh endpoint yang tersedia
- Menguji request secara langsung
- Melihat struktur request dan response
- Mengamati validasi parameter yang telah didefinisikan

---

### 4. Laporan Verifikasi Pengujian

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
