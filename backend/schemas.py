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


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""

    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    nama: str = Field(..., min_length=2, max_length=100, examples=["Djaky Abbyyu"])
    password: str = Field(..., min_length=8, examples=["Password123!"])
    role: UserRoleEnum = Field(UserRoleEnum.user, examples=["user"])

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


class AdminProfileUpdate(BaseModel):
    """Schema untuk update profil usaha."""
    nama_usaha: Optional[str] = Field(None, max_length=100)
    alamat_usaha: Optional[str] = None
    nomor_telepon: Optional[str] = Field(None, max_length=20)


class AdminProfileResponse(BaseModel):
    """Schema response profil admin."""
    id: int
    user_id: int
    nama_usaha: str
    alamat_usaha: Optional[str]
    nomor_telepon: Optional[str]
    created_at: datetime
    user: UserResponse

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
    created_at: datetime
    updated_at: datetime
    item: Optional[ItemResponse]
    user: Optional[UserResponse]

    class Config:
        from_attributes = True


class RentalListResponse(BaseModel):
    """Response untuk list rental dengan total count."""
    total: int
    rentals: List[RentalResponse]