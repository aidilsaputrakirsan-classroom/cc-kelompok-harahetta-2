"""
schemas.py — Pydantic Schemas Sewain
Validasi input/output untuk semua entitas
"""

import re
import enum
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date


# ============================================================
# ENUMS (mirroring models.py)
# ============================================================

class UserRoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class VerificationStatusEnum(str, enum.Enum):
    menunggu = "menunggu"
    disetujui = "disetujui"
    ditolak = "ditolak"


class ItemStatusEnum(str, enum.Enum):
    available = "available"
    rented = "rented"
    unavailable = "unavailable"


class RentalStatusEnum(str, enum.Enum):
    pending = "pending"
    disetujui = "disetujui"
    sedang_disewa = "sedang_disewa"
    selesai = "selesai"
    ditolak = "ditolak"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class PaymentMethodEnum(str, enum.Enum):
    transfer = "transfer"
    cash = "cash"
    e_wallet = "e_wallet"
    credit_card = "credit_card"
    midtrans = "midtrans"


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru (publik - hanya role 'user')."""

    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    nama: str = Field(..., min_length=2, max_length=100, examples=["Djaky Abbyyu"])
    password: str = Field(..., min_length=8, examples=["Password123!"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        """Password: min 8 karakter, harus ada huruf besar, kecil, dan angka."""
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise ValueError(
                "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka."
            )
        return value


class UserResponse(BaseModel):
    """Schema response user (tanpa password)."""

    id: int
    email: EmailStr
    nama: str
    role: UserRoleEnum
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateByAdmin(BaseModel):
    """Schema untuk super_admin mengupdate user."""
    nama: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    role: Optional[UserRoleEnum] = None


class TokenResponse(BaseModel):
    """Response setelah login berhasil."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# ADMIN PROFILE SCHEMAS
# ============================================================

class AdminProfileCreate(BaseModel):
    """Schema untuk membuat profil usaha admin."""
    nama_usaha: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa Jaya"])
    alamat_usaha: Optional[str] = Field(None, examples=["Jl. Soekarno-Hatta No.1, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])
    nomor_rekening: Optional[str] = Field(None, max_length=100, examples=["BCA 1234567890 a/n Toko Sewa Jaya"])
    foto_qris: Optional[str] = Field(None, examples=["data:image/png;base64,..."])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, examples=[-1.2654])   # ← Koordinat lokasi
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, examples=[116.8312])  # ← Koordinat lokasi


class AdminProfileUpdate(BaseModel):
    """Schema untuk update profil usaha."""
    nama_usaha: Optional[str] = Field(None, max_length=100)
    alamat_usaha: Optional[str] = None
    nomor_telepon: Optional[str] = Field(None, max_length=20)
    nomor_rekening: Optional[str] = Field(None, max_length=100)
    foto_qris: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)    # ← Koordinat lokasi
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)  # ← Koordinat lokasi


class AdminProfileResponse(BaseModel):
    """Schema response profil admin."""
    id: int
    user_id: int
    nama_usaha: str
    alamat_usaha: Optional[str]
    nomor_telepon: Optional[str]
    nomor_rekening: Optional[str]
    foto_qris: Optional[str]
    latitude: Optional[float]    # ← Koordinat lokasi
    longitude: Optional[float]   # ← Koordinat lokasi
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class AdminPaymentInfoResponse(BaseModel):
    """Schema response info pembayaran admin (publik, untuk user yang mau sewa)."""
    admin_id: int
    nama_usaha: str
    nomor_rekening: Optional[str]
    foto_qris: Optional[str]
    nomor_telepon: Optional[str]

    class Config:
        from_attributes = True


class AdminCreateRequest(BaseModel):
    """Schema untuk super admin membuat admin baru."""
    email: EmailStr = Field(..., examples=["admin@sewain.id"])
    nama: str = Field(..., min_length=2, max_length=100, examples=["Toko ABC"])
    password: str = Field(..., min_length=8, examples=["Password123!"])
    nama_usaha: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa ABC"])
    alamat_usaha: Optional[str] = Field(None, examples=["Jl. Soekarno-Hatta No.1, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        """Password: min 8 karakter, harus ada huruf besar, kecil, dan angka."""
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise ValueError(
                "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka."
            )
        return value


class AdminStatsResponse(BaseModel):
    """Schema response stats detail admin."""
    admin_id: int
    admin_profile: AdminProfileResponse
    total_items: int
    active_items: int
    total_rentals: int
    pending_rentals: int
    approved_rentals: int
    completed_rentals: int
    total_revenue: float
    monthly_revenue: float
    average_rating: Optional[float]
    customer_count: int
    joined_date: datetime

    class Config:
        from_attributes = True


# ============================================================
# USER PROFILE SCHEMAS
# ============================================================

class UserProfileCreate(BaseModel):
    """Schema untuk melengkapi data diri penyewa."""
    nama_orang_tua: Optional[str] = Field(None, max_length=100, examples=["Budi Santoso"])
    alamat: Optional[str] = Field(None, examples=["Jl. Merdeka No.5, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, examples=[-1.2654])
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, examples=[116.8312])
    foto_ktp: Optional[str] = Field(None, examples=["https://storage.sewain.id/ktp/user1.jpg"])
    foto_selfie_ktp: Optional[str] = Field(None, examples=["https://storage.sewain.id/selfie/user1.jpg"])


class UserProfileUpdate(UserProfileCreate):
    """Schema untuk update data diri (sama dengan create tapi semua opsional)."""
    pass


class UserProfileResponse(BaseModel):
    """Schema response profil user."""
    id: int
    user_id: int
    nama_orang_tua: Optional[str]
    alamat: Optional[str]
    nomor_telepon: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    foto_ktp: Optional[str]
    foto_selfie_ktp: Optional[str]
    status_verifikasi: VerificationStatusEnum
    updated_at: datetime

    class Config:
        from_attributes = True


class VerificationAction(BaseModel):
    """Schema untuk admin menentukan status verifikasi user."""
    status: VerificationStatusEnum = Field(..., examples=["disetujui"])
    catatan: Optional[str] = Field(None, examples=["Foto KTP sesuai dengan wajah"])


# ============================================================
# CATEGORY SCHEMAS
# ============================================================

class CategoryCreate(BaseModel):
    """Schema untuk membuat kategori baru."""
    nama: str = Field(..., min_length=2, max_length=50, examples=["Elektronik"])
    deskripsi: Optional[str] = Field(None, examples=["Perangkat elektronik dan gadget"])


class CategoryUpdate(BaseModel):
    """Schema untuk update kategori."""
    nama: Optional[str] = Field(None, max_length=50)
    deskripsi: Optional[str] = None


class CategoryResponse(BaseModel):
    """Schema response kategori."""
    id: int
    nama: str
    deskripsi: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ITEM SCHEMAS (Barang Sewa)
# ============================================================

class ItemCreate(BaseModel):
    """Schema untuk menambah barang sewa baru."""
    category_id: Optional[int] = Field(None, examples=[1])
    nama: str = Field(..., min_length=1, max_length=100, examples=["Kamera Sony A7III"])
    deskripsi: Optional[str] = Field(None, examples=["Kamera mirrorless full frame"])
    harga_per_hari: float = Field(..., gt=0, examples=[250000.0])
    stok: int = Field(1, ge=0, examples=[3])
    foto_url: Optional[str] = Field(None, examples=["https://storage.sewain.id/items/kamera1.jpg"])


class ItemUpdate(BaseModel):
    """Schema untuk update barang sewa (semua opsional)."""
    category_id: Optional[int] = None
    nama: Optional[str] = Field(None, max_length=100)
    deskripsi: Optional[str] = None
    harga_per_hari: Optional[float] = Field(None, gt=0)
    stok: Optional[int] = Field(None, ge=0)
    foto_url: Optional[str] = None
    status: Optional[ItemStatusEnum] = None


class ItemResponse(BaseModel):
    """Schema response barang sewa."""
    id: int
    admin_id: int
    category_id: Optional[int]
    nama: str
    deskripsi: Optional[str]
    harga_per_hari: float
    stok: int
    foto_url: Optional[str]
    status: ItemStatusEnum
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse]

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    """Response untuk list barang dengan total count."""
    total: int
    items: List[ItemResponse]


# ============================================================
# RENTAL SCHEMAS (Transaksi Sewa)
# ============================================================

class RentalCreate(BaseModel):
    """Schema untuk mengajukan permintaan sewa."""
    item_id: int = Field(..., examples=[1])
    tanggal_mulai: date = Field(..., examples=["2026-04-10"])
    tanggal_selesai: date = Field(..., examples=["2026-04-15"])
    catatan: Optional[str] = Field(None, examples=["Tolong siapkan baterai cadangan"])

    @field_validator("tanggal_selesai")
    @classmethod
    def validate_tanggal_selesai(cls, tanggal_selesai, info):
        """Tanggal selesai harus setelah tanggal mulai."""
        if "tanggal_mulai" in info.data and tanggal_selesai <= info.data["tanggal_mulai"]:
            raise ValueError("Tanggal selesai harus setelah tanggal mulai")
        return tanggal_selesai


class RentalStatusUpdate(BaseModel):
    """Schema untuk admin mengubah status rental."""
    status: RentalStatusEnum = Field(..., examples=["disetujui"])
    catatan: Optional[str] = Field(None, examples=["Silakan ambil barang besok pagi"])


class RentalResponse(BaseModel):
    """Schema response transaksi sewa."""
    id: int
    user_id: int
    item_id: int
    tanggal_mulai: date
    tanggal_selesai: date
    total_harga: float
    status: RentalStatusEnum
    catatan: Optional[str]
    # ── Snapshot info pickup (diisi saat rental disetujui)
    pickup_alamat: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_nama_usaha: Optional[str] = None
    pickup_telepon: Optional[str] = None
    diambil_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    item: Optional[ItemResponse]
    user: Optional[UserResponse]

    class Config:
        from_attributes = True


class PickupInfoResponse(BaseModel):
    """Schema response info lokasi pickup untuk user setelah bayar."""
    rental_id: int
    pickup_alamat: str
    pickup_latitude: float
    pickup_longitude: float
    pickup_nama_usaha: str
    pickup_telepon: Optional[str]
    tanggal_mulai: date
    tanggal_selesai: date
    item_nama: str

    class Config:
        from_attributes = True


class RentalListResponse(BaseModel):
    """Response untuk list rental dengan total count."""
    total: int
    rentals: List[RentalResponse]


# ============================================================
# PAYMENT SCHEMAS (Pembayaran Sewa)
# ============================================================

class PaymentCreate(BaseModel):
    """Schema untuk membuat pembayaran (auto-generated saat pengajuan sewa disetujui)."""
    rental_id: int = Field(..., examples=[1])
    metode_pembayaran: PaymentMethodEnum = Field(PaymentMethodEnum.transfer, examples=["transfer"])
    catatan: Optional[str] = Field(None, examples=["Transfer ke rek 12345"])


class PaymentUpdate(BaseModel):
    """Schema untuk update status pembayaran (upload bukti, confirm, etc)."""
    status: PaymentStatusEnum = Field(..., examples=["completed"])
    bukti_pembayaran: Optional[str] = Field(None, examples=["https://storage.sewain.id/bukti/payment1.jpg"])
    catatan: Optional[str] = Field(None, examples=["Sudah transfer"])


class PaymentResponse(BaseModel):
    """Schema response pembayaran."""
    id: int
    rental_id: int
    user_id: int
    admin_id: int
    jumlah: float
    metode_pembayaran: PaymentMethodEnum
    status: PaymentStatusEnum
    bukti_pembayaran: Optional[str]
    catatan: Optional[str]
    tanggal_pembayaran: Optional[datetime]
    # ── Midtrans fields
    midtrans_order_id: Optional[str] = None
    snap_token: Optional[str] = None
    snap_redirect_url: Optional[str] = None
    payment_channel: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MidtransChargeResponse(BaseModel):
    """Response saat generate Snap token."""
    payment_id: int
    rental_id: int
    order_id: str
    snap_token: str
    snap_redirect_url: str
    client_key: str
    jumlah: float
    status: PaymentStatusEnum

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    """Response untuk list pembayaran dengan total count."""
    total: int
    payments: List[PaymentResponse]


class PaymentDetailResponse(BaseModel):
    """Response detail pembayaran dengan info rental & user."""
    payment: PaymentResponse
    rental: RentalResponse
    user: UserResponse

# ============================================================
# WALLET & WITHDRAWAL SCHEMAS
# ============================================================

class WithdrawalStatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class WalletResponse(BaseModel):
    """Schema response wallet admin."""
    id: int
    admin_id: int
    saldo: float
    total_pendapatan: float
    total_withdrawn: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WalletTransactionResponse(BaseModel):
    """Schema response riwayat transaksi masuk ke wallet."""
    rental_id: int
    item_nama: str
    jumlah: float
    tanggal: datetime
    penyewa: str


class WithdrawalCreate(BaseModel):
    """Schema untuk request withdrawal."""
    jumlah: float = Field(..., gt=0, examples=[500000.0])
    bank_name: str = Field(..., min_length=2, max_length=50, examples=["BCA"])
    account_number: str = Field(..., min_length=5, max_length=50, examples=["1234567890"])
    account_holder: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa Jaya"])
    catatan: Optional[str] = Field(None, examples=["Penarikan bulanan"])


class WithdrawalResponse(BaseModel):
    """Schema response withdrawal."""
    id: int
    wallet_id: int
    admin_id: int
    jumlah: float
    bank_name: str
    account_number: str
    account_holder: str
    status: WithdrawalStatusEnum
    catatan: Optional[str]
    rejected_reason: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WithdrawalListResponse(BaseModel):
    """Response untuk list withdrawal dengan total count."""
    total: int
    withdrawals: List[WithdrawalResponse]


class WithdrawalActionByAdmin(BaseModel):
    """Schema untuk super admin memproses withdrawal."""
    status: WithdrawalStatusEnum = Field(..., examples=["processing"])
    catatan: Optional[str] = Field(None, examples=["Sedang diproses ke rekening tujuan"])
    rejected_reason: Optional[str] = Field(None, examples=["Nomor rekening tidak valid"])
