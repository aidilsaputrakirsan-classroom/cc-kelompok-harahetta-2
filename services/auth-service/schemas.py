import re
import enum
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


class UserRoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class VerificationStatusEnum(str, enum.Enum):
    menunggu = "menunggu"
    disetujui = "disetujui"
    ditolak = "ditolak"


class UserCreate(BaseModel):
    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    nama: str = Field(..., min_length=2, max_length=100, examples=["Djaky Abbyyu"])
    password: str = Field(..., min_length=8, examples=["Password123!"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise ValueError(
                "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka."
            )
        return value


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nama: str
    role: UserRoleEnum
    is_active: bool
    is_verified: bool
    email_verified_at: Optional[datetime] = None
    foto_profil: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserMeUpdate(BaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=100)
    foto_profil: Optional[str] = Field(
        None,
        description="Data URL (data:image/...;base64,...) or public image URL",
    )


class UserUpdateByAdmin(BaseModel):
    nama: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    role: Optional[UserRoleEnum] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class EmailVerifyRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str):
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise ValueError(
                "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka."
            )
        return value


class AdminProfileCreate(BaseModel):
    nama_usaha: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa Jaya"])
    alamat_usaha: Optional[str] = Field(None, examples=["Jl. Soekarno-Hatta No.1, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, examples=[-1.2654])
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, examples=[116.8312])


class AdminProfileUpdate(BaseModel):
    nama_usaha: Optional[str] = Field(None, max_length=100)
    alamat_usaha: Optional[str] = None
    nomor_telepon: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


class AdminProfileResponse(BaseModel):
    id: int
    user_id: int
    nama_usaha: str
    alamat_usaha: Optional[str]
    nomor_telepon: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class AdminPaymentInfoResponse(BaseModel):
    id: int
    user_id: int
    nama_usaha: str
    nomor_telepon: Optional[str]
    alamat_usaha: Optional[str] = None
    foto_profil: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class AdminCreateRequest(BaseModel):
    email: EmailStr = Field(..., examples=["admin@sewain.id"])
    nama: str = Field(..., min_length=2, max_length=100, examples=["Toko ABC"])
    password: str = Field(..., min_length=8, examples=["Password123!"])
    nama_usaha: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa ABC"])
    alamat_usaha: Optional[str] = Field(None, examples=["Jl. Soekarno-Hatta No.1, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise ValueError(
                "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka."
            )
        return value


class UserProfileCreate(BaseModel):
    nama_orang_tua: Optional[str] = Field(None, max_length=100, examples=["Budi Santoso"])
    alamat: Optional[str] = Field(None, examples=["Jl. Merdeka No.5, Balikpapan"])
    nomor_telepon: Optional[str] = Field(None, max_length=20, examples=["08123456789"])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, examples=[-1.2654])
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, examples=[116.8312])
    foto_ktp: Optional[str] = Field(None, examples=["https://storage.sewain.id/ktp/user1.jpg"])
    foto_selfie_ktp: Optional[str] = Field(None, examples=["https://storage.sewain.id/selfie/user1.jpg"])


class UserProfileUpdate(UserProfileCreate):
    pass


class UserProfileResponse(BaseModel):
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
    status: VerificationStatusEnum = Field(..., examples=["disetujui"])
    catatan: Optional[str] = Field(None, examples=["Foto KTP sesuai dengan wajah"])


class TokenVerifyResponse(BaseModel):
    id: int
    email: str
    nama: str
    role: str
    is_verified: bool

    class Config:
        from_attributes = True
