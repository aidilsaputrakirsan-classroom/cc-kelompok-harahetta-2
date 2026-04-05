"""
crud.py — CRUD Operations Sewain
Semua operasi database untuk 6 entitas + business logic
"""

from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from models import User, AdminProfile, UserProfile, Category, Item, Rental
from models import UserRole, VerificationStatus, ItemStatus, RentalStatus
from schemas import (
    UserCreate, UserUpdateByAdmin,
    AdminProfileCreate, AdminProfileUpdate,
    UserProfileCreate, UserProfileUpdate,
    CategoryCreate, CategoryUpdate,
    ItemCreate, ItemUpdate,
    RentalCreate, RentalStatusUpdate,
    VerificationAction,
)
from auth import hash_password, verify_password


# ============================================================
# USER CRUD
# ============================================================

def create_user(db: Session, user_data: UserCreate) -> User | None:
    """
    Buat user baru dengan password yang di-hash.
    Return None jika email sudah terdaftar.
    """
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return None

    db_user = User(
        email=user_data.email,
        nama=user_data.nama,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Autentikasi user berdasarkan email & password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_user(db: Session, user_id: int) -> User | None:
    """Ambil satu user berdasarkan ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Ambil user berdasarkan email."""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 20, role: Optional[str] = None) -> dict:
    """
    Ambil daftar users dengan pagination.
    Filter by role opsional.
    """
    query = db.query(User)
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass  # Role tidak valid, abaikan filter

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "users": users}


def update_user_by_admin(db: Session, user_id: int, data: UserUpdateByAdmin) -> User | None:
    """Super admin update data user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    """Hapus user berdasarkan ID (cascade ke profil & rentals)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


# ============================================================
# ADMIN PROFILE CRUD
# ============================================================

def create_admin_profile(db: Session, user_id: int, data: AdminProfileCreate) -> AdminProfile | None:
    """Buat profil usaha untuk admin. Return None jika sudah ada."""
    existing = db.query(AdminProfile).filter(AdminProfile.user_id == user_id).first()
    if existing:
        return None

    profile = AdminProfile(
        user_id=user_id,
        nama_usaha=data.nama_usaha,
        alamat_usaha=data.alamat_usaha,
        nomor_telepon=data.nomor_telepon,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_admin_profile(db: Session, user_id: int) -> AdminProfile | None:
    """Ambil profil admin berdasarkan user_id."""
    return (
        db.query(AdminProfile)
        .options(joinedload(AdminProfile.user))
        .filter(AdminProfile.user_id == user_id)
        .first()
    )


def get_admin_profile_by_id(db: Session, admin_id: int) -> AdminProfile | None:
    """Ambil profil admin berdasarkan admin.id (bukan user_id)."""
    return (
        db.query(AdminProfile)
        .options(joinedload(AdminProfile.user))
        .filter(AdminProfile.id == admin_id)
        .first()
    )


def get_all_admin_profiles(db: Session, skip: int = 0, limit: int = 20) -> dict:
    """Ambil semua profil admin (untuk super_admin)."""
    query = db.query(AdminProfile).options(joinedload(AdminProfile.user))
    total = query.count()
    admins = query.order_by(AdminProfile.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "admins": admins}


def update_admin_profile(db: Session, user_id: int, data: AdminProfileUpdate) -> AdminProfile | None:
    """Update profil usaha admin."""
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == user_id).first()
    if not profile:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


# ============================================================
# USER PROFILE CRUD (Verifikasi Identitas)
# ============================================================

def get_or_create_user_profile(db: Session, user_id: int) -> UserProfile:
    """
    Ambil atau buat UserProfile untuk user.
    Otomatis buat jika belum ada saat pertama kali update data diri.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_user_profile(db: Session, user_id: int, data: UserProfileUpdate) -> UserProfile:
    """Update data diri penyewa."""
    profile = get_or_create_user_profile(db, user_id)
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def update_verification_status(
    db: Session,
    user_id: int,
    action: VerificationAction
) -> UserProfile | None:
    """
    Admin memperbarui status verifikasi user.
    Jika disetujui → set user.is_verified = True
    Jika ditolak → set user.is_verified = False
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        return None

    profile.status_verifikasi = action.status
    if action.catatan:
        profile.user_id = user_id  # just touch; catatan not stored in profile

    # Update flag is_verified di tabel users
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_verified = (action.status == VerificationStatus.disetujui)

    db.commit()
    db.refresh(profile)
    return profile


def get_users_pending_verification(db: Session) -> List[UserProfile]:
    """Ambil semua user yang sedang menunggu verifikasi identitas."""
    return (
        db.query(UserProfile)
        .filter(UserProfile.status_verifikasi == VerificationStatus.menunggu)
        .all()
    )


# ============================================================
# CATEGORY CRUD
# ============================================================

def create_category(db: Session, data: CategoryCreate) -> Category | None:
    """Buat kategori baru. Return None jika nama sudah ada."""
    existing = db.query(Category).filter(Category.nama == data.nama).first()
    if existing:
        return None

    category = Category(nama=data.nama, deskripsi=data.deskripsi)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_categories(db: Session) -> List[Category]:
    """Ambil semua kategori."""
    return db.query(Category).order_by(Category.nama).all()


def get_category(db: Session, category_id: int) -> Category | None:
    """Ambil satu kategori berdasarkan ID."""
    return db.query(Category).filter(Category.id == category_id).first()


def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category | None:
    """Update kategori."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> bool:
    """Hapus kategori."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return False
    db.delete(category)
    db.commit()
    return True


# ============================================================
# ITEM CRUD (Barang Sewa)
# ============================================================

def create_item(db: Session, admin_id: int, data: ItemCreate) -> Item:
    """
    Tambah barang sewa baru.
    admin_id adalah ID dari tabel admins (bukan users).
    """
    item = Item(
        admin_id=admin_id,
        category_id=data.category_id,
        nama=data.nama,
        deskripsi=data.deskripsi,
        harga_per_hari=data.harga_per_hari,
        stok=data.stok,
        foto_url=data.foto_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    # Reload dengan relasi
    return db.query(Item).options(joinedload(Item.category)).filter(Item.id == item.id).first()


def get_items(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
) -> dict:
    """
    Ambil daftar barang sewa dengan pagination, search, dan filter.
    - search: cari di nama & deskripsi
    - category_id: filter by kategori
    - admin_id: filter by penyedia (untuk admin melihat barang miliknya)
    - status: filter by status (available, rented, unavailable)
    """
    query = db.query(Item).options(joinedload(Item.category))

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Item.nama.ilike(term), Item.deskripsi.ilike(term))
        )

    if category_id:
        query = query.filter(Item.category_id == category_id)

    if admin_id:
        query = query.filter(Item.admin_id == admin_id)

    if status:
        try:
            status_enum = ItemStatus(status)
            query = query.filter(Item.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": items}


def get_item(db: Session, item_id: int) -> Item | None:
    """Ambil satu barang berdasarkan ID."""
    return (
        db.query(Item)
        .options(joinedload(Item.category))
        .filter(Item.id == item_id)
        .first()
    )


def update_item(db: Session, item_id: int, admin_id: int, data: ItemUpdate) -> Item | None:
    """
    Update barang. Hanya admin pemilik barang yang bisa update.
    Super admin bisa update semua.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None
    if item.admin_id != admin_id:
        return None  # Bukan milik admin ini

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()


def update_item_superadmin(db: Session, item_id: int, data: ItemUpdate) -> Item | None:
    """Update barang oleh super admin (tanpa cek kepemilikan)."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()


def delete_item(db: Session, item_id: int, admin_id: int) -> bool:
    """
    Hapus barang. Hanya admin pemilik barang yang bisa hapus.
    """
    item = db.query(Item).filter(Item.id == item_id, Item.admin_id == admin_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def delete_item_superadmin(db: Session, item_id: int) -> bool:
    """Hapus barang oleh super admin."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


# ============================================================
# RENTAL CRUD (Transaksi Sewa)
# ============================================================

def _calculate_total_harga(harga_per_hari: float, tanggal_mulai: date, tanggal_selesai: date) -> float:
    """Hitung total harga: harga_per_hari × jumlah hari."""
    durasi = (tanggal_selesai - tanggal_mulai).days
    return harga_per_hari * durasi


def create_rental(db: Session, user_id: int, data: RentalCreate) -> dict | None:
    """
    Buat permintaan sewa baru.
    - User harus terverifikasi
    - Barang harus available
    - Total harga dihitung otomatis
    Return dict dengan 'error' jika gagal, atau Rental object jika sukses.
    """
    # Ambil barang
    item = db.query(Item).filter(Item.id == data.item_id).first()
    if not item:
        return {"error": "Barang tidak ditemukan", "code": 404}
    if item.status != ItemStatus.available:
        return {"error": "Barang tidak tersedia untuk disewa saat ini", "code": 400}
    if item.stok <= 0:
        return {"error": "Stok barang habis", "code": 400}

    # Hitung total harga
    total_harga = _calculate_total_harga(
        item.harga_per_hari,
        data.tanggal_mulai,
        data.tanggal_selesai
    )

    rental = Rental(
        user_id=user_id,
        item_id=data.item_id,
        tanggal_mulai=data.tanggal_mulai,
        tanggal_selesai=data.tanggal_selesai,
        total_harga=total_harga,
        catatan=data.catatan,
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)

    return db.query(Rental).options(
        joinedload(Rental.item).joinedload(Item.category),
        joinedload(Rental.user)
    ).filter(Rental.id == rental.id).first()


def get_rentals(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
) -> dict:
    """
    Ambil daftar transaksi sewa dengan filter.
    - user_id: filter untuk riwayat sewa user tertentu
    - admin_id: filter barang milik admin tertentu (untuk admin melihat request masuk)
    - status: filter by status
    """
    query = db.query(Rental).options(
        joinedload(Rental.item).joinedload(Item.category),
        joinedload(Rental.user)
    )

    if user_id:
        query = query.filter(Rental.user_id == user_id)

    if admin_id:
        # Filter rental yang barangnya milik admin ini
        query = query.join(Item).filter(Item.admin_id == admin_id)

    if status:
        try:
            status_enum = RentalStatus(status)
            query = query.filter(Rental.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    rentals = query.order_by(Rental.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "rentals": rentals}


def get_rental(db: Session, rental_id: int) -> Rental | None:
    """Ambil satu transaksi sewa berdasarkan ID."""
    return (
        db.query(Rental)
        .options(
            joinedload(Rental.item).joinedload(Item.category),
            joinedload(Rental.user)
        )
        .filter(Rental.id == rental_id)
        .first()
    )


def update_rental_status(
    db: Session,
    rental_id: int,
    data: RentalStatusUpdate,
    admin_id: Optional[int] = None,
) -> Rental | None:
    """
    Update status rental.
    - admin_id: jika diisi, validasi bahwa rental ini milik admin
    - Jika status → disetujui: kurangi stok barang
    - Jika status → selesai: kembalikan stok & set item available
    - Jika status → ditolak: pastikan stok tidak berubah
    """
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        return None

    if admin_id:
        item = db.query(Item).filter(Item.id == rental.item_id).first()
        if not item or item.admin_id != admin_id:
            return None  # Rental ini bukan milik admin

    old_status = rental.status
    rental.status = data.status
    if data.catatan:
        rental.catatan = data.catatan

    # Business logic: atur stok barang sesuai perubahan status
    item = db.query(Item).filter(Item.id == rental.item_id).first()
    if item:
        if data.status == RentalStatus.disetujui and old_status == RentalStatus.pending:
            # Disetujui: kurangi stok
            item.stok = max(0, item.stok - 1)
            if item.stok == 0:
                item.status = ItemStatus.rented
        elif data.status in [RentalStatus.selesai, RentalStatus.ditolak]:
            # Selesai atau ditolak: kembalikan stok
            if old_status in [RentalStatus.disetujui, RentalStatus.sedang_disewa]:
                item.stok += 1
            if item.stok > 0:
                item.status = ItemStatus.available

    db.commit()
    db.refresh(rental)
    return db.query(Rental).options(
        joinedload(Rental.item).joinedload(Item.category),
        joinedload(Rental.user)
    ).filter(Rental.id == rental_id).first()


# ============================================================
# DASHBOARD STATS
# ============================================================

def get_platform_stats(db: Session) -> dict:
    """Statistik keseluruhan platform untuk Super Admin."""
    total_users = db.query(func.count(User.id)).filter(User.role == UserRole.user).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.admin).scalar() or 0
    total_items = db.query(func.count(Item.id)).scalar() or 0
    total_rentals = db.query(func.count(Rental.id)).scalar() or 0
    pending_rentals = db.query(func.count(Rental.id)).filter(Rental.status == RentalStatus.pending).scalar() or 0
    pending_verif = db.query(func.count(UserProfile.id)).filter(
        UserProfile.status_verifikasi == VerificationStatus.menunggu
    ).scalar() or 0
    total_revenue = db.query(func.sum(Rental.total_harga)).filter(
        Rental.status.in_([RentalStatus.selesai, RentalStatus.sedang_disewa])
    ).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_items": total_items,
        "total_rentals": total_rentals,
        "pending_rentals": pending_rentals,
        "pending_verifications": pending_verif,
        "total_revenue": round(float(total_revenue), 2),
    }