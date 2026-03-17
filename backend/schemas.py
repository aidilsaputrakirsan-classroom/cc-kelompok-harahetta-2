from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re


# ============================================================
# ITEM SCHEMAS
# ============================================================

class ItemBase(BaseModel):
    """Base schema — field yang dipakai untuk create & update."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Laptop"])
    description: Optional[str] = Field(None, examples=["Laptop untuk cloud computing"])
    price: float = Field(..., gt=0, examples=[15000000])
    quantity: int = Field(0, ge=0, examples=[10])


class ItemCreate(ItemBase):
    """Schema untuk membuat item baru."""
    pass


class ItemUpdate(BaseModel):
    """
    Schema untuk update item.
    Semua field optional karena update bisa sebagian.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


class ItemResponse(ItemBase):
    """Schema response item."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    """Response untuk list item dengan total count."""
    total: int
    items: list[ItemResponse]


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user."""
    
    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Aidil Saputra"]
    )

    password: str = Field(
        ...,
        min_length=8,
        examples=["Password123!"]
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        """
        Password rules:
        - minimal 8 karakter
        - minimal 1 huruf besar
        - minimal 1 huruf kecil
        - minimal 1 angka
        """
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
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema untuk login."""

    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    password: str = Field(..., examples=["Password123!"])


class TokenResponse(BaseModel):
    """Response setelah login berhasil."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse