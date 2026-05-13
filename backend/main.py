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
    AdminProfileCreate, AdminProfileUpdate, AdminProfileResponse, AdminCreateRequest, AdminPaymentInfoResponse,
    # UserProfile
    UserProfileCreate, UserProfileUpdate, UserProfileResponse, VerificationAction,
    # Category
    CategoryCreate, CategoryUpdate, CategoryResponse,
    # Item
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    # Rental
    RentalCreate, RentalStatusUpdate, RentalResponse, RentalListResponse, PickupInfoResponse,
    # Payment
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentListResponse,
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
    title="Sewain API",
    description="Platform Sewa Barang Online. Gunakan POST /auth/login untuk login dan dapatkan token.",
    version="1.0.0",
    openapi_tags=[
        {"name": "🔐 Auth", "description": "Login & Token Management"},
        {"name": "👑 Super Admin", "description": "Super Admin Functions"},
        {"name": "🏪 Admin", "description": "Admin/Penyedia Functions"},
        {"name": "👤 User", "description": "User/Penyewa Functions"},
        {"name": "📦 Items", "description": "Barang Sewa Management"},
        {"name": "📋 Rentals", "description": "Transaksi Penyewaan"},
        {"name": "� Payments — Pembayaran", "description": "Pembayaran Penyewaan"},
        {"name": "�📂 Categories", "description": "Kategori Barang"},
        {"name": "ℹ️ Info", "description": "Platform Information"},
    ]
)

# ==================== CORS ====================

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
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

@app.get("/", tags=["ℹ️ Info"])
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


@app.get("/health", tags=["ℹ️ Info"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - cek status API & database."""
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


@app.get("/team", tags=["ℹ️ Info"])
def team_info():
    """Informasi tim pengembang."""
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
    summary="Daftar akun baru (hanya untuk Penyewa)",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrasi akun baru di Sewain sebagai **Penyewa** (role: user).

    **Catatan Keamanan:**
    - Registrasi publik **hanya untuk role `user`** (penyewa barang)
    - **Admin** (penyedia barang) dibuat oleh Super Admin via `POST /superadmin/admins`
    - **Super Admin** dibuat manual oleh developer/database seeder

    Setelah registrasi, user perlu melengkapi profil dan upload KTP untuk diverifikasi.
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
    "/admins/{admin_id}/payment-info",
    response_model=AdminPaymentInfoResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Public] Info pembayaran penyedia (nomor rekening & QRIS)",
)
def get_admin_payment_info(
    admin_id: int,
    db: Session = Depends(get_db),
):
    """
    Mengambil info pembayaran penyedia barang (publik).
    Digunakan user untuk melihat nomor rekening & QRIS saat akan membayar.
    """
    profile = db.query(AdminProfile).filter(AdminProfile.id == admin_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Admin ID {admin_id} tidak ditemukan")
    return AdminPaymentInfoResponse(
        admin_id=profile.id,
        nama_usaha=profile.nama_usaha,
        nomor_rekening=profile.nomor_rekening,
        foto_qris=profile.foto_qris,
        nomor_telepon=profile.nomor_telepon,
    )


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


@app.post(
    "/superadmin/admins",
    response_model=AdminProfileResponse,
    status_code=201,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Tambahkan admin baru",
)
def create_admin_by_superadmin(
    data: AdminCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Super Admin membuat admin baru.

    **Fitur:**
    - Buat user dengan role admin
    - Otomatis buat profil usaha
    - Generate password dengan hashing aman
    """
    user = crud.create_admin_user(
        db=db,
        email=data.email,
        nama=data.nama,
        password=data.password,
        nama_usaha=data.nama_usaha,
        alamat_usaha=data.alamat_usaha,
        nomor_telepon=data.nomor_telepon,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' sudah terdaftar",
        )

    # Return admin profile
    profile = crud.get_admin_profile(db=db, user_id=user.id)
    return profile


@app.get(
    "/superadmin/admins/{admin_id}/stats",
    tags=["👑 Super Admin"],
    summary="[Super Admin] Detail admin dengan statistik",
)
def get_admin_detail_stats(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Super Admin melihat detail profil admin beserta statistik lengkap:
    - Jumlah barang & kategori
    - Rental stats (pending, approved, completed)
    - Revenue (total & bulanan)
    - Unique customers
    - Join date
    """
    stats = crud.get_admin_stats(db=db, admin_id=admin_id)
    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"Admin ID {admin_id} tidak ditemukan",
        )
    return stats


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
    summary="Lihat katalog barang (PUBLIK - tanpa login)",
)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Cari nama atau deskripsi barang"),
    category_id: int = Query(None, description="Filter by ID kategori"),
    category: str = Query(None, description="Filter by nama kategori, contoh: electronics"),
    item_status: str = Query(None, alias="status", description="Filter: available | rented | unavailable"),
    db: Session = Depends(get_db),
):
    """
    Katalog semua barang sewa yang tersedia.
    
    **Akses:** Publik (tidak perlu login)
    
    **Filter tersedia:**
    - `search`: Cari nama atau deskripsi barang
    - `category_id`: Filter berdasarkan ID kategori
    - `category`: Filter berdasarkan nama kategori (contoh: `electronics`, `outdoor`)
    - `status`: Filter berdasarkan ketersediaan (available, rented, unavailable)
    - `skip` & `limit`: Pagination
    """
    return crud.get_items(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        category=category,
        status=item_status,
    )


@app.get(
    "/items/{item_id}",
    response_model=ItemResponse,
    tags=["📦 Items — Barang Sewa"],
    summary="Detail satu barang (PUBLIK - tanpa login)",
)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    """
    Detail lengkap satu barang: foto, deskripsi, harga, ketersediaan.
    
    **Akses:** Publik (tidak perlu login)
    
    Endpoint ini digunakan di landing page untuk menampilkan detail barang
    sebelum user login atau register.
    """
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
    > ⚠️ Admin harus sudah mengisi **alamat usaha dan koordinat** (latitude/longitude) di profil.
    """
    # Dapatkan admin_profile dari user yang login
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Buat profil usaha terlebih dahulu di POST /admin/profile",
        )
    # Guard: validasi alamat + koordinat wajib sebelum bisa posting barang
    if not admin_profile.alamat_usaha or not admin_profile.latitude or not admin_profile.longitude:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lengkapi alamat usaha dan titik koordinat di profil terlebih dahulu sebelum menambah barang.",
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


@app.post(
    "/admin/items/fix-status",
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin/Super Admin] Fix status semua barang berdasarkan stok",
)
def fix_items_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Recalculate status untuk semua barang berdasarkan stok aktual.
    Berguna untuk memperbaiki barang yang statusnya tidak sesuai dengan stok.
    
    - Super admin: fix semua barang di platform
    - Admin biasa: fix hanya barang milik sendiri
    """
    from models import Item, UserRole
    
    # Ambil items yang perlu di-fix
    if current_user.role == UserRole.super_admin:
        items = db.query(Item).all()
    else:
        admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
        if not admin_profile:
            raise HTTPException(status_code=400, detail="Profil usaha tidak ditemukan")
        items = db.query(Item).filter(Item.admin_id == admin_profile.id).all()
    
    fixed_count = 0
    for item in items:
        old_status = item.status
        crud._recalculate_item_status(db, item)
        if old_status != item.status:
            fixed_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "total_items": len(items),
        "fixed_count": fixed_count,
        "message": f"Berhasil memperbaiki {fixed_count} dari {len(items)} barang"
    }


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
    
    # Handle error dari validasi transisi status
    if isinstance(updated, dict) and "error" in updated:
        raise HTTPException(
            status_code=400,
            detail=updated["error"],
        )
    
    return updated


# ──────────────────────────────────────────────────────────────
# PICKUP INFO & KONFIRMASI PENGAMBILAN
# ──────────────────────────────────────────────────────────────

@app.get(
    "/rentals/{rental_id}/pickup",
    response_model=PickupInfoResponse,
    tags=["📋 Rentals — Penyewaan"],
    summary="[User] Info lokasi pengambilan barang",
)
def get_rental_pickup_info(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    User melihat info lokasi pickup setelah pembayaran dikonfirmasi.

    Menampilkan:
    - Alamat teks usaha admin (snapshot saat rental disetujui, atau profil admin saat ini sebagai fallback)
    - Koordinat latitude/longitude untuk tampil di peta
    - Nama usaha + nomor telepon admin
    - Tanggal mulai & selesai sewa

    **Catatan:** Endpoint ini hanya tersedia setelah status rental `sedang_disewa`.
    """
    from models import UserRole as UR, RentalStatus as RS
    rental = crud.get_rental(db=db, rental_id=rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail=f"Rental ID {rental_id} tidak ditemukan")

    # User hanya bisa lihat rental miliknya
    if current_user.role == UR.user and rental.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak punya akses ke transaksi ini")

    # Pickup info hanya tersedia saat sedang_disewa, selesai,
    # atau disetujui dengan payment sudah completed
    from models import Payment as PaymentModel
    allowed = rental.status in [RS.sedang_disewa, RS.selesai]
    if not allowed and rental.status == RS.disetujui:
        # Cek apakah payment sudah completed
        pay = db.query(PaymentModel).filter(
            PaymentModel.rental_id == rental_id,
            PaymentModel.status == "completed",
        ).first()
        allowed = pay is not None

    if not allowed:
        raise HTTPException(
            status_code=400,
            detail="Info pickup hanya tersedia setelah pembayaran dikonfirmasi (status: sedang_disewa)",
        )

    # ── Strategi sumber data:
    # - disetujui / sedang_disewa → SELALU pakai profil admin terkini (bisa berubah)
    # - selesai → pakai snapshot (histori, tidak boleh berubah)
    from models import RentalStatus as RS2

    admin_profile = None
    if rental.item and rental.item.admin_id:
        admin_profile = crud.get_admin_profile_by_id(db=db, admin_id=rental.item.admin_id)

    if rental.status in [RS.disetujui, RS.sedang_disewa] and admin_profile:
        # Rental belum selesai: PAKAI profil admin terkini
        pickup_lat = admin_profile.latitude
        pickup_lng = admin_profile.longitude
        pickup_alamat = admin_profile.alamat_usaha
        pickup_nama_usaha = admin_profile.nama_usaha
        pickup_telepon = admin_profile.nomor_telepon
    else:
        # Rental selesai: pakai snapshot (data histori saat transaksi)
        pickup_lat = rental.pickup_latitude
        pickup_lng = rental.pickup_longitude
        pickup_alamat = rental.pickup_alamat
        pickup_nama_usaha = rental.pickup_nama_usaha
        pickup_telepon = rental.pickup_telepon

        # Fallback ke profil admin jika snapshot kosong
        if (not pickup_lat or not pickup_lng) and admin_profile:
            pickup_lat = admin_profile.latitude
            pickup_lng = admin_profile.longitude
            pickup_alamat = pickup_alamat or admin_profile.alamat_usaha
            pickup_nama_usaha = pickup_nama_usaha or admin_profile.nama_usaha
            pickup_telepon = pickup_telepon or admin_profile.nomor_telepon

    if not pickup_lat or not pickup_lng:
        raise HTTPException(
            status_code=404,
            detail="Koordinat pickup tidak ditemukan. Admin belum mengisi koordinat lokasi usaha.",
        )

    return {
        "rental_id": rental.id,
        "pickup_alamat": pickup_alamat or "",
        "pickup_latitude": pickup_lat,
        "pickup_longitude": pickup_lng,
        "pickup_nama_usaha": pickup_nama_usaha or "",
        "pickup_telepon": pickup_telepon,
        "tanggal_mulai": rental.tanggal_mulai,
        "tanggal_selesai": rental.tanggal_selesai,
        "item_nama": rental.item.nama if rental.item else "Unknown",
    }


@app.put(
    "/rentals/{rental_id}/confirm-pickup",
    tags=["📋 Rentals — Penyewaan"],
    summary="[Admin] Konfirmasi barang sudah diambil penyewa",
)
def confirm_pickup(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin mengonfirmasi bahwa barang sudah diambil oleh penyewa.

    Menyimpan timestamp `diambil_at` sebagai bukti serah terima digital.
    Status rental harus `sedang_disewa` sebelum bisa konfirmasi.
    """
    from models import RentalStatus as RS
    from datetime import datetime as dt

    rental = crud.get_rental(db=db, rental_id=rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail=f"Rental ID {rental_id} tidak ditemukan")

    if rental.status != RS.sedang_disewa:
        raise HTTPException(
            status_code=400,
            detail=f"Status rental harus 'sedang_disewa', saat ini: '{rental.status.value}'",
        )

    # Ambil rental langsung dari DB untuk update
    from models import Rental as RentalModel
    db_rental = db.query(RentalModel).filter(RentalModel.id == rental_id).first()
    db_rental.diambil_at = dt.now()
    db.commit()
    db.refresh(db_rental)

    return {
        "message": "Pengambilan barang berhasil dikonfirmasi",
        "rental_id": rental_id,
        "diambil_at": db_rental.diambil_at,
    }


# ============================================================
# PAYMENTS — Pembayaran Penyewaan
# ============================================================

@app.post(
    "/payments/rentals/{rental_id}",
    response_model=PaymentResponse,
    status_code=201,
    tags=["💳 Payments — Pembayaran"],
    summary="[User] Atur pembayaran sewa",
)
def create_payment_for_rental(
    rental_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user),
):
    """
    User mengatur pembayaran untuk rental yang sudah disetujui.

    **Metode pembayaran:**
    - `transfer` — Transfer bank
    - `cash` — Tunai
    - `e_wallet` — Dompet digital (OVO, GoPay, dll)
    - `credit_card` — Kartu kredit

    **Catatan:**
    - Payment auto-created ketika rental disetujui admin (status = pending)
    - User konfirmasi pembayaran & upload bukti (kalo metode transfer/e-wallet)
    """
    rental = crud.get_rental(db=db, rental_id=rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail=f"Rental ID {rental_id} tidak ditemukan")
    
    if rental.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Rental ini bukan milik Anda")
    
    payment = crud.create_payment(db=db, rental_id=rental_id, data=data)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gagal membuat pembayaran. Rental mungkin belum disetujui.",
        )
    return payment


@app.get(
    "/payments/my",
    response_model=PaymentListResponse,
    tags=["💳 Payments — Pembayaran"],
    summary="[User] Riwayat pembayaran saya",
)
def my_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None, description="Filter: pending | completed | failed | cancelled"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """User melihat riwayat pembayaran mereka."""
    try:
        result = crud.get_payments(
            db=db,
            skip=skip,
            limit=limit,
            user_id=current_user.id,
            status=status,
        )
        return result
    except Exception as e:
        import traceback
        print(f"ERROR in /payments/my: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payments: {str(e)}"
        )


@app.get(
    "/payments/{payment_id}",
    response_model=PaymentResponse,
    tags=["💳 Payments — Pembayaran"],
    summary="Lihat detail pembayaran",
)
def get_payment_detail(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Lihat detail pembayaran satu transaksi."""
    payment = crud.get_payment(db=db, payment_id=payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail=f"Payment ID {payment_id} tidak ditemukan")
    
    from models import UserRole as UR
    # User hanya boleh lihat payment miliknya
    # Admin bisa lihat payment untuk barangnya
    # Super admin bisa lihat semua
    if current_user.role == UR.user and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak punya akses ke pembayaran ini")
    
    return payment


@app.put(
    "/payments/{payment_id}/status",
    response_model=PaymentResponse,
    tags=["💳 Payments — Pembayaran"],
    summary="[User/Admin] Update status pembayaran",
)
def update_payment_status(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    Update status pembayaran.

    **User bisa:**
    - Update ke `completed` dengan upload bukti (untuk metode transfer/e-wallet)
    
    **Admin/Super Admin bisa:**
    - Verifikasi pembayaran (set status = completed)
    - Menolak pembayaran (set status = failed)
    - Batalkan pembayaran (set status = cancelled)

    **Efek samping ketika completed:**
    - Rental status auto-update ke `sedang_disewa`
    """
    payment = crud.get_payment(db=db, payment_id=payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail=f"Payment ID {payment_id} tidak ditemukan")
    
    from models import UserRole as UR
    
    # Validasi akses: user hanya bisa update miliknya, admin/super_admin bisa yang punya barangnya
    if current_user.role == UR.user:
        if payment.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Anda tidak punya akses ke pembayaran ini")
    elif current_user.role == UR.admin:
        # Admin hanya bisa update payment untuk barang-barangnya
        admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
        if not admin_profile or payment.admin_id != admin_profile.id:
            raise HTTPException(status_code=403, detail="Pembayaran ini bukan untuk barang Anda")
    
    updated = crud.update_payment_status(db=db, payment_id=payment_id, data=data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gagal update status pembayaran",
        )
    return updated


@app.get(
    "/admin/payments",
    response_model=PaymentListResponse,
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Pembayaran yang diterima",
)
def admin_incoming_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None, description="Filter: pending | completed | failed | cancelled"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin melihat pembayaran yang diterima untuk barang-barangnya."""
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        return {"total": 0, "payments": []}
    
    return crud.get_payments(
        db=db,
        skip=skip,
        limit=limit,
        admin_id=admin_profile.id,
        status=status,
    )


@app.get(
    "/admin/payments/stats",
    tags=["🏪 Admin — Profil Usaha"],
    summary="[Admin] Statistik pembayaran",
)
def admin_payment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin melihat statistik pembayaran:
    - Total pendapatan (pending, completed, failed)
    - Jumlah transaksi per status
    - Metode pembayaran yang paling sering digunakan
    - Rata-rata pembayaran
    """
    admin_profile = crud.get_admin_profile(db=db, user_id=current_user.id)
    if not admin_profile:
        raise HTTPException(status_code=404, detail="Profil usaha tidak ditemukan")
    
    stats = crud.get_admin_payment_stats(db=db, admin_id=admin_profile.id)
    return stats


@app.get(
    "/superadmin/payments",
    response_model=PaymentListResponse,
    tags=["👑 Super Admin"],
    summary="[Super Admin] Semua pembayaran platform",
)
def all_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None, description="Filter: pending | completed | failed | cancelled"),
    admin_id: int = Query(None, description="Filter by admin ID"),
    user_id: int = Query(None, description="Filter by user ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Super Admin melihat semua pembayaran di platform."""
    return crud.get_payments(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        admin_id=admin_id,
        user_id=user_id,
    )


@app.get(
    "/superadmin/payments/stats",
    tags=["👑 Super Admin"],
    summary="[Super Admin] Statistik pembayaran platform",
)
def platform_payment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Super Admin dashboard statistik pembayaran:
    - Total revenue (pending, completed, failed)
    - Jumlah transaksi per status
    - Payment methods distribution
    - Top admins by revenue
    - Payment completion rate
    """
    from sqlalchemy.orm import joinedload
    from models import Payment, PaymentStatus
    
    payments = db.query(Payment).all()
    
    total_pending = sum(p.jumlah for p in payments if p.status == PaymentStatus.pending)
    total_completed = sum(p.jumlah for p in payments if p.status == PaymentStatus.completed)
    total_failed = sum(p.jumlah for p in payments if p.status == PaymentStatus.failed)
    
    count_pending = len([p for p in payments if p.status == PaymentStatus.pending])
    count_completed = len([p for p in payments if p.status == PaymentStatus.completed])
    count_failed = len([p for p in payments if p.status == PaymentStatus.failed])
    count_cancelled = len([p for p in payments if p.status == PaymentStatus.cancelled])
    
    completion_rate = (count_completed / len(payments) * 100) if payments else 0
    
    return {
        "total_payments": len(payments),
        "total_revenue": {
            "pending": float(total_pending),
            "completed": float(total_completed),
            "failed": float(total_failed),
        },
        "transaction_count": {
            "pending": count_pending,
            "completed": count_completed,
            "failed": count_failed,
            "cancelled": count_cancelled,
        },
        "completion_rate": f"{completion_rate:.2f}%",
    }

#penambahan sesuatu yang baru yaitu fitur statistik pembayaran untuk super admin