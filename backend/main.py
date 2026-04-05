"""
main.py — FastAPI Application Sewain
Semua endpoint REST API sesuai implementation_plan_sewain (Modul 1-4)
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import engine, get_db
from models import Base, User, AdminProfile
from schemas import (
    # Auth
    UserCreate, UserResponse, TokenResponse, UserUpdateByAdmin,
    # AdminProfile
    AdminProfileCreate, AdminProfileUpdate, AdminProfileResponse,
    # UserProfile
    UserProfileCreate, UserProfileUpdate, UserProfileResponse, VerificationAction,
    # Category
    CategoryCreate, CategoryUpdate, CategoryResponse,
    # Item
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    # Rental
    RentalCreate, RentalStatusUpdate, RentalResponse, RentalListResponse,
)
from auth import (
    create_access_token, get_current_user,
    require_super_admin, require_admin,
    require_user, require_verified_user,
)
import crud

# ==================== INIT ====================

load_dotenv()

# Buat semua tabel di database
Base.metadata.create_all(bind=engine)

# ==================== APP INSTANCE ====================

app = FastAPI(
    title="🛵 Sewain API",
    description="""
## Platform Sewa Barang Online — Sewain

REST API untuk aplikasi **Sewain**, platform sewa barang berbasis web yang memfasilitasi
proses penyewaan secara mudah, aman, dan terstruktur.

### 👥 Peran Pengguna

| Peran | Deskripsi |
|-------|-----------|
| `super_admin` | Kelola seluruh platform, user, dan kategori |
| `admin` | Penyedia barang — kelola item & penyewaan |
| `user` | Penyewa — browse, ajukan sewa, monitor status |

### 🔐 Autentikasi
Gunakan `POST /auth/login` untuk mendapatkan JWT token, lalu klik tombol **Authorize** di atas
dan masukkan token dalam format: `Bearer <token>`

### 📋 Tim Kelompok Harahetta-2
- **Lead Backend**: Djaky Abbyyu Fauzan Timumum (10231032)
- **Lead Frontend**: Achmad Zaki Zaidan (10231002)
- **Lead DevOps**: Muhammad Alif Setiawan (10231056)
- **Lead QA & Docs**: Riqqah Khalda Karina (10231082)
    """,
    version="1.0.0",
    contact={"name": "Kelompok Harahetta-2", "email": "sewain@itk.ac.id"},
)

# ==================== CORS ====================

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins_list = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PUBLIC ENDPOINTS
# ============================================================

@app.get("/", tags=["🏠 Info"])
def root():
    """Informasi dasar aplikasi Sewain."""
    return {
        "app": "Sewain",
        "tagline": "Platform Sewa Barang Online",
        "version": "1.0.0",
        "docs": "/docs",
        "team": "Kelompok Harahetta-2 — SI ITK",
        "status": "running",
    }


@app.get("/health", tags=["🏠 Info"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.
    Cek status API dan koneksi database.
    """
    # Test koneksi DB
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": db_status,
        "app": "Sewain",
    }


@app.get("/team", tags=["🏠 Info"])
def team_info():
    """Informasi tim pengembang Sewain."""
    return {
        "team": "Kelompok Harahetta-2",
        "institution": "Sistem Informasi — Institut Teknologi Kalimantan",
        "course": "Komputasi Awan",
        "app": "Sewain — Platform Sewa Barang Online",
        "members": [
            {"nama": "Djaky Abbyyu Fauzan Timumum", "nim": "10231032", "peran": "Lead Backend"},
            {"nama": "Achmad Zaki Zaidan", "nim": "10231002", "peran": "Lead Frontend"},
            {"nama": "Muhammad Alif Setiawan", "nim": "10231056", "peran": "Lead DevOps"},
            {"nama": "Riqqah Khalda Karina", "nim": "10231082", "peran": "Lead QA & Docs"},
        ],
    }


# ============================================================
# AUTH ENDPOINTS (PUBLIC)
# ============================================================

@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=201,
    tags=["🔐 Auth"],
    summary="Daftar akun baru",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrasi akun baru di Sewain.

    **Role tersedia:**
    - `user` — Penyewa barang (default)
    - `admin` — Penyedia barang/UMKM
    - `super_admin` — Administrator platform

    > ⚠️ Dalam production, pembuatan `super_admin` & `admin` hanya boleh dilakukan oleh super_admin.
    """
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Gunakan email lain atau login.",
        )
    return user


@app.post(
    "/auth/login",
    response_model=TokenResponse,
    tags=["🔐 Auth"],
    summary="Login dan dapatkan JWT token",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Login menggunakan email & password.

    Swagger UI: masukkan **email** di field `username` dan `password` seperti biasa.

    **Response:** JWT access token yang valid selama 60 menit.
    """
    user = crud.authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan. Hubungi administrator.",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get(
    "/auth/me",
    response_model=UserResponse,
    tags=["🔐 Auth"],
    summary="Info user yang sedang login",
)
def get_me(current_user: User = Depends(get_current_user)):
    """Ambil data profil user yang sedang login berdasarkan JWT token."""
    return current_user


# ============================================================
# SUPER ADMIN — User Management
# ============================================================

@app.get(
    "/superadmin/users",
    tags=["👑 Super Admin"],
    summary="[Super Admin] Lihat semua user",
)
def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: str = Query(None, description="Filter: super_admin | admin | user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Ambil semua pengguna platform. Bisa filter by role."""
    return crud.get_users(db=db, skip=skip, limit=limit, role=role)


@app.put(
    "/superadmin/users/{user_id}",
    response_model=UserResponse,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Update data user",
)
def update_user(
    user_id: int,
    data: UserUpdateByAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin mengupdate data user (nama, is_active, role)."""
    updated = crud.update_user_by_admin(db=db, user_id=user_id, data=data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"User ID {user_id} tidak ditemukan")
    return updated


@app.delete(
    "/superadmin/users/{user_id}",
    status_code=204,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Hapus user",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin menghapus user beserta semua datanya (cascade)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    success = crud.delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User ID {user_id} tidak ditemukan")
    return None


@app.get(
    "/superadmin/stats",
    tags=["👑 Super Admin"],
    summary="[Super Admin] Statistik platform",
)
def platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Dashboard statistik keseluruhan platform Sewain."""
    return crud.get_platform_stats(db)


@app.get(
    "/superadmin/rentals",
    response_model=RentalListResponse,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Semua transaksi platform",
)
def all_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    rental_status: str = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin melihat semua transaksi sewa seluruh platform."""
    return crud.get_rentals(db=db, skip=skip, limit=limit, status=rental_status)


@app.get(
    "/superadmin/verifications",
    tags=["👑 Super Admin"],
    summary="[Super Admin] User menunggu verifikasi",
)
def pending_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Daftar user yang menunggu verifikasi identitas."""
    profiles = crud.get_users_pending_verification(db)
    return {"total": len(profiles), "profiles": profiles}


# ============================================================
# CATEGORIES (Super Admin CRUD)
# ============================================================

@app.get(
    "/categories",
    response_model=list[CategoryResponse],
    tags=["📂 Kategori"],
    summary="Lihat semua kategori (public)",
)
def list_categories(db: Session = Depends(get_db)):
    """
    Ambil semua kategori barang yang tersedia.
    Endpoint ini **tidak memerlukan login**.
    """
    return crud.get_categories(db)


@app.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=201,
    tags=["📂 Kategori"],
    summary="[Super Admin] Tambah kategori baru",
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin menambah kategori barang baru."""
    category = crud.create_category(db=db, data=data)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kategori '{data.nama}' sudah ada",
        )
    return category


@app.put(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    tags=["📂 Kategori"],
    summary="[Super Admin] Update kategori",
)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin mengupdate data kategori."""
    updated = crud.update_category(db=db, category_id=category_id, data=data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Kategori ID {category_id} tidak ditemukan")
    return updated


@app.delete(
    "/categories/{category_id}",
    status_code=204,
    tags=["📂 Kategori"],
    summary="[Super Admin] Hapus kategori",
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin menghapus kategori."""
    success = crud.delete_category(db=db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Kategori ID {category_id} tidak ditemukan")
    return None


# ============================================================
# ADMIN PROFILE
# ============================================================

@app.post(
    "/admin/profile",
    response_model=AdminProfileResponse,
    status_code=201,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Buat profil usaha",
)
def create_admin_profile(
    data: AdminProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin membuat profil usaha (nama toko, alamat, telepon)."""
    profile = crud.create_admin_profile(db=db, user_id=current_user.id, data=data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profil usaha sudah ada. Gunakan PUT untuk update.",
        )
    return profile


@app.get(
    "/admin/profile",
    response_model=AdminProfileResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Lihat profil usaha saya",
)
def get_my_admin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin melihat profil usahanya sendiri."""
    profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profil usaha belum dibuat. Gunakan POST /admin/profile untuk membuat.",
        )
    return profile


@app.put(
    "/admin/profile",
    response_model=AdminProfileResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Update profil usaha",
)
def update_my_admin_profile(
    data: AdminProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin mengupdate profil usahanya."""
    updated = crud.update_admin_profile(db=db, user_id=current_user.id, data=data)
    if not updated:
        raise HTTPException(status_code=404, detail="Profil usaha belum dibuat")
    return updated


@app.get(
    "/superadmin/admins",
    tags=["👑 Super Admin"],
    summary="[Super Admin] Daftar semua admin/penyedia",
)
def list_all_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin melihat semua profil penyedia barang."""
    return crud.get_all_admin_profiles(db=db, skip=skip, limit=limit)


# ============================================================
# USER PROFILE & VERIFIKASI IDENTITAS
# ============================================================

@app.get(
    "/profile",
    response_model=UserProfileResponse,
    tags=["👤 User — Profil & Verifikasi"],
    summary="[User] Lihat profil saya",
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """User melihat profil dan status verifikasi identitasnya."""
    profile = crud.get_or_create_user_profile(db=db, user_id=current_user.id)
    return profile


@app.put(
    "/profile",
    response_model=UserProfileResponse,
    tags=["👤 User — Profil & Verifikasi"],
    summary="[User] Lengkapi / update data diri",
)
def update_my_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    User melengkapi data diri:
    - nama_orang_tua, alamat, koordinat GPS
    - foto_ktp (URL), foto_selfie_ktp (URL)

    Setelah upload foto KTP, admin akan memverifikasi identitas.
    """
    profile = crud.update_user_profile(db=db, user_id=current_user.id, data=data)
    return profile


@app.put(
    "/superadmin/users/{user_id}/verify",
    response_model=UserProfileResponse,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Verifikasi identitas user",
)
def verify_user_identity(
    user_id: int,
    action: VerificationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Super Admin memverifikasi atau menolak identitas user.

    **Status:**
    - `disetujui` → user.is_verified = True, bisa mulai sewa
    - `ditolak` → user.is_verified = False, harus upload ulang
    - `menunggu` → reset ke menunggu
    """
    profile = crud.update_verification_status(db=db, user_id=user_id, action=action)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail=f"Profil user ID {user_id} tidak ditemukan",
        )
    return profile


# ============================================================
# ITEMS — Barang Sewa
# ============================================================

@app.get(
    "/items",
    response_model=ItemListResponse,
    tags=["📦 Items — Barang Sewa"],
    summary="Lihat katalog barang (semua login bisa)",
)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Cari nama atau deskripsi barang"),
    category_id: int = Query(None, description="Filter by ID kategori"),
    item_status: str = Query(None, alias="status", description="Filter: available | rented | unavailable"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Katalog semua barang sewa yang tersedia.
    Bisa di-filter by kategori, status, dan search keyword.
    """
    return crud.get_items(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        status=item_status,
    )


@app.get(
    "/items/{item_id}",
    response_model=ItemResponse,
    tags=["📦 Items — Barang Sewa"],
    summary="Detail satu barang",
)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detail lengkap satu barang: foto, deskripsi, harga, ketersediaan."""
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Barang ID {item_id} tidak ditemukan")
    return item


@app.post(
    "/items",
    response_model=ItemResponse,
    status_code=201,
    tags=["📦 Items — Barang Sewa"],
    summary="[Admin] Tambah barang sewa baru",
)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin menambah barang baru yang akan disewakan.

    > ⚠️ Admin harus sudah memiliki profil usaha (`POST /admin/profile`) sebelum bisa menambah barang.
    """
    # Dapatkan admin_profile dari user yang login
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Buat profil usaha terlebih dahulu di POST /admin/profile",
        )
    return crud.create_item(db=db, admin_id=admin_profile.id, data=data)


@app.put(
    "/items/{item_id}",
    response_model=ItemResponse,
    tags=["📦 Items — Barang Sewa"],
    summary="[Admin] Update barang",
)
def update_item(
    item_id: int,
    data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin mengupdate informasi barang miliknya (nama, harga, stok, foto, status)."""
    from models import UserRole as UR
    if current_user.role == UR.super_admin:
        updated = crud.update_item_superadmin(db=db, item_id=item_id, data=data)
    else:
        admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
        if not admin_profile:
            raise HTTPException(status_code=400, detail="Profil usaha tidak ditemukan")
        updated = crud.update_item(db=db, item_id=item_id, admin_id=admin_profile.id, data=data)

    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Barang ID {item_id} tidak ditemukan atau bukan milik Anda",
        )
    return updated


@app.delete(
    "/items/{item_id}",
    status_code=204,
    tags=["📦 Items — Barang Sewa"],
    summary="[Admin] Hapus barang",
)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin menghapus barang dari katalog."""
    from models import UserRole as UR
    if current_user.role == UR.super_admin:
        success = crud.delete_item_superadmin(db=db, item_id=item_id)
    else:
        admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
        if not admin_profile:
            raise HTTPException(status_code=400, detail="Profil usaha tidak ditemukan")
        success = crud.delete_item(db=db, item_id=item_id, admin_id=admin_profile.id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Barang ID {item_id} tidak ditemukan atau bukan milik Anda",
        )
    return None


@app.get(
    "/admin/items",
    response_model=ItemListResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Lihat barang milik saya",
)
def list_my_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin melihat daftar barang yang ia miliki."""
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        return {"total": 0, "items": []}
    return crud.get_items(db=db, skip=skip, limit=limit, search=search, admin_id=admin_profile.id)


# ============================================================
# RENTALS — Transaksi Penyewaan
# ============================================================

@app.post(
    "/rentals",
    response_model=RentalResponse,
    status_code=201,
    tags=["📋 Rentals — Penyewaan"],
    summary="[User Verified] Ajukan permintaan sewa",
)
def create_rental(
    data: RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user),
):
    """
    User mengajukan permintaan sewa barang.

    **Syarat:**
    - User sudah login dan terverifikasi identitasnya
    - Barang tersedia (status = available & stok > 0)
    - Tanggal selesai harus setelah tanggal mulai

    **Total harga** dihitung otomatis: `harga_per_hari × jumlah_hari`
    """
    result = crud.create_rental(db=db, user_id=current_user.id, data=data)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=result["code"], detail=result["error"])

    return result


@app.get(
    "/rentals/my",
    response_model=RentalListResponse,
    tags=["📋 Rentals — Penyewaan"],
    summary="[User] Riwayat penyewaan saya",
)
def my_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    rental_status: str = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """User melihat riwayat semua transaksi sewanya."""
    return crud.get_rentals(
        db=db,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        status=rental_status,
    )


@app.get(
    "/rentals/{rental_id}",
    response_model=RentalResponse,
    tags=["📋 Rentals — Penyewaan"],
    summary="Detail transaksi sewa",
)
def get_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Detail satu transaksi sewa. User hanya bisa lihat miliknya sendiri."""
    rental = crud.get_rental(db=db, rental_id=rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail=f"Rental ID {rental_id} tidak ditemukan")

    from models import UserRole as UR
    # User hanya boleh lihat rental miliknya
    if current_user.role == UR.user and rental.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak punya akses ke transaksi ini")

    return rental


@app.get(
    "/admin/rentals",
    response_model=RentalListResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Permintaan sewa masuk",
)
def admin_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    rental_status: str = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin melihat semua permintaan sewa untuk barang-barang miliknya."""
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        return {"total": 0, "rentals": []}

    return crud.get_rentals(
        db=db,
        skip=skip,
        limit=limit,
        admin_id=admin_profile.id,
        status=rental_status,
    )


@app.put(
    "/rentals/{rental_id}/status",
    response_model=RentalResponse,
    tags=["📋 Rentals — Penyewaan"],
    summary="[Admin] Ubah status penyewaan",
)
def update_rental_status(
    rental_id: int,
    data: RentalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin mengubah status penyewaan.

    **Flow status:**
    ```
    pending → disetujui → sedang_disewa → selesai
                       ↓
                    ditolak
    ```

    **Efek samping:**
    - `disetujui`: stok barang berkurang 1
    - `selesai` / `ditolak`: stok barang dikembalikan
    """
    from models import UserRole as UR
    if current_user.role == UR.super_admin:
        admin_id_filter = None
    else:
        admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
        admin_id_filter = admin_profile.id if admin_profile else None

    updated = crud.update_rental_status(
        db=db,
        rental_id=rental_id,
        data=data,
        admin_id=admin_id_filter,
    )
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Rental ID {rental_id} tidak ditemukan atau bukan milik Anda",
        )
    return updated