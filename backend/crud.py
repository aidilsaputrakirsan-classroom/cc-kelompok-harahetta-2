"""
crud.py — CRUD Operations Sewain
Semua operasi database untuk 7 entitas + business logic
"""

from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from models import User, AdminProfile, UserProfile, Category, Item, Rental, Payment, Review
from models import UserRole, VerificationStatus, ItemStatus, RentalStatus, PaymentStatus, PaymentMethod
from models import Wallet, Withdrawal, WithdrawalStatus
from models import PromoCode, PromoRedemption, DiscountType, PromoEligibility
from schemas import (
    UserCreate, UserUpdateByAdmin,
    AdminProfileCreate, AdminProfileUpdate,
    UserProfileCreate, UserProfileUpdate,
    CategoryCreate, CategoryUpdate,
    ItemCreate, ItemUpdate,
    RentalCreate, RentalStatusUpdate,
    VerificationAction,
    PaymentCreate, PaymentUpdate,
    ReviewCreate, ReviewUpdate,
    PromoCodeCreate, PromoCodeUpdate,
)
from auth import hash_password, verify_password


# ============================================================
# RENTAL STATUS TRANSITION RULES
# ============================================================

VALID_RENTAL_TRANSITIONS = {
    RentalStatus.pending: [RentalStatus.disetujui, RentalStatus.ditolak],
    RentalStatus.disetujui: [RentalStatus.sedang_disewa, RentalStatus.ditolak],
    RentalStatus.sedang_disewa: [RentalStatus.selesai],
    RentalStatus.selesai: [],  # final state
    RentalStatus.ditolak: [],  # final state
}


# ============================================================
# HELPER FUNCTIONS — ITEM STATUS
# ============================================================

def _recalculate_item_status(db: Session, item: Item):
    """
    Recalculate item status berdasarkan stok dan rental aktif.
    Dipanggil setiap kali stok berubah.
    
    Aturan:
    - stok > 0 → available
    - stok == 0 DAN ada rental aktif → rented
    - stok == 0 DAN tidak ada rental aktif → unavailable
    """
    if item.stok > 0:
        item.status = ItemStatus.available
    else:
        # Cek apakah ada rental aktif untuk item ini
        active_rental = db.query(Rental).filter(
            Rental.item_id == item.id,
            Rental.status.in_([
                RentalStatus.pending,
                RentalStatus.disetujui,
                RentalStatus.sedang_disewa,
            ])
        ).first()
        if active_rental:
            item.status = ItemStatus.rented
        else:
            item.status = ItemStatus.unavailable


# ============================================================
# USER CRUD
# ============================================================

def create_user(db: Session, user_data: UserCreate) -> User | None:
    """
    Buat user baru dengan password yang di-hash.
    Registrasi publik hanya untuk role 'user'.
    
    Behavior:
    - Email belum terdaftar → buat user baru
    - Email terdaftar TAPI belum verifikasi email → update data (password, nama) & izinkan daftar ulang
    - Email terdaftar DAN sudah verifikasi → return None (blok duplikat)
    """
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        # Kalau sudah verifikasi → blok daftar ulang
        if existing.email_verified_at:
            return None
        # Belum verifikasi → izinkan daftar ulang dengan update data
        existing.nama = user_data.nama
        existing.hashed_password = hash_password(user_data.password)
        db.commit()
        db.refresh(existing)
        return existing

    db_user = User(
        email=user_data.email,
        nama=user_data.nama,
        hashed_password=hash_password(user_data.password),
        role=UserRole.user,  # Force role user untuk registrasi publik
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


def create_admin_user(
    db: Session,
    email: str,
    nama: str,
    password: str,
    nama_usaha: str,
    alamat_usaha: Optional[str] = None,
    nomor_telepon: Optional[str] = None,
) -> User | None:
    """
    Buat user baru dengan role admin + auto create AdminProfile.
    Return None jika email sudah terdaftar.
    Digunakan oleh super admin untuk membuat admin baru.
    """
    # Cek email sudah ada
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return None

    # Buat user dengan role admin
    db_user = User(
        email=email,
        nama=nama,
        hashed_password=hash_password(password),
        role=UserRole.admin,
        email_verified_at=datetime.now(),  # Admin dibuat super admin → auto verified
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Buat admin profile otomatis
    admin_profile = AdminProfile(
        user_id=db_user.id,
        nama_usaha=nama_usaha,
        alamat_usaha=alamat_usaha,
        nomor_telepon=nomor_telepon,
    )
    db.add(admin_profile)
    db.commit()

    db.refresh(db_user)
    return db_user


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
        latitude=getattr(data, 'latitude', None),
        longitude=getattr(data, 'longitude', None),
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


def get_admin_stats(db: Session, admin_id: int) -> dict | None:
    """
    Ambil detail stats admin tertentu.
    Return dict dengan info profil + stats atau None jika admin tidak ditemukan.
    """
    admin_profile = get_admin_profile_by_id(db, admin_id)
    if not admin_profile:
        return None

    # Item stats
    total_items = db.query(func.count(Item.id)).filter(Item.admin_id == admin_id).scalar() or 0
    active_items = db.query(func.count(Item.id)).filter(
        Item.admin_id == admin_id,
        Item.status == ItemStatus.available
    ).scalar() or 0

    # Rental stats
    total_rentals = db.query(func.count(Rental.id)).join(Item).filter(
        Item.admin_id == admin_id
    ).scalar() or 0

    pending_rentals = db.query(func.count(Rental.id)).join(Item).filter(
        Item.admin_id == admin_id,
        Rental.status == RentalStatus.pending
    ).scalar() or 0

    approved_rentals = db.query(func.count(Rental.id)).join(Item).filter(
        Item.admin_id == admin_id,
        Rental.status == RentalStatus.disetujui
    ).scalar() or 0

    completed_rentals = db.query(func.count(Rental.id)).join(Item).filter(
        Item.admin_id == admin_id,
        Rental.status == RentalStatus.selesai
    ).scalar() or 0

    # Revenue stats
    total_revenue = db.query(func.sum(Rental.total_harga)).join(Item).filter(
        Item.admin_id == admin_id,
        Rental.status.in_([RentalStatus.selesai, RentalStatus.sedang_disewa])
    ).scalar() or 0.0

    # Monthly revenue (bulan ini)
    from datetime import datetime, timedelta
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    monthly_revenue = db.query(func.sum(Rental.total_harga)).join(Item).filter(
        Item.admin_id == admin_id,
        Rental.status.in_([RentalStatus.selesai, RentalStatus.sedang_disewa]),
        Rental.created_at >= month_start
    ).scalar() or 0.0

    # Unique customer count
    customer_count = db.query(func.count(func.distinct(Rental.user_id))).join(Item).filter(
        Item.admin_id == admin_id
    ).scalar() or 0

    return {
        "admin_id": admin_id,
        "admin_profile": admin_profile,
        "total_items": total_items,
        "active_items": active_items,
        "total_rentals": total_rentals,
        "pending_rentals": pending_rentals,
        "approved_rentals": approved_rentals,
        "completed_rentals": completed_rentals,
        "total_revenue": float(total_revenue),
        "monthly_revenue": float(monthly_revenue),
        "customer_count": customer_count,
        "joined_date": admin_profile.created_at,
    }


def update_admin_profile(db: Session, user_id: int, data: AdminProfileUpdate) -> AdminProfile | None:
    """Update profil usaha admin."""
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == user_id).first()
    if not profile:
        return None

    # Ambil semua field yang dikirim (termasuk yang None agar bisa di-clear)
    # Khusus latitude/longitude: update jika dikirim eksplisit (bukan unset)
    update_fields = data.model_dump(exclude_unset=True)
    print(f"[DEBUG] update_fields dari frontend: {update_fields}")
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
    """Update data diri penyewa. Auto-verify jika profil lengkap."""
    profile = get_or_create_user_profile(db, user_id)
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(profile, field, value)

    # Auto-verify: jika data penting sudah lengkap, langsung set verified
    if _is_profile_complete(profile):
        profile.status_verifikasi = VerificationStatus.disetujui
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_verified = True

    db.commit()
    db.refresh(profile)
    return profile


def _is_profile_complete(profile: UserProfile) -> bool:
    """Cek apakah profil user sudah lengkap untuk bisa menyewa."""
    return all([
        profile.alamat and profile.alamat.strip(),
        profile.nomor_telepon and profile.nomor_telepon.strip(),
        profile.foto_ktp and profile.foto_ktp.strip(),
        profile.foto_selfie_ktp and profile.foto_selfie_ktp.strip(),
    ])


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
    category: Optional[str] = None,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    sort_price: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
) -> dict:
    """
    Ambil daftar barang sewa dengan pagination, search, dan filter.
    - search: cari di nama & deskripsi
    - category_id: filter by ID kategori
    - category: filter by nama kategori (contoh: 'electronics')
    - admin_id: filter by penyedia (untuk admin melihat barang miliknya)
    - status: filter by status (available, rented, unavailable)
    - city: filter by kota dari alamat_usaha admin (contoh: 'Balikpapan')
    - sort_price: 'asc' (termurah) atau 'desc' (termahal)
    - price_min: harga minimum per hari
    - price_max: harga maksimum per hari
    """
    query = db.query(Item).options(joinedload(Item.category), joinedload(Item.admin))

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Item.nama.ilike(term), Item.deskripsi.ilike(term))
        )

    if category_id:
        query = query.filter(Item.category_id == category_id)

    # Filter by nama kategori (case-insensitive, partial match)
    if category:
        query = query.join(Category).filter(Category.nama.ilike(f"%{category}%"))

    if admin_id:
        query = query.filter(Item.admin_id == admin_id)

    if status:
        try:
            status_enum = ItemStatus(status)
            query = query.filter(Item.status == status_enum)
        except ValueError:
            pass

    # Price range filter
    if price_min is not None:
        query = query.filter(Item.harga_per_hari >= price_min)
    if price_max is not None:
        query = query.filter(Item.harga_per_hari <= price_max)

    # Filter by kota (parse client-side dari alamat_usaha)
    if city:
        city_norm = city.strip().lower()
        # Pre-filter: alamat_usaha mengandung nama kota (loose match di SQL)
        query = query.join(AdminProfile, Item.admin_id == AdminProfile.id).filter(
            AdminProfile.alamat_usaha.ilike(f"%{city}%")
        )
        # Strict filter di Python: cocokkan kota yang ter-extract benar-benar = city
        all_items = query.order_by(Item.created_at.desc()).all()
        filtered = [
            it for it in all_items
            if it.admin and extract_city(it.admin.alamat_usaha) and
            extract_city(it.admin.alamat_usaha).lower() == city_norm
        ]
        # Sort by price if requested
        if sort_price == "asc":
            filtered.sort(key=lambda x: x.harga_per_hari)
        elif sort_price == "desc":
            filtered.sort(key=lambda x: x.harga_per_hari, reverse=True)
        total = len(filtered)
        items = filtered[skip:skip + limit]
        return {"total": total, "items": items}

    # Sort
    if sort_price == "asc":
        order = Item.harga_per_hari.asc()
    elif sort_price == "desc":
        order = Item.harga_per_hari.desc()
    else:
        order = Item.created_at.desc()

    total = query.count()
    items = query.order_by(order).offset(skip).limit(limit).all()

    return {"total": total, "items": items}


# ────────────────────────────────────────────────────────────
# CITY EXTRACTION & LIST
# ────────────────────────────────────────────────────────────

# Province names (last segment di alamat hasil reverse geocode Nominatim)
_INDO_PROVINCES = {
    "aceh", "bali", "banten", "bengkulu", "daerah istimewa yogyakarta",
    "di yogyakarta", "yogyakarta", "dki jakarta", "jakarta", "gorontalo",
    "jambi", "jawa barat", "jawa tengah", "jawa timur", "kalimantan barat",
    "kalimantan selatan", "kalimantan tengah", "kalimantan timur",
    "kalimantan utara", "kepulauan bangka belitung", "kepulauan riau",
    "lampung", "maluku", "maluku utara", "nusa tenggara barat",
    "nusa tenggara timur", "papua", "papua barat", "papua barat daya",
    "papua pegunungan", "papua selatan", "papua tengah", "riau",
    "sulawesi barat", "sulawesi selatan", "sulawesi tengah",
    "sulawesi tenggara", "sulawesi utara", "sumatera barat",
    "sumatera selatan", "sumatera utara", "indonesia",
}


def extract_city(alamat: Optional[str]) -> Optional[str]:
    """
    Ekstrak nama kota dari alamat usaha.
    Format alamat dari Nominatim biasanya:
        road, [house_no], suburb, district, city, state
    Strategi:
      1. Split by koma, trim, drop kosong
      2. Strip prefix 'Kota '/'Kabupaten '/'Kab. '
      3. Drop segment yang termasuk nama provinsi atau 'Indonesia'
      4. Ambil segment terakhir setelah filter (kota biasanya before-last)
    """
    if not alamat:
        return None
    parts = [p.strip() for p in alamat.split(",") if p.strip()]
    if not parts:
        return None

    cleaned = []
    for p in parts:
        low = p.lower()
        # Skip kode pos murni
        if low.replace(" ", "").isdigit():
            continue
        # Skip provinsi & 'Indonesia'
        if low in _INDO_PROVINCES:
            continue
        # Strip prefix umum kota/kabupaten
        for prefix in ("kota ", "kabupaten ", "kab. ", "kab "):
            if low.startswith(prefix):
                p = p[len(prefix):].strip()
                low = p.lower()
                break
        cleaned.append(p)

    if not cleaned:
        return None
    # Setelah membuang provinsi, kota = segment terakhir yang tersisa
    return cleaned[-1]


def get_item_cities(db: Session) -> List[str]:
    """
    List unik kota dari admin yang punya minimal 1 item aktif (status != unavailable).
    Diurutkan alfabet.
    """
    rows = (
        db.query(AdminProfile.alamat_usaha)
        .join(Item, Item.admin_id == AdminProfile.id)
        .filter(AdminProfile.alamat_usaha.isnot(None))
        .filter(Item.status != ItemStatus.unavailable)
        .distinct()
        .all()
    )
    cities = set()
    for (alamat,) in rows:
        city = extract_city(alamat)
        if city:
            cities.add(city)
    return sorted(cities, key=lambda x: x.lower())


def get_item(db: Session, item_id: int) -> Item | None:
    """Ambil satu barang berdasarkan ID."""
    return (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.admin))
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
    
    # Jika admin eksplisit set status, simpan dulu dan jangan recalculate
    explicit_status = update_fields.pop("status", None)
    
    for field, value in update_fields.items():
        setattr(item, field, value)

    # Recalculate hanya jika stok berubah DAN admin TIDAK set status manual
    if "stok" in update_fields and explicit_status is None:
        _recalculate_item_status(db, item)
    
    # Jika admin eksplisit set status, terapkan terakhir (override apapun)
    if explicit_status is not None:
        item.status = explicit_status

    db.commit()
    db.refresh(item)
    return db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()


def update_item_superadmin(db: Session, item_id: int, data: ItemUpdate) -> Item | None:
    """Update barang oleh super admin (tanpa cek kepemilikan)."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    
    explicit_status = update_fields.pop("status", None)
    
    for field, value in update_fields.items():
        setattr(item, field, value)

    if "stok" in update_fields and explicit_status is None:
        _recalculate_item_status(db, item)
    
    if explicit_status is not None:
        item.status = explicit_status

    db.commit()
    db.refresh(item)
    return db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()


def delete_item(db: Session, item_id: int, admin_id: int) -> bool:
    """
    Hapus atau nonaktifkan barang.
    - Jika ada rental aktif (pending/disetujui/sedang_disewa) yang pembayarannya
      belum failed/cancelled: soft-delete (nonaktifkan).
    - Jika tidak ada rental aktif: hapus permanen (termasuk rental & payment terkait).
    """
    item = db.query(Item).filter(Item.id == item_id, Item.admin_id == admin_id).first()
    if not item:
        return False
    from models import Rental, RentalStatus, Payment, PaymentStatus
    active_rentals = db.query(Rental).outerjoin(Payment, Payment.rental_id == Rental.id).filter(
        Rental.item_id == item_id,
        Rental.status.in_([RentalStatus.pending, RentalStatus.disetujui, RentalStatus.sedang_disewa]),
        or_(
            Payment.id.is_(None),
            Payment.status.notin_([PaymentStatus.failed, PaymentStatus.cancelled]),
        ),
    ).first()
    if active_rentals:
        # Ada proses sewa berjalan → nonaktifkan saja
        item.status = "unavailable"
        item.stok = 0
        db.commit()
    else:
        # Tidak ada proses aktif → hapus permanen beserta rental & payment terkait
        rentals = db.query(Rental).filter(Rental.item_id == item_id).all()
        for rental in rentals:
            db.query(Payment).filter(Payment.rental_id == rental.id).delete()
            db.delete(rental)
        db.delete(item)
        db.commit()
    return True


def delete_item_superadmin(db: Session, item_id: int) -> bool:
    """
    Hapus atau nonaktifkan barang oleh super admin.
    - Jika ada rental aktif (pending/disetujui/sedang_disewa) yang pembayarannya
      belum failed/cancelled: soft-delete (nonaktifkan).
    - Jika tidak ada rental aktif: hapus permanen (termasuk rental & payment terkait).
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return False
    from models import Rental, RentalStatus, Payment, PaymentStatus
    active_rentals = db.query(Rental).outerjoin(Payment, Payment.rental_id == Rental.id).filter(
        Rental.item_id == item_id,
        Rental.status.in_([RentalStatus.pending, RentalStatus.disetujui, RentalStatus.sedang_disewa]),
        or_(
            Payment.id.is_(None),
            Payment.status.notin_([PaymentStatus.failed, PaymentStatus.cancelled]),
        ),
    ).first()
    if active_rentals:
        # Ada proses sewa berjalan → nonaktifkan saja
        item.status = "unavailable"
        item.stok = 0
        db.commit()
    else:
        # Tidak ada proses aktif → hapus permanen beserta rental & payment terkait
        rentals = db.query(Rental).filter(Rental.item_id == item_id).all()
        for rental in rentals:
            db.query(Payment).filter(Payment.rental_id == rental.id).delete()
            db.delete(rental)
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
    - Stok langsung dikurangi saat rental dibuat (reservasi)
    - Total harga dihitung otomatis
    - Jika promo_code disertakan: divalidasi & diterapkan (max diskon = max_discount)
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

    # Hitung subtotal sebelum diskon
    original_amount = _calculate_total_harga(
        item.harga_per_hari,
        data.tanggal_mulai,
        data.tanggal_selesai
    )

    # ── Validasi promo (jika ada)
    promo: PromoCode | None = None
    discount_amount = 0.0
    if data.promo_code:
        validation = _validate_promo_logic(
            db=db,
            user_id=user_id,
            code=data.promo_code,
            original_amount=original_amount,
        )
        if not validation["valid"]:
            return {"error": validation["message"], "code": 400}
        promo = validation["promo"]
        discount_amount = validation["discount_amount"]

    final_amount = max(0.0, original_amount - discount_amount)

    rental = Rental(
        user_id=user_id,
        item_id=data.item_id,
        tanggal_mulai=data.tanggal_mulai,
        tanggal_selesai=data.tanggal_selesai,
        total_harga=final_amount,
        original_amount=original_amount,
        discount_amount=discount_amount if promo else 0.0,
        promo_code_id=promo.id if promo else None,
        catatan=data.catatan,
    )
    db.add(rental)

    # Reservasi: kurangi stok saat rental dibuat
    item.stok = max(0, item.stok - 1)
    _recalculate_item_status(db, item)

    db.flush()  # dapatkan rental.id sebelum commit

    # ── Catat redemption + increment counter promo
    if promo:
        redemption = PromoRedemption(
            promo_code_id=promo.id,
            user_id=user_id,
            rental_id=rental.id,
            original_amount=original_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
        )
        db.add(redemption)
        promo.used_count = (promo.used_count or 0) + 1

    db.commit()
    db.refresh(rental)

    return db.query(Rental).options(
        joinedload(Rental.item).joinedload(Item.category),
        joinedload(Rental.user),
        joinedload(Rental.promo_code),
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
        joinedload(Rental.user),
        joinedload(Rental.promo_code),
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
            joinedload(Rental.user),
            joinedload(Rental.promo_code),
        )
        .filter(Rental.id == rental_id)
        .first()
    )


def update_rental_status(
    db: Session,
    rental_id: int,
    data: RentalStatusUpdate,
    admin_id: Optional[int] = None,
) -> Rental | None | dict:
    """
    Update status rental dengan validasi transisi.
    - admin_id: jika diisi, validasi bahwa rental ini milik admin
    - Jika status → disetujui: kurangi stok barang
    - Jika status → selesai: kembalikan stok & set item available
    - Jika status → ditolak: pastikan stok tidak berubah
    
    Return dict dengan key "error" jika transisi tidak valid.
    """
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        return None

    if admin_id:
        item = db.query(Item).filter(Item.id == rental.item_id).first()
        if not item or item.admin_id != admin_id:
            return None  # Rental ini bukan milik admin

    old_status = rental.status
    
    # Validasi transisi status
    allowed_transitions = VALID_RENTAL_TRANSITIONS.get(old_status, [])
    if data.status not in allowed_transitions:
        return {
            "error": f"Tidak dapat mengubah status dari '{old_status.value}' ke '{data.status.value}'. Transisi tidak valid."
        }
    
    rental.status = data.status
    if data.catatan:
        rental.catatan = data.catatan

    # Business logic: atur stok barang sesuai perubahan status
    item = db.query(Item).filter(Item.id == rental.item_id).first()
    if item:
        if data.status == RentalStatus.disetujui and old_status == RentalStatus.pending:
            # Stok sudah dikurangi saat rental dibuat (pending), tidak perlu kurangi lagi.

            # Set batas waktu pembayaran: 24 jam dari sekarang
            from datetime import datetime, timezone, timedelta
            rental.payment_deadline = datetime.now(timezone.utc) + timedelta(hours=24)

            # Auto-create payment saat rental disetujui
            create_payment_auto(db=db, rental_id=rental_id)
            
            # ── Snapshot alamat pickup dari profil admin
            admin_profile = db.query(AdminProfile).filter(
                AdminProfile.id == item.admin_id
            ).first()
            if admin_profile:
                rental.pickup_alamat = admin_profile.alamat_usaha
                rental.pickup_latitude = admin_profile.latitude
                rental.pickup_longitude = admin_profile.longitude
                rental.pickup_nama_usaha = admin_profile.nama_usaha
                rental.pickup_telepon = admin_profile.nomor_telepon
            
        elif data.status in [RentalStatus.selesai, RentalStatus.ditolak]:
            # Selesai atau ditolak: kembalikan stok yang ter-reservasi
            if old_status in [
                RentalStatus.pending,
                RentalStatus.disetujui,
                RentalStatus.sedang_disewa,
            ]:
                item.stok += 1
            _recalculate_item_status(db, item)

            # Jika ditolak, batalkan juga payment yang masih pending
            if data.status == RentalStatus.ditolak:
                pending_payment = db.query(Payment).filter(
                    Payment.rental_id == rental_id,
                    Payment.status == PaymentStatus.pending,
                ).first()
                if pending_payment:
                    pending_payment.status = PaymentStatus.cancelled

            # Jika selesai & payment sudah completed → tambah saldo wallet admin
            if data.status == RentalStatus.selesai:
                payment_check = db.query(Payment).filter(
                    Payment.rental_id == rental_id,
                    Payment.status == PaymentStatus.completed,
                ).first()
                if payment_check:
                    add_wallet_balance(db, item.admin_id, payment_check.jumlah)

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


# ============================================================
# PAYMENT CRUD (Pembayaran Sewa)
# ============================================================

def create_payment_auto(
    db: Session,
    rental_id: int,
) -> Payment | None:
    """
    Auto-create payment saat rental disetujui.
    Dipanggil otomatis saat rental status diubah ke 'disetujui'.
    """
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        return None

    # Cek apakah sudah ada payment
    existing = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if existing:
        return existing

    # Cari admin dari item
    item = db.query(Item).filter(Item.id == rental.item_id).first()
    if not item:
        return None

    payment = Payment(
        rental_id=rental_id,
        user_id=rental.user_id,
        admin_id=item.admin_id,
        jumlah=rental.total_harga,
        metode_pembayaran=PaymentMethod.midtrans,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def create_payment(
    db: Session,
    rental_id: int,
    data: PaymentCreate,
) -> Payment | None:
    """Buat pembayaran baru untuk rental. Jika sudah ada, return yang existing."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        return None

    # Jika payment sudah ada untuk rental ini, return yang existing
    existing = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if existing:
        return db.query(Payment).options(
            joinedload(Payment.rental).joinedload(Rental.item),
            joinedload(Payment.user)
        ).filter(Payment.id == existing.id).first()

    # Cari admin dari item
    item = db.query(Item).filter(Item.id == rental.item_id).first()
    if not item:
        return None

    payment = Payment(
        rental_id=rental_id,
        user_id=rental.user_id,
        admin_id=item.admin_id,
        jumlah=rental.total_harga,
        metode_pembayaran=data.metode_pembayaran,
        status=PaymentStatus.pending,
        catatan=data.catatan,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return db.query(Payment).options(
        joinedload(Payment.rental).joinedload(Rental.item),
        joinedload(Payment.user)
    ).filter(Payment.id == payment.id).first()


def get_payment(db: Session, payment_id: int) -> Payment | None:
    """Ambil satu pembayaran berdasarkan ID."""
    return (
        db.query(Payment)
        .options(
            joinedload(Payment.rental).joinedload(Rental.item),
            joinedload(Payment.user)
        )
        .filter(Payment.id == payment_id)
        .first()
    )


def get_payment_by_rental(db: Session, rental_id: int) -> Payment | None:
    """Ambil pembayaran berdasarkan rental_id."""
    return (
        db.query(Payment)
        .options(
            joinedload(Payment.rental).joinedload(Rental.item),
            joinedload(Payment.user)
        )
        .filter(Payment.rental_id == rental_id)
        .first()
    )


def get_payments(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
) -> dict:
    """
    Ambil daftar pembayaran dengan filter.
    - user_id: filter pembayaran user tertentu
    - admin_id: filter pembayaran untuk admin tertentu
    - status: filter by status (pending, completed, failed, cancelled)
    """
    query = db.query(Payment).options(
        joinedload(Payment.rental).joinedload(Rental.item),
        joinedload(Payment.user)
    )

    if user_id:
        query = query.filter(Payment.user_id == user_id)

    if admin_id:
        query = query.filter(Payment.admin_id == admin_id)

    if status:
        try:
            status_enum = PaymentStatus(status)
            query = query.filter(Payment.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "payments": payments}


def update_payment_status(
    db: Session,
    payment_id: int,
    data: PaymentUpdate,
) -> Payment | None:
    """
    Update status pembayaran (confirm payment, etc).
    Auto-update rental status ke 'sedang_disewa' jika payment completed.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    old_status = payment.status
    payment.status = data.status

    if data.bukti_pembayaran:
        payment.bukti_pembayaran = data.bukti_pembayaran

    if data.catatan:
        payment.catatan = data.catatan

    if data.status == PaymentStatus.completed:
        payment.tanggal_pembayaran = datetime.now()

        # Rental TIDAK otomatis pindah ke sedang_disewa.
        # Admin tetap harus klik "Proses Sewa" di dashboard setelah
        # barang benar-benar diambil user.

    # Jika pembayaran ditolak/dibatalkan → otomatis tolak rental
    # dan kembalikan stok agar barang tidak tertahan sebagai "rental aktif".
    if data.status in (PaymentStatus.failed, PaymentStatus.cancelled) and old_status != data.status:
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental and rental.status in (RentalStatus.pending, RentalStatus.disetujui):
            old_rental_status = rental.status
            rental.status = RentalStatus.ditolak
            item = db.query(Item).filter(Item.id == rental.item_id).first()
            if item:
                # Stok di-reservasi sejak rental dibuat (pending),
                # jadi kembalikan untuk pending atau disetujui.
                if old_rental_status in (RentalStatus.pending, RentalStatus.disetujui):
                    item.stok += 1
                _recalculate_item_status(db, item)

    db.commit()
    db.refresh(payment)
    return db.query(Payment).options(
        joinedload(Payment.rental).joinedload(Rental.item),
        joinedload(Payment.user)
    ).filter(Payment.id == payment_id).first()


def get_admin_payment_stats(db: Session, admin_id: int) -> dict:
    """Ambil statistik pembayaran untuk admin tertentu."""
    total_payments = db.query(func.count(Payment.id)).filter(
        Payment.admin_id == admin_id
    ).scalar() or 0

    completed_payments = db.query(func.count(Payment.id)).filter(
        Payment.admin_id == admin_id,
        Payment.status == PaymentStatus.completed
    ).scalar() or 0

    pending_payments = db.query(func.count(Payment.id)).filter(
        Payment.admin_id == admin_id,
        Payment.status == PaymentStatus.pending
    ).scalar() or 0

    total_received = db.query(func.sum(Payment.jumlah)).filter(
        Payment.admin_id == admin_id,
        Payment.status == PaymentStatus.completed
    ).scalar() or 0.0

    total_pending = db.query(func.sum(Payment.jumlah)).filter(
        Payment.admin_id == admin_id,
        Payment.status == PaymentStatus.pending
    ).scalar() or 0.0

    return {
        "total_payments": total_payments,
        "completed_payments": completed_payments,
        "pending_payments": pending_payments,
        "total_received": round(float(total_received), 2),
        "total_pending": round(float(total_pending), 2),
    }


    #ada  penambahan fitur baru yaitu rental status transition


# ============================================================
# MIDTRANS PAYMENT GATEWAY
# ============================================================

def _is_snap_token_still_valid(payment: Payment) -> bool:
    """
    Heuristik: Snap token Midtrans default expired 24 jam setelah dibuat.
    Kita anggap masih valid kalau payment.updated_at < 20 jam yang lalu
    (buffer 4 jam biar tidak mepet).
    """
    if not payment.snap_token or not payment.updated_at:
        return False
    from datetime import timezone
    now = datetime.now(tz=timezone.utc)
    updated = payment.updated_at
    if updated.tzinfo is None:
        updated = updated.replace(tzinfo=timezone.utc)
    age = (now - updated).total_seconds()
    return age < (20 * 3600)


def create_or_get_snap_charge(
    db: Session,
    *,
    rental_id: int,
    user_id: int,
) -> dict | None:
    """
    Pastikan ada Payment row untuk rental ini, lalu generate/reuse Snap token.

    Preconditions:
      - Rental milik user_id
      - Rental.status = disetujui
      - Payment.status BUKAN completed (idempoten: kalau sudah lunas, return None)

    Return dict:
      {
        "payment": Payment,
        "order_id": str,
        "snap_token": str,
        "redirect_url": str,
      }
    atau dict {"error": "...", "code": int} kalau gagal.
    """
    import midtrans_service

    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        return {"error": "Rental tidak ditemukan", "code": 404}
    if rental.user_id != user_id:
        return {"error": "Rental ini bukan milik Anda", "code": 403}
    if rental.status != RentalStatus.disetujui:
        return {
            "error": (
                "Rental belum disetujui admin. "
                "Anda hanya bisa membayar setelah admin menyetujui permintaan sewa."
            ),
            "code": 400,
        }

    # Cek apakah batas waktu pembayaran 24 jam sudah lewat
    from datetime import datetime, timezone
    if rental.payment_deadline and datetime.now(timezone.utc) > rental.payment_deadline:
        # Auto-cancel: batas waktu pembayaran terlampaui
        rental.status = RentalStatus.ditolak
        item = db.query(Item).filter(Item.id == rental.item_id).first()
        if item:
            item.stok += 1
            _recalculate_item_status(db, item)
        pending_pay = db.query(Payment).filter(
            Payment.rental_id == rental_id, Payment.status == PaymentStatus.pending
        ).first()
        if pending_pay:
            pending_pay.status = PaymentStatus.failed
            pending_pay.catatan = "Expired — batas waktu pembayaran 24 jam terlampaui"
        db.commit()
        return {"error": "Batas waktu pembayaran (24 jam) telah terlampaui. Silakan buat pesanan baru.", "code": 400}

    # Ambil/buat payment
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if not payment:
        # Safety net: harusnya sudah di-create saat rental disetujui, tapi
        # data lama / edge case bisa bikin row payment belum ada.
        item_for_admin = db.query(Item).filter(Item.id == rental.item_id).first()
        if not item_for_admin:
            return {"error": "Item terkait rental tidak ditemukan", "code": 404}
        payment = Payment(
            rental_id=rental_id,
            user_id=rental.user_id,
            admin_id=item_for_admin.admin_id,
            jumlah=rental.total_harga,
            metode_pembayaran=PaymentMethod.midtrans,
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    if payment.status == PaymentStatus.completed:
        return {"error": "Pembayaran sudah lunas", "code": 400}

    # Idempotensi: reuse token kalau masih fresh
    if payment.snap_token and _is_snap_token_still_valid(payment):
        return {
            "payment": payment,
            "order_id": payment.midtrans_order_id,
            "snap_token": payment.snap_token,
            "redirect_url": payment.snap_redirect_url or "",
        }

    # Generate order_id baru + panggil Midtrans
    order_id = midtrans_service.build_order_id(rental_id)

    # Ambil data item & user untuk payload Midtrans
    item = db.query(Item).filter(Item.id == rental.item_id).first()
    user = db.query(User).filter(User.id == rental.user_id).first()
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == rental.user_id).first()
    phone = user_profile.nomor_telepon if user_profile else None

    days = max(1, (rental.tanggal_selesai - rental.tanggal_mulai).days)
    try:
        snap_resp = midtrans_service.create_snap_transaction(
            order_id=order_id,
            gross_amount=int(round(rental.total_harga)),
            item_name=(item.nama if item else f"Sewa #{rental_id}"),
            item_qty_days=days,
            price_per_day=int(round(item.harga_per_hari)) if item else int(round(rental.total_harga)),
            customer_name=user.nama if user else "Customer",
            customer_email=user.email if user else "noemail@sewain.local",
            customer_phone=phone,
        )
    except Exception as e:  # noqa: BLE001
        return {"error": f"Gagal membuat transaksi Midtrans: {e}", "code": 502}

    # Simpan ke payment
    payment.midtrans_order_id = order_id
    payment.snap_token = snap_resp["token"]
    payment.snap_redirect_url = snap_resp["redirect_url"]
    payment.metode_pembayaran = PaymentMethod.midtrans
    payment.status = PaymentStatus.pending  # reset ke pending kalau sebelumnya failed/cancelled
    db.commit()
    db.refresh(payment)

    return {
        "payment": payment,
        "order_id": order_id,
        "snap_token": snap_resp["token"],
        "redirect_url": snap_resp["redirect_url"],
    }


def apply_midtrans_notification(db: Session, notification: dict) -> dict:
    """
    Handler webhook Midtrans — dipanggil dari endpoint HTTP.
    Wajib verifikasi signature SEBELUM memanggil fungsi ini.

    Return dict ringkas untuk logging:
      { "ok": bool, "payment_id": int|None, "new_status": str|None, "reason": str|None }
    """
    import json as _json
    import midtrans_service

    order_id = notification.get("order_id")
    if not order_id:
        return {"ok": False, "reason": "order_id kosong"}

    payment = db.query(Payment).filter(Payment.midtrans_order_id == order_id).first()
    if not payment:
        return {"ok": False, "reason": f"Payment dengan order_id {order_id} tidak ditemukan"}

    # Map status
    new_status = midtrans_service.map_midtrans_status(
        notification.get("transaction_status"),
        notification.get("fraud_status"),
    )

    # Update fields
    payment.status = new_status
    payment.midtrans_transaction_id = notification.get("transaction_id") or payment.midtrans_transaction_id
    payment.payment_channel = notification.get("payment_type") or payment.payment_channel
    payment.fraud_status = notification.get("fraud_status") or payment.fraud_status
    try:
        payment.raw_notification = _json.dumps(notification, ensure_ascii=False)[:4000]
    except (TypeError, ValueError):
        payment.raw_notification = str(notification)[:4000]

    # Kalau sukses: set tanggal bayar (rental TIDAK otomatis pindah ke
    # sedang_disewa — admin tetap harus klik "Proses Sewa" setelah barang
    # benar-benar diambil oleh user)
    if new_status == PaymentStatus.completed:
        if payment.tanggal_pembayaran is None:
            payment.tanggal_pembayaran = datetime.now()

    db.commit()
    db.refresh(payment)

    return {
        "ok": True,
        "payment_id": payment.id,
        "new_status": new_status.value,
        "reason": None,
    }


def sync_payment_from_midtrans(db: Session, payment_id: int) -> Payment | None | dict:
    """
    Fallback kalau webhook tidak sampai: tarik status dari Midtrans lalu
    reuse logic apply_midtrans_notification.
    Juga cek apakah payment sudah expired.
    """
    import midtrans_service
    from datetime import datetime, timezone

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None
    if not payment.midtrans_order_id:
        return {"error": "Payment ini belum punya order_id Midtrans", "code": 400}

    # Cek apakah sudah expired (lokal)
    if (
        payment.status == PaymentStatus.pending
        and payment.expires_at
        and datetime.now(timezone.utc) > payment.expires_at
    ):
        payment.status = PaymentStatus.failed
        payment.catatan = "Pembayaran expired — batas waktu 30 menit terlampaui"
        # Kembalikan stok item
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental:
            rental.status = RentalStatus.ditolak
            item = db.query(Item).filter(Item.id == rental.item_id).first()
            if item:
                item.stok += 1
                _recalculate_item_status(db, item)
        db.commit()
        db.refresh(payment)
        return payment

    try:
        status_resp = midtrans_service.fetch_transaction_status(payment.midtrans_order_id)
    except Exception as e:  # noqa: BLE001
        return {"error": f"Gagal query status ke Midtrans: {e}", "code": 502}

    # status_resp sudah berbentuk dict yang sama dgn webhook payload
    apply_midtrans_notification(db, status_resp)
    db.refresh(payment)
    return payment



# ============================================================
# WALLET & WITHDRAWAL CRUD
# ============================================================

from schemas import WithdrawalCreate, WithdrawalActionByAdmin


def get_or_create_wallet(db: Session, admin_id: int) -> Wallet:
    """Ambil atau buat wallet untuk admin. Auto-create jika belum ada."""
    wallet = db.query(Wallet).filter(Wallet.admin_id == admin_id).first()
    if not wallet:
        wallet = Wallet(admin_id=admin_id, saldo=0.0, total_pendapatan=0.0, total_withdrawn=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def add_wallet_balance(db: Session, admin_id: int, amount: float) -> Wallet:
    """
    Tambah saldo wallet admin setelah rental selesai.
    Dipanggil saat rental status berubah ke 'selesai' DAN payment sudah completed.
    """
    wallet = get_or_create_wallet(db, admin_id)
    wallet.saldo += amount
    wallet.total_pendapatan += amount
    db.commit()
    db.refresh(wallet)
    return wallet


def get_wallet_transactions(db: Session, admin_id: int, skip: int = 0, limit: int = 20) -> dict:
    """
    Ambil riwayat transaksi masuk ke wallet (dari rental yang selesai).
    Berdasarkan payments yang completed untuk admin ini.
    """
    query = (
        db.query(Payment)
        .options(
            joinedload(Payment.rental).joinedload(Rental.item),
            joinedload(Payment.user)
        )
        .filter(
            Payment.admin_id == admin_id,
            Payment.status == PaymentStatus.completed,
        )
    )
    total = query.count()
    payments = query.order_by(Payment.tanggal_pembayaran.desc()).offset(skip).limit(limit).all()

    transactions = []
    for p in payments:
        transactions.append({
            "rental_id": p.rental_id,
            "item_nama": p.rental.item.nama if p.rental and p.rental.item else "Unknown",
            "jumlah": p.jumlah,
            "tanggal": p.tanggal_pembayaran or p.created_at,
            "penyewa": p.user.nama if p.user else "Unknown",
        })

    return {"total": total, "transactions": transactions}


def create_withdrawal(db: Session, admin_id: int, data: WithdrawalCreate) -> dict | Withdrawal:
    """
    Buat request withdrawal dari wallet admin.
    Validasi: saldo harus cukup, minimal WD Rp 50.000.
    """
    MIN_WITHDRAWAL = 50000.0

    wallet = get_or_create_wallet(db, admin_id)

    if data.jumlah < MIN_WITHDRAWAL:
        return {"error": f"Minimal penarikan Rp {int(MIN_WITHDRAWAL):,}", "code": 400}

    if data.jumlah > wallet.saldo:
        return {"error": f"Saldo tidak cukup. Saldo saat ini: Rp {wallet.saldo:,.0f}", "code": 400}

    # Kurangi saldo langsung (hold)
    wallet.saldo -= data.jumlah

    withdrawal = Withdrawal(
        wallet_id=wallet.id,
        admin_id=admin_id,
        jumlah=data.jumlah,
        bank_name=data.bank_name,
        account_number=data.account_number,
        account_holder=data.account_holder,
        status=WithdrawalStatus.pending,
        catatan=data.catatan,
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def get_withdrawals(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
) -> dict:
    """Ambil daftar withdrawal dengan filter."""
    query = db.query(Withdrawal)

    if admin_id:
        query = query.filter(Withdrawal.admin_id == admin_id)

    if status:
        try:
            status_enum = WithdrawalStatus(status)
            query = query.filter(Withdrawal.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    withdrawals = query.order_by(Withdrawal.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "withdrawals": withdrawals}


def get_withdrawal(db: Session, withdrawal_id: int) -> Withdrawal | None:
    """Ambil satu withdrawal berdasarkan ID."""
    return db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()


def update_withdrawal_status(
    db: Session,
    withdrawal_id: int,
    data: WithdrawalActionByAdmin,
) -> Withdrawal | None | dict:
    """
    Super admin memproses withdrawal.
    - pending → processing: sedang diproses (1-3 hari)
    - processing → completed: uang sudah ditransfer
    - pending/processing → rejected: ditolak, saldo dikembalikan
    """
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not withdrawal:
        return None

    old_status = withdrawal.status

    # Validasi transisi
    valid_transitions = {
        WithdrawalStatus.pending: [WithdrawalStatus.processing, WithdrawalStatus.rejected],
        WithdrawalStatus.processing: [WithdrawalStatus.completed, WithdrawalStatus.rejected],
        WithdrawalStatus.completed: [],
        WithdrawalStatus.rejected: [],
    }

    if data.status not in valid_transitions.get(old_status, []):
        return {
            "error": f"Tidak dapat mengubah status dari '{old_status.value}' ke '{data.status.value}'",
            "code": 400,
        }

    withdrawal.status = data.status

    if data.catatan:
        withdrawal.catatan = data.catatan

    if data.status == WithdrawalStatus.rejected:
        withdrawal.rejected_reason = data.rejected_reason
        # Kembalikan saldo ke wallet
        wallet = db.query(Wallet).filter(Wallet.id == withdrawal.wallet_id).first()
        if wallet:
            wallet.saldo += withdrawal.jumlah

    if data.status == WithdrawalStatus.completed:
        withdrawal.completed_at = datetime.now()
        # Update total_withdrawn di wallet
        wallet = db.query(Wallet).filter(Wallet.id == withdrawal.wallet_id).first()
        if wallet:
            wallet.total_withdrawn += withdrawal.jumlah

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


# ============================================================
# REVIEW / TESTIMONI CRUD
# ============================================================

def _serialize_review(rv: Review) -> dict:
    """
    Bentuk dict yang siap di-validate ke ReviewResponse.
    Mengisi field denormalized (user_nama, foto, item_nama, foto) jika relasi sudah di-load.
    """
    user = rv.user
    item = rv.item
    return {
        "id": rv.id,
        "rental_id": rv.rental_id,
        "user_id": rv.user_id,
        "item_id": rv.item_id,
        "admin_id": rv.admin_id,
        "rating": rv.rating,
        "komentar": rv.komentar,
        "created_at": rv.created_at,
        "updated_at": rv.updated_at,
        "user_nama": user.nama if user else None,
        "user_foto_profil": user.foto_profil if user else None,
        "item_nama": item.nama if item else None,
        "item_foto_url": item.foto_url if item else None,
    }


def _build_summary(rows: list[tuple[int, int]], avg_total: tuple[float, int] | None = None) -> dict:
    """
    Bentuk dict summary {average, total, distribution} dari rows (rating, count).
    avg_total opsional supaya pemanggil bisa pakai 1 query agregat tunggal.
    """
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    total = 0
    weighted = 0
    for rating, count in rows:
        if rating is None:
            continue
        distribution[str(int(rating))] = int(count)
        total += int(count)
        weighted += int(rating) * int(count)
    if avg_total is not None:
        avg, tot = avg_total
        if tot:
            return {
                "average": round(float(avg or 0.0), 2),
                "total": int(tot or 0),
                "distribution": distribution,
            }
    average = round(weighted / total, 2) if total else 0.0
    return {"average": average, "total": total, "distribution": distribution}


def _summary_for_filter(db: Session, *, item_id: int | None = None, admin_id: int | None = None) -> dict:
    """Hitung summary review berdasarkan filter item_id atau admin_id."""
    q = db.query(Review.rating, func.count(Review.id))
    if item_id is not None:
        q = q.filter(Review.item_id == item_id)
    if admin_id is not None:
        q = q.filter(Review.admin_id == admin_id)
    rows = q.group_by(Review.rating).all()
    return _build_summary(rows)


def get_review_by_rental(db: Session, rental_id: int) -> Review | None:
    """Ambil review (jika ada) untuk rental tertentu."""
    return (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.item))
        .filter(Review.rental_id == rental_id)
        .first()
    )


def get_review_by_id(db: Session, review_id: int) -> Review | None:
    return (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.item))
        .filter(Review.id == review_id)
        .first()
    )


def create_review_for_rental(
    db: Session,
    *,
    user_id: int,
    rental_id: int,
    data: ReviewCreate,
) -> tuple[Review | None, str | None]:
    """
    Buat review untuk rental. Mengembalikan (review, error_msg).

    Validasi:
    - Rental ada & milik user
    - Rental status == selesai
    - Belum ada review untuk rental ini
    """
    rental = db.query(Rental).options(joinedload(Rental.item)).filter(Rental.id == rental_id).first()
    if not rental:
        return None, "Rental tidak ditemukan"
    if rental.user_id != user_id:
        return None, "Rental ini bukan milik Anda"
    if rental.status != RentalStatus.selesai:
        return None, "Hanya rental yang sudah selesai yang bisa direview"

    existing = db.query(Review).filter(Review.rental_id == rental_id).first()
    if existing:
        return None, "Rental ini sudah pernah direview"

    item = rental.item
    if not item:
        return None, "Barang tidak ditemukan"

    review = Review(
        rental_id=rental.id,
        user_id=user_id,
        item_id=item.id,
        admin_id=item.admin_id,
        rating=int(data.rating),
        komentar=(data.komentar.strip() if data.komentar else None),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    # Reload dengan relasi
    return get_review_by_id(db, review.id), None


def update_review(
    db: Session,
    *,
    review_id: int,
    user_id: int,
    is_admin: bool,
    data: ReviewUpdate,
) -> tuple[Review | None, str | None]:
    """
    Update review. Pemilik bisa edit; super_admin/admin bisa edit untuk moderasi.
    Pemilik dibatasi 7 hari sejak created_at.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        return None, "Review tidak ditemukan"
    if not is_admin and review.user_id != user_id:
        return None, "Anda bukan pemilik review ini"
    if not is_admin and review.created_at:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        created = review.created_at if review.created_at.tzinfo else review.created_at.replace(tzinfo=timezone.utc)
        if (now - created).days > 7:
            return None, "Review hanya bisa diubah dalam 7 hari setelah dibuat"

    if data.rating is not None:
        review.rating = int(data.rating)
    if data.komentar is not None:
        review.komentar = data.komentar.strip() or None

    db.commit()
    db.refresh(review)
    return get_review_by_id(db, review.id), None


def delete_review(
    db: Session,
    *,
    review_id: int,
    user_id: int,
    is_admin: bool,
) -> tuple[bool, str | None]:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        return False, "Review tidak ditemukan"
    if not is_admin and review.user_id != user_id:
        return False, "Anda bukan pemilik review ini"
    db.delete(review)
    db.commit()
    return True, None


def get_reviews_by_item(
    db: Session,
    item_id: int,
    skip: int = 0,
    limit: int = 20,
) -> dict:
    """Ambil daftar review untuk item tertentu + summary."""
    base = db.query(Review).filter(Review.item_id == item_id)
    total = base.count()
    reviews = (
        base.options(joinedload(Review.user), joinedload(Review.item))
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    summary = _summary_for_filter(db, item_id=item_id)
    return {"summary": summary, "total": total, "reviews": reviews}


def get_reviews_by_admin(
    db: Session,
    admin_id: int,
    skip: int = 0,
    limit: int = 20,
) -> dict:
    """Ambil daftar review untuk semua barang milik toko (admin) + summary."""
    base = db.query(Review).filter(Review.admin_id == admin_id)
    total = base.count()
    reviews = (
        base.options(joinedload(Review.user), joinedload(Review.item))
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    summary = _summary_for_filter(db, admin_id=admin_id)
    return {"summary": summary, "total": total, "reviews": reviews}


def get_review_summary_for_item(db: Session, item_id: int) -> dict:
    """Ringkas (avg, total, distribusi) untuk satu item."""
    return _summary_for_filter(db, item_id=item_id)


def get_review_summary_for_admin(db: Session, admin_id: int) -> dict:
    """Ringkas (avg, total, distribusi) untuk satu admin/toko."""
    return _summary_for_filter(db, admin_id=admin_id)


# ============================================================
# SHOP (Profil Toko) — public
# ============================================================

def get_shop_profile(db: Session, admin_id: int) -> dict | None:
    """
    Ambil profil toko publik: data admin + total_items + summary rating.
    Return None jika admin tidak ditemukan.
    """
    profile = (
        db.query(AdminProfile)
        .options(joinedload(AdminProfile.user))
        .filter(AdminProfile.id == admin_id)
        .first()
    )
    if not profile:
        return None

    total_items = db.query(func.count(Item.id)).filter(Item.admin_id == admin_id).scalar() or 0
    summary = _summary_for_filter(db, admin_id=admin_id)

    return {
        "admin_id": profile.id,
        "user_id": profile.user_id,
        "nama_usaha": profile.nama_usaha,
        "alamat_usaha": profile.alamat_usaha,
        "nomor_telepon": profile.nomor_telepon,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "foto_profil": (profile.user.foto_profil if profile.user else None),
        "is_verified": bool(profile.user.is_verified) if profile.user else False,
        "created_at": profile.created_at,
        "total_items": int(total_items),
        "rating": summary,
    }


# ============================================================
# PROMO CODE CRUD — Diskon / Kupon Platform (Super Admin)
# ============================================================

def _is_user_eligible_new_user(db: Session, user_id: int) -> bool:
    """
    User dianggap "baru" jika belum pernah punya rental dengan status
    disetujui / sedang_disewa / selesai (rental pending/ditolak diabaikan).
    """
    count = db.query(func.count(Rental.id)).filter(
        Rental.user_id == user_id,
        Rental.status.in_([
            RentalStatus.disetujui,
            RentalStatus.sedang_disewa,
            RentalStatus.selesai,
        ]),
    ).scalar() or 0
    return count == 0


def _calculate_promo_discount(promo: PromoCode, original_amount: float) -> float:
    """
    Hitung nominal diskon. Untuk percentage: pct × amount, di-cap di max_discount.
    Untuk fixed: langsung discount_value, di-cap di original_amount.
    Hasil dibulatkan ke bawah (floor) ke bilangan bulat karena Rupiah tidak pakai desimal.
    """
    if promo.discount_type == DiscountType.percentage:
        discount = original_amount * (promo.discount_value / 100.0)
    else:  # fixed
        discount = promo.discount_value

    if promo.max_discount is not None and discount > promo.max_discount:
        discount = promo.max_discount

    # Tidak boleh lebih besar dari subtotal
    if discount > original_amount:
        discount = original_amount

    # Bulatkan ke bawah — Rupiah tidak ada pecahan sen/perak
    return int(discount)


def _validate_promo_logic(
    db: Session,
    user_id: int,
    code: str,
    original_amount: float,
) -> dict:
    """
    Inti validasi promo. Return dict:
      { valid: bool, message: str, promo?: PromoCode, discount_amount?: float }

    Dipakai oleh:
    - validate_promo_for_user() (preview di checkout)
    - create_rental() (eksekusi saat submit)
    """
    code_norm = (code or "").strip().upper()
    if not code_norm:
        return {"valid": False, "message": "Kode promo tidak boleh kosong"}

    promo = db.query(PromoCode).filter(func.upper(PromoCode.code) == code_norm).first()
    if not promo:
        return {"valid": False, "message": "Kode promo tidak ditemukan"}

    if not promo.is_active:
        return {"valid": False, "message": "Promo sedang tidak aktif"}

    now = datetime.now()
    if promo.valid_from and promo.valid_from.replace(tzinfo=None) > now:
        return {"valid": False, "message": "Promo belum berlaku"}
    if promo.valid_until and promo.valid_until.replace(tzinfo=None) < now:
        return {"valid": False, "message": "Promo sudah kadaluarsa"}

    # Total uses
    if promo.max_total_uses is not None and (promo.used_count or 0) >= promo.max_total_uses:
        return {"valid": False, "message": "Kuota promo sudah habis"}

    # Per-user uses
    user_use_count = db.query(func.count(PromoRedemption.id)).filter(
        PromoRedemption.promo_code_id == promo.id,
        PromoRedemption.user_id == user_id,
    ).scalar() or 0
    if user_use_count >= (promo.max_uses_per_user or 1):
        return {"valid": False, "message": "Anda sudah pernah memakai promo ini"}

    # New-user eligibility
    if promo.eligibility == PromoEligibility.new_user:
        if not _is_user_eligible_new_user(db, user_id):
            return {"valid": False, "message": "Promo ini khusus pengguna baru"}

    # Min order
    if original_amount < (promo.min_order or 0):
        return {
            "valid": False,
            "message": f"Minimum order Rp {int(promo.min_order):,} tidak terpenuhi".replace(",", "."),
        }

    discount_amount = _calculate_promo_discount(promo, original_amount)
    return {
        "valid": True,
        "message": "Promo dapat digunakan",
        "promo": promo,
        "discount_amount": discount_amount,
    }


def validate_promo_for_user(
    db: Session,
    user_id: int,
    code: str,
    item_id: int,
    tanggal_mulai: date,
    tanggal_selesai: date,
) -> dict:
    """
    Preview diskon untuk user di halaman checkout (tanpa membuat rental).
    Return dict siap di-serialize ke PromoValidateResponse.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return {"valid": False, "message": "Barang tidak ditemukan"}

    original_amount = _calculate_total_harga(item.harga_per_hari, tanggal_mulai, tanggal_selesai)
    if original_amount <= 0:
        return {"valid": False, "message": "Durasi sewa tidak valid"}

    result = _validate_promo_logic(
        db=db, user_id=user_id, code=code, original_amount=original_amount
    )

    if not result["valid"]:
        return {"valid": False, "message": result["message"]}

    promo: PromoCode = result["promo"]
    discount_amount: float = result["discount_amount"]
    final_amount = max(0.0, original_amount - discount_amount)

    return {
        "valid": True,
        "code": promo.code,
        "nama": promo.nama,
        "original_amount": original_amount,
        "discount_amount": discount_amount,
        "final_amount": final_amount,
        "message": result["message"],
    }


# ── Super Admin CRUD

def create_promo_code(
    db: Session, super_admin_id: int, data: PromoCodeCreate
) -> PromoCode | dict:
    """Super admin membuat kupon baru. Return dict error jika code sudah ada."""
    existing = db.query(PromoCode).filter(
        func.upper(PromoCode.code) == data.code.upper()
    ).first()
    if existing:
        return {"error": "Kode promo sudah terdaftar", "code": 400}

    # Cek max 3 promo featured
    if data.is_featured:
        featured_count = db.query(func.count(PromoCode.id)).filter(
            PromoCode.is_featured == True, PromoCode.is_active == True
        ).scalar()
        if featured_count >= 3:
            return {"error": "Maksimal 3 promo yang bisa ditampilkan di landing page. Nonaktifkan salah satu promo featured terlebih dahulu.", "code": 400}

    promo = PromoCode(
        code=data.code,
        nama=data.nama,
        deskripsi=data.deskripsi,
        discount_type=DiscountType(data.discount_type.value),
        discount_value=data.discount_value,
        max_discount=data.max_discount,
        min_order=data.min_order,
        eligibility=PromoEligibility(data.eligibility.value),
        max_uses_per_user=data.max_uses_per_user,
        max_total_uses=data.max_total_uses,
        is_active=data.is_active,
        is_featured=data.is_featured,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
        created_by=super_admin_id,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


def update_promo_code(
    db: Session, promo_id: int, data: PromoCodeUpdate
) -> PromoCode | None | dict:
    """Update kupon (semua field opsional)."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        return None

    update_fields = data.model_dump(exclude_unset=True)

    # Cek max 3 featured jika mau set is_featured = True
    if update_fields.get("is_featured") is True and not promo.is_featured:
        featured_count = db.query(func.count(PromoCode.id)).filter(
            PromoCode.is_featured == True, PromoCode.is_active == True, PromoCode.id != promo_id
        ).scalar()
        if featured_count >= 3:
            return {"error": "Maksimal 3 promo yang bisa ditampilkan di landing page. Nonaktifkan salah satu promo featured terlebih dahulu.", "code": 400}

    for field, value in update_fields.items():
        # Map enum values jika ada
        if field == "discount_type" and value is not None:
            promo.discount_type = DiscountType(value if isinstance(value, str) else value.value)
        elif field == "eligibility" and value is not None:
            promo.eligibility = PromoEligibility(value if isinstance(value, str) else value.value)
        else:
            setattr(promo, field, value)

    db.commit()
    db.refresh(promo)
    return promo


def delete_promo_code(db: Session, promo_id: int) -> bool:
    """
    Hapus kupon. Jika sudah pernah dipakai (ada redemption), soft-delete:
    set is_active=False agar history redemption tetap utuh.
    """
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        return False

    has_redemption = db.query(PromoRedemption).filter(
        PromoRedemption.promo_code_id == promo_id
    ).first() is not None

    if has_redemption:
        promo.is_active = False
        promo.is_featured = False
        db.commit()
    else:
        db.delete(promo)
        db.commit()
    return True


def get_promo_codes(db: Session, skip: int = 0, limit: int = 50) -> dict:
    """List semua kupon (super admin)."""
    query = db.query(PromoCode).order_by(PromoCode.created_at.desc())
    total = query.count()
    promos = query.offset(skip).limit(limit).all()
    return {"total": total, "promos": promos}


def get_promo_code(db: Session, promo_id: int) -> PromoCode | None:
    return db.query(PromoCode).filter(PromoCode.id == promo_id).first()


def get_featured_promos(db: Session, limit: int = 3) -> List[PromoCode]:
    """
    Promo yang ditampilkan di landing page.
    Filter: is_active=True, is_featured=True, dalam masa berlaku.
    """
    now = datetime.now()
    query = db.query(PromoCode).filter(
        PromoCode.is_active.is_(True),
        PromoCode.is_featured.is_(True),
        or_(PromoCode.valid_from.is_(None), PromoCode.valid_from <= now),
        or_(PromoCode.valid_until.is_(None), PromoCode.valid_until >= now),
    ).order_by(PromoCode.created_at.desc())

    return query.limit(limit).all()


def get_promo_redemptions(db: Session, promo_id: int) -> dict:
    """List semua pemakaian kupon untuk audit super admin."""
    query = db.query(PromoRedemption).filter(PromoRedemption.promo_code_id == promo_id)
    total = query.count()
    total_discount = db.query(func.sum(PromoRedemption.discount_amount)).filter(
        PromoRedemption.promo_code_id == promo_id
    ).scalar() or 0.0
    redemptions = query.order_by(PromoRedemption.redeemed_at.desc()).all()
    return {
        "total": total,
        "total_discount_given": float(total_discount),
        "redemptions": redemptions,
    }
