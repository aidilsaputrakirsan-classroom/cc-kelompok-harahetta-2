import enum
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ItemStatusEnum(str, enum.Enum):
    available = "available"
    rented = "rented"
    unavailable = "unavailable"


class CategoryCreate(BaseModel):
    nama: str = Field(..., min_length=2, max_length=50, examples=["Elektronik"])
    deskripsi: Optional[str] = Field(None, examples=["Perangkat elektronik dan gadget"])


class CategoryUpdate(BaseModel):
    nama: Optional[str] = Field(None, max_length=50)
    deskripsi: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    nama: str
    deskripsi: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    category_id: Optional[int] = Field(None, examples=[1])
    nama: str = Field(..., min_length=1, max_length=100, examples=["Kamera Sony A7III"])
    deskripsi: Optional[str] = Field(None, examples=["Kamera mirrorless full frame"])
    harga_per_hari: float = Field(..., gt=0, examples=[250000.0])
    stok: int = Field(1, ge=0, examples=[3])
    foto_url: Optional[str] = Field(None, examples=["https://storage.sewain.id/items/kamera1.jpg"])


class ItemUpdate(BaseModel):
    category_id: Optional[int] = None
    nama: Optional[str] = Field(None, max_length=100)
    deskripsi: Optional[str] = None
    harga_per_hari: Optional[float] = Field(None, gt=0)
    stok: Optional[int] = Field(None, ge=0)
    foto_url: Optional[str] = None
    status: Optional[ItemStatusEnum] = None


class ItemResponse(BaseModel):
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
    admin_nama_usaha: Optional[str] = None
    admin_alamat_usaha: Optional[str] = None
    admin_kota: Optional[str] = None

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    total: int
    items: List[ItemResponse]
