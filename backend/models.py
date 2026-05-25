"""
models.py — Database Models Sewain
Semua tabel sesuai skema implementation_plan_sewain
"""

import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Boolean, Enum as SAEnum, Date, ForeignKey, UniqueConstraint, Index,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ============================================================
# ENUMS
# ============================================================

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class VerificationStatus(str, enum.Enum):
    menunggu = "menunggu"
    disetujui = "disetujui"
    ditolak = "ditolak"


class ItemStatus(str, enum.Enum):
    available = "available"
    rented = "rented"
    unavailable = "unavailable"


class RentalStatus(str, enum.Enum):
    pending = "pending"
    disetujui = "disetujui"
    sedang_disewa = "sedang_disewa"
    selesai = "selesai"
    ditolak = "ditolak"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    transfer = "transfer"
    cash = "cash"
    e_wallet = "e_wallet"
    credit_card = "credit_card"
    midtrans = "midtrans"


class WithdrawalStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class PromoEligibility(str, enum.Enum):
    new_user = "new_user"   # khusus pengguna yang belum pernah punya rental aktif/selesai
    all = "all"             # semua user


# ============================================================
# TABEL users — Semua Pengguna Platform
# ============================================================

class User(Base):
    """
    Tabel utama pengguna. Semua role (super_admin, admin, user)
    disimpan di sini dengan field 'role' sebagai pembeda.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.user)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # True jika verifikasi identitas disetujui
    email_verified_at = Column(DateTime(timezone=True), nullable=True)  # NULL = belum verifikasi email
    password_changed_at = Column(DateTime(timezone=True), nullable=True)  # Untuk invalidasi token reset
    foto_profil = Column(Text, nullable=True)  # Foto profil (data URL / URL); berlaku untuk semua role
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False)
    user_profile = relationship("UserProfile", back_populates="user", uselist=False)
    rentals = relationship("Rental", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


# ============================================================
# TABEL admins — Profil Penyedia Barang (role=admin)
# ============================================================

class AdminProfile(Base):
    """
    Profil usaha untuk user dengan role 'admin' (penyedia barang).
    Relasi 1:1 dengan users.
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    nama_usaha = Column(String(100), nullable=False)
    alamat_usaha = Column(Text, nullable=True)
    nomor_telepon = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)               # Koordinat lokasi usaha
    longitude = Column(Float, nullable=True)              # Koordinat lokasi usaha
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="admin_profile")
    items = relationship("Item", back_populates="admin")

    def __repr__(self):
        return f"<AdminProfile(id={self.id}, nama_usaha='{self.nama_usaha}')>"


# ============================================================
# TABEL user_profiles — Data Lengkap Penyewa (role=user)
# ============================================================

class UserProfile(Base):
    """
    Data lengkap penyewa termasuk verifikasi identitas KTP.
    Relasi 1:1 dengan users.
    """
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    nama_orang_tua = Column(String(100), nullable=True)
    alamat = Column(Text, nullable=True)
    nomor_telepon = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    foto_ktp = Column(Text, nullable=True)
    foto_selfie_ktp = Column(Text, nullable=True)
    status_verifikasi = Column(
        SAEnum(VerificationStatus),
        nullable=False,
        default=VerificationStatus.menunggu
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="user_profile")

    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, status='{self.status_verifikasi}')>"


# ============================================================
# TABEL categories — Kategori Barang Sewa
# ============================================================

class Category(Base):
    """
    Kategori barang sewa, dikelola oleh Super Admin.
    Contoh: Elektronik, Outdoor, Kendaraan, Fotografi, dll.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(50), unique=True, nullable=False, index=True)
    deskripsi = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    items = relationship("Item", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, nama='{self.nama}')>"


# ============================================================
# TABEL items — Barang Sewa (Utama)
# ============================================================

class Item(Base):
    """
    Barang yang disewakan oleh Admin (penyedia).
    FK ke admins dan categories.
    """
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    nama = Column(String(100), nullable=False, index=True)
    deskripsi = Column(Text, nullable=True)
    harga_per_hari = Column(Float, nullable=False)
    stok = Column(Integer, nullable=False, default=1)
    foto_url = Column(Text, nullable=True)  # Changed from String(500) to Text for base64 images
    status = Column(SAEnum(ItemStatus), nullable=False, default=ItemStatus.available)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    admin = relationship("AdminProfile", back_populates="items")
    category = relationship("Category", back_populates="items")
    rentals = relationship("Rental", back_populates="item")

    @property
    def admin_nama_usaha(self):
        """Nama usaha penyedia barang (untuk ditampilkan di katalog)."""
        return self.admin.nama_usaha if self.admin else None

    @property
    def admin_alamat_usaha(self):
        """Alamat usaha penyedia barang (untuk ditampilkan di katalog)."""
        return self.admin.alamat_usaha if self.admin else None

    @property
    def admin_kota(self):
        """Kota penyedia barang (di-extract dari alamat_usaha)."""
        from crud import extract_city
        if self.admin and self.admin.alamat_usaha:
            return extract_city(self.admin.alamat_usaha)
        return None

    def __repr__(self):
        return f"<Item(id={self.id}, nama='{self.nama}', harga_per_hari={self.harga_per_hari})>"


# ============================================================
# TABEL rentals — Transaksi Penyewaan
# ============================================================

class Rental(Base):
    """
    Transaksi penyewaan. User ajukan → Admin proses.
    Status flow: pending → disetujui → sedang_disewa → selesai (atau ditolak)
    """
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    tanggal_mulai = Column(Date, nullable=False)
    tanggal_selesai = Column(Date, nullable=False)
    total_harga = Column(Float, nullable=False)  # Harga FINAL setelah diskon (yang dibayar user)
    status = Column(SAEnum(RentalStatus), nullable=False, default=RentalStatus.pending)
    catatan = Column(Text, nullable=True)        # Catatan dari user atau admin
    # ── Promo / diskon
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="SET NULL"), nullable=True)
    discount_amount = Column(Float, nullable=True, default=0.0)  # Nominal potongan (Rp)
    original_amount = Column(Float, nullable=True)               # Subtotal sebelum diskon
    # ── Snapshot alamat pickup (diambil saat rental disetujui)
    pickup_alamat = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    pickup_nama_usaha = Column(String(100), nullable=True)
    pickup_telepon = Column(String(20), nullable=True)
    diambil_at = Column(DateTime(timezone=True), nullable=True)  # Timestamp konfirmasi pengambilan
    due_at = Column(DateTime(timezone=True), nullable=True)  # Deadline 24h × durasi sejak pickup
    return_requested_at = Column(DateTime(timezone=True), nullable=True)  # User request pengembalian
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="rentals")
    item = relationship("Item", back_populates="rentals")
    payment = relationship("Payment", back_populates="rental", uselist=False)
    promo_code = relationship("PromoCode", foreign_keys=[promo_code_id])
    promo_redemption = relationship("PromoRedemption", back_populates="rental", uselist=False)

    def __repr__(self):
        return f"<Rental(id={self.id}, user_id={self.user_id}, item_id={self.item_id}, status='{self.status}')>"


# ============================================================
# TABEL payments — Pembayaran Penyewaan
# ============================================================

class Payment(Base):
    """
    Transaksi pembayaran untuk penyewaan barang.
    Relasi 1:1 dengan rentals (satu rental bisa punya satu pembayaran).
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rental_id = Column(Integer, ForeignKey("rentals.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    jumlah = Column(Float, nullable=False)  # Jumlah yang harus dibayar
    metode_pembayaran = Column(SAEnum(PaymentMethod), nullable=False, default=PaymentMethod.transfer)
    status = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    bukti_pembayaran = Column(Text, nullable=True)  # URL/path bukti transfer
    catatan = Column(Text, nullable=True)           # Catatan dari user atau admin
    tanggal_pembayaran = Column(DateTime(timezone=True), nullable=True)  # Kapan pembayaran dilakukan

    # ── Midtrans integration fields
    midtrans_order_id = Column(String(100), unique=True, nullable=True, index=True)
    midtrans_transaction_id = Column(String(100), nullable=True)
    snap_token = Column(String(255), nullable=True)
    snap_redirect_url = Column(Text, nullable=True)
    payment_channel = Column(String(50), nullable=True)   # e.g. gopay, bca_va, qris
    fraud_status = Column(String(20), nullable=True)
    raw_notification = Column(Text, nullable=True)        # payload webhook terakhir (audit)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    rental = relationship("Rental", back_populates="payment")
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("AdminProfile", foreign_keys=[admin_id])

    def __repr__(self):
        return f"<Payment(id={self.id}, rental_id={self.rental_id}, status='{self.status}', jumlah={self.jumlah})>"


# ============================================================
# TABEL wallets — Saldo Admin Penyewa
# ============================================================

class Wallet(Base):
    """
    Wallet internal untuk admin penyewa.
    Saldo bertambah otomatis saat rental selesai (payment completed).
    """
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), unique=True, nullable=False)
    saldo = Column(Float, nullable=False, default=0.0)
    total_pendapatan = Column(Float, nullable=False, default=0.0)  # Akumulasi semua pendapatan
    total_withdrawn = Column(Float, nullable=False, default=0.0)   # Akumulasi semua WD berhasil
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    admin = relationship("AdminProfile", backref="wallet")
    withdrawals = relationship("Withdrawal", back_populates="wallet")

    def __repr__(self):
        return f"<Wallet(id={self.id}, admin_id={self.admin_id}, saldo={self.saldo})>"


# ============================================================
# TABEL withdrawals — Penarikan Saldo
# ============================================================

class Withdrawal(Base):
    """
    Request penarikan saldo dari wallet admin ke rekening bank.
    Status flow: pending → processing → completed (atau rejected)
    Estimasi waktu: 1-3 hari kerja (simulasi).
    """
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    jumlah = Column(Float, nullable=False)
    bank_name = Column(String(50), nullable=False)          # Nama bank tujuan (BCA, BNI, Mandiri, dll)
    account_number = Column(String(50), nullable=False)     # Nomor rekening tujuan
    account_holder = Column(String(100), nullable=False)    # Nama pemilik rekening
    status = Column(SAEnum(WithdrawalStatus), nullable=False, default=WithdrawalStatus.pending)
    catatan = Column(Text, nullable=True)                   # Catatan admin/super_admin
    rejected_reason = Column(Text, nullable=True)           # Alasan ditolak (jika rejected)
    completed_at = Column(DateTime(timezone=True), nullable=True)  # Kapan WD selesai diproses
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="withdrawals")
    admin = relationship("AdminProfile", foreign_keys=[admin_id])

    def __repr__(self):
        return f"<Withdrawal(id={self.id}, admin_id={self.admin_id}, jumlah={self.jumlah}, status='{self.status}')>"


# ============================================================
# TABEL chat_rooms — Kanal Percakapan User ↔ Admin per Item
# ============================================================

class ChatRoom(Base):
    """
    Kanal percakapan antara seorang penyewa (user) dengan
    seorang penyedia (admin) terkait satu barang spesifik.

    Pasangan unik: (user_id, admin_id, item_id).
    """

    __tablename__ = "chat_rooms"
    __table_args__ = (
        UniqueConstraint("user_id", "admin_id", "item_id", name="uq_chatroom_user_admin_item"),
        Index("ix_chatroom_user", "user_id"),
        Index("ix_chatroom_admin", "admin_id"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="SET NULL"), nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])
    item = relationship("Item", foreign_keys=[item_id])
    messages = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self):
        return f"<ChatRoom(id={self.id}, user_id={self.user_id}, admin_id={self.admin_id}, item_id={self.item_id})>"


# ============================================================
# TABEL chat_messages — Pesan dalam Kanal Chat
# ============================================================

