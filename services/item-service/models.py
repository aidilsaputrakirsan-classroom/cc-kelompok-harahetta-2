import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Enum as SAEnum, ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ItemStatus(str, enum.Enum):
    available = "available"
    rented = "rented"
    unavailable = "unavailable"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(50), unique=True, nullable=False, index=True)
    deskripsi = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    items = relationship("Item", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, nama='{self.nama}')>"


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, nullable=False)  # Reference to AdminProfile in auth-service (no physical FK)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    nama = Column(String(100), nullable=False, index=True)
    deskripsi = Column(Text, nullable=True)
    harga_per_hari = Column(Float, nullable=False)
    stok = Column(Integer, nullable=False, default=1)
    foto_url = Column(Text, nullable=True)
    status = Column(SAEnum(ItemStatus), nullable=False, default=ItemStatus.available)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    category = relationship("Category", back_populates="items")

    def __repr__(self):
        return f"<Item(id={self.id}, nama='{self.nama}', harga_per_hari={self.harga_per_hari})>"
