"""
models.py — Database Models Sewain
Semua tabel sesuai skema implementation_plan_sewain
"""

import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Boolean, Enum as SAEnum, Date, ForeignKey
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
    total_harga = Column(Float, nullable=False)  # Kalkulasi otomatis: harga_per_hari × durasi
    status = Column(SAEnum(RentalStatus), nullable=False, default=RentalStatus.pending)
    catatan = Column(Text, nullable=True)        # Catatan dari user atau admin
    # ── Snapshot alamat pickup (diambil saat rental disetujui)
    pickup_alamat = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    pickup_nama_usaha = Column(String(100), nullable=True)
    pickup_telepon = Column(String(20), nullable=True)
    diambil_at = Column(DateTime(timezone=True), nullable=True)  # Timestamp konfirmasi pengambilan
    return_requested_at = Column(DateTime(timezone=True), nullable=True)  # User request pengembalian
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="rentals")
    item = relationship("Item", back_populates="rentals")
    payment = relationship("Payment", back_populates="rental", uselist=False)

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