class ChatMessage(Base):
    """
    Satu pesan teks dalam ChatRoom. Sender bisa user atau admin.
    """

    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chatmessage_room_created", "room_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, room_id={self.room_id}, sender_id={self.sender_id})>"


# ============================================================
# TABEL reviews — Review/Testimoni dari Penyewa
# ============================================================

class Review(Base):
    """
    Review/testimoni dari penyewa setelah rental selesai.

    Aturan:
    - Hanya rental dengan status 'selesai' yang bisa direview
    - 1 rental = 1 review (UNIQUE rental_id)
    - Review nempel ke rental → secara tidak langsung ke item & admin (toko)
    - Rating 1..5
    """

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("rental_id", name="uq_review_rental"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
        Index("ix_review_item", "item_id"),
        Index("ix_review_admin", "admin_id"),
        Index("ix_review_user", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rental_id = Column(Integer, ForeignKey("rentals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    komentar = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    rental = relationship("Rental", foreign_keys=[rental_id])
    user = relationship("User", foreign_keys=[user_id])
    item = relationship("Item", foreign_keys=[item_id])
    admin = relationship("AdminProfile", foreign_keys=[admin_id])

    def __repr__(self):
        return f"<Review(id={self.id}, rental_id={self.rental_id}, rating={self.rating})>"


# ============================================================
# TABEL promo_codes — Kupon / Kode Promo Platform
# ============================================================

class PromoCode(Base):
    """
    Kupon promo platform-wide. Hanya super admin yang bisa CRUD.
    Diskon ditanggung platform (bukan admin penyedia).
    """
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # mis. WELCOME50
    nama = Column(String(100), nullable=False)                          # Label internal
    deskripsi = Column(Text, nullable=True)                             # Untuk landing page

    # ── Aturan diskon
    discount_type = Column(SAEnum(DiscountType), nullable=False, default=DiscountType.percentage)
    discount_value = Column(Float, nullable=False)                      # 50 (artinya 50%) atau nominal Rp
    max_discount = Column(Float, nullable=True)                         # Cap potongan (Rp). NULL = no cap
    min_order = Column(Float, nullable=False, default=0.0)              # Minimum subtotal

    # ── Eligibility & limit
    eligibility = Column(SAEnum(PromoEligibility), nullable=False, default=PromoEligibility.all)
    max_uses_per_user = Column(Integer, nullable=False, default=1)
    max_total_uses = Column(Integer, nullable=True)                     # NULL = unlimited
    used_count = Column(Integer, nullable=False, default=0)             # Counter pemakaian sukses

    # ── Status & visibility
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)        # Tampilkan di landing
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    redemptions = relationship("PromoRedemption", back_populates="promo_code", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PromoCode(id={self.id}, code='{self.code}', value={self.discount_value})>"


# ============================================================
# TABEL promo_redemptions — Audit Pemakaian Kupon
# ============================================================

class PromoRedemption(Base):
    """
    Catatan setiap pemakaian kupon oleh user pada satu rental.
    Mencegah double-spend (UNIQUE per rental_id) dan jadi audit trail.
    """
    __tablename__ = "promo_redemptions"
    __table_args__ = (
        Index("ix_promo_redemption_user", "user_id"),
        Index("ix_promo_redemption_promo", "promo_code_id"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rental_id = Column(Integer, ForeignKey("rentals.id", ondelete="CASCADE"), unique=True, nullable=False)

    original_amount = Column(Float, nullable=False)   # Subtotal sebelum diskon
    discount_amount = Column(Float, nullable=False)   # Nominal potongan
    final_amount = Column(Float, nullable=False)      # Yang dibayar user

    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    promo_code = relationship("PromoCode", back_populates="redemptions")
    user = relationship("User", foreign_keys=[user_id])
    rental = relationship("Rental", back_populates="promo_redemption", foreign_keys=[rental_id])

    def __repr__(self):
        return f"<PromoRedemption(id={self.id}, promo_code_id={self.promo_code_id}, user_id={self.user_id}, discount={self.discount_amount})>"
