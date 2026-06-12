import re
import enum
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date


class RentalStatusEnum(str, enum.Enum):
    pending = "pending"
    disetujui = "disetujui"
    sedang_disewa = "sedang_disewa"
    selesai = "selesai"
    ditolak = "ditolak"


class DiscountTypeEnum(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class PromoEligibilityEnum(str, enum.Enum):
    new_user = "new_user"
    all = "all"


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, examples=[5])
    komentar: Optional[str] = Field(None, max_length=1000, examples=["Barangnya bagus!"])


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    komentar: Optional[str] = Field(None, max_length=1000)


class PromoCodeBriefResponse(BaseModel):
    id: int
    code: str
    discount_type: DiscountTypeEnum
    discount_value: float

    class Config:
        from_attributes = True


class ItemBriefResponse(BaseModel):
    id: int
    admin_id: int
    nama: str
    foto_url: Optional[str] = None
    harga_per_hari: float

    class Config:
        from_attributes = True


class UserBriefResponse(BaseModel):
    id: int
    email: str
    nama: str

    class Config:
        from_attributes = True


class RentalResponse(BaseModel):
    id: int
    user_id: int
    item_id: int
    tanggal_mulai: date
    tanggal_selesai: date
    total_harga: float
    status: RentalStatusEnum
    catatan: Optional[str]
    
    promo_code_id: Optional[int] = None
    discount_amount: Optional[float] = None
    original_amount: Optional[float] = None
    promo_code: Optional[PromoCodeBriefResponse] = None
    
    pickup_alamat: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_nama_usaha: Optional[str] = None
    pickup_telepon: Optional[str] = None
    diambil_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    return_requested_at: Optional[datetime] = None
    payment_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    item: Optional[ItemBriefResponse] = None
    user: Optional[UserBriefResponse] = None

    class Config:
        from_attributes = True


class RentalCreate(BaseModel):
    item_id: int = Field(..., examples=[1])
    tanggal_mulai: date = Field(..., examples=["2026-04-10"])
    tanggal_selesai: date = Field(..., examples=["2026-04-15"])
    catatan: Optional[str] = Field(None, examples=["Tolong siapkan baterai cadangan"])
    promo_code: Optional[str] = Field(None, examples=["WELCOME50"], max_length=50)

    @field_validator("tanggal_selesai")
    @classmethod
    def validate_tanggal_selesai(cls, tanggal_selesai, info):
        if "tanggal_mulai" in info.data and tanggal_selesai <= info.data["tanggal_mulai"]:
            raise ValueError("Tanggal selesai harus setelah tanggal mulai")
        return tanggal_selesai

    @field_validator("promo_code")
    @classmethod
    def normalize_promo_code(cls, v):
        if v is None:
            return None
        v = v.strip().upper()
        return v or None


class RentalStatusUpdate(BaseModel):
    status: RentalStatusEnum = Field(..., examples=["disetujui"])
    catatan: Optional[str] = Field(None, examples=["Silakan ambil barang besok pagi"])


class PickupInfoResponse(BaseModel):
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
    total: int
    rentals: List[RentalResponse]


class ReviewResponse(BaseModel):
    id: int
    rental_id: int
    user_id: int
    item_id: int
    admin_id: int
    rating: int
    komentar: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_nama: Optional[str] = None
    user_foto_profil: Optional[str] = None
    item_nama: Optional[str] = None
    item_foto_url: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewSummary(BaseModel):
    average: float = 0.0
    total: int = 0
    distribution: dict = Field(default_factory=lambda: {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0})


class ReviewListResponse(BaseModel):
    summary: ReviewSummary
    total: int
    reviews: List[ReviewResponse]


# Promo Code Schemas
class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, examples=["WELCOME50"])
    nama: str = Field(..., min_length=2, max_length=40, examples=["Promo Pengguna Baru"])
    deskripsi: Optional[str] = Field(None, max_length=100, examples=["Diskon 50% untuk transaksi pertama"])

    discount_type: DiscountTypeEnum = Field(DiscountTypeEnum.percentage)
    discount_value: float = Field(..., gt=0, examples=[50])
    max_discount: Optional[float] = Field(None, ge=0, examples=[50000])
    min_order: float = Field(0.0, ge=0)

    eligibility: PromoEligibilityEnum = Field(PromoEligibilityEnum.all)
    max_uses_per_user: int = Field(1, ge=1)
    max_total_uses: Optional[int] = Field(None, ge=1)

    is_active: bool = Field(True)
    is_featured: bool = Field(False)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.match(r"^[A-Z0-9_-]+$", v):
            raise ValueError("Code hanya boleh huruf, angka, '-' atau '_'")
        return v

    @field_validator("discount_value")
    @classmethod
    def validate_discount_value(cls, v, info):
        dtype = info.data.get("discount_type")
        if dtype == DiscountTypeEnum.percentage and (v <= 0 or v > 100):
            raise ValueError("Untuk percentage, discount_value harus 1-100")
        return v


class PromoCodeUpdate(BaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=100)
    deskripsi: Optional[str] = None
    discount_type: Optional[DiscountTypeEnum] = None
    discount_value: Optional[float] = Field(None, gt=0)
    max_discount: Optional[float] = Field(None, ge=0)
    min_order: Optional[float] = Field(None, ge=0)
    eligibility: Optional[PromoEligibilityEnum] = None
    max_uses_per_user: Optional[int] = Field(None, ge=1)
    max_total_uses: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


class PromoCodeResponse(BaseModel):
    id: int
    code: str
    nama: str
    deskripsi: Optional[str]
    discount_type: DiscountTypeEnum
    discount_value: float
    max_discount: Optional[float]
    min_order: float
    eligibility: PromoEligibilityEnum
    max_uses_per_user: int
    max_total_uses: Optional[int]
    used_count: int
    is_active: bool
    is_featured: bool
    valid_from: Optional[datetime]
    valid_until: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PromoCodeListResponse(BaseModel):
    total: int
    promos: List[PromoCodeResponse]


class PromoCodePublicResponse(BaseModel):
    code: str
    nama: str
    deskripsi: Optional[str]
    discount_type: DiscountTypeEnum
    discount_value: float
    max_discount: Optional[float]
    min_order: float
    valid_until: Optional[datetime]

    class Config:
        from_attributes = True


class PromoValidateRequest(BaseModel):
    code: str
    original_amount: float = Field(..., gt=0)


class PromoValidateResponse(BaseModel):
    valid: bool
    discount_amount: float
    final_amount: float
    message: str
    promo_code_id: Optional[int] = None


class PromoRedemptionResponse(BaseModel):
    id: int
    promo_code_id: int
    user_id: int
    rental_id: int
    original_amount: float
    discount_amount: float
    final_amount: float
    redeemed_at: datetime

    class Config:
        from_attributes = True


class PromoRedemptionListResponse(BaseModel):
    total: int
    redemptions: List[PromoRedemptionResponse]
