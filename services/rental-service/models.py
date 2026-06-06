import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean,
    Enum as SAEnum, Date, ForeignKey, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class RentalStatus(str, enum.Enum):
    pending = "pending"
    disetujui = "disetujui"
    sedang_disewa = "sedang_disewa"
    selesai = "selesai"
    ditolak = "ditolak"


class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class PromoEligibility(str, enum.Enum):
    new_user = "new_user"
    all = "all"


class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)  # Ref user in auth-service
    item_id = Column(Integer, nullable=False, index=True)  # Ref item in catalog-service
    tanggal_mulai = Column(Date, nullable=False)
    tanggal_selesai = Column(Date, nullable=False)
    total_harga = Column(Float, nullable=False)
    status = Column(SAEnum(RentalStatus), nullable=False, default=RentalStatus.pending)
    catatan = Column(Text, nullable=True)
    
    # Promo
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="SET NULL"), nullable=True)
    discount_amount = Column(Float, nullable=True, default=0.0)
    original_amount = Column(Float, nullable=True)
    
    # Pickup details snapshot
    pickup_alamat = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    pickup_nama_usaha = Column(String(100), nullable=True)
    pickup_telepon = Column(String(20), nullable=True)
    
    diambil_at = Column(DateTime(timezone=True), nullable=True)
    due_at = Column(DateTime(timezone=True), nullable=True)
    return_requested_at = Column(DateTime(timezone=True), nullable=True)
    payment_deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    promo_code = relationship("PromoCode", foreign_keys=[promo_code_id])
    promo_redemption = relationship("PromoRedemption", back_populates="rental", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Rental(id={self.id}, user_id={self.user_id}, item_id={self.item_id}, status='{self.status}')>"


class Review(Base):
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
    user_id = Column(Integer, nullable=False)   # Ref user in auth-service
    item_id = Column(Integer, nullable=False)   # Ref item in catalog-service
    admin_id = Column(Integer, nullable=False)  # Ref admin in auth-service
    rating = Column(Integer, nullable=False)
    komentar = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    rental = relationship("Rental", foreign_keys=[rental_id])

    def __repr__(self):
        return f"<Review(id={self.id}, rental_id={self.rental_id}, rating={self.rating})>"


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    deskripsi = Column(Text, nullable=True)

    discount_type = Column(SAEnum(DiscountType), nullable=False, default=DiscountType.percentage)
    discount_value = Column(Float, nullable=False)
    max_discount = Column(Float, nullable=True)
    min_order = Column(Float, nullable=False, default=0.0)

    eligibility = Column(SAEnum(PromoEligibility), nullable=False, default=PromoEligibility.all)
    max_uses_per_user = Column(Integer, nullable=False, default=1)
    max_total_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, nullable=False, default=0)

    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(Integer, nullable=True)  # Ref user in auth-service
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    redemptions = relationship("PromoRedemption", back_populates="promo_code", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PromoCode(id={self.id}, code='{self.code}', value={self.discount_value})>"


class PromoRedemption(Base):
    __tablename__ = "promo_redemptions"
    __table_args__ = (
        Index("ix_promo_redemption_user", "user_id"),
        Index("ix_promo_redemption_promo", "promo_code_id"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, nullable=False)  # Ref user in auth-service
    rental_id = Column(Integer, ForeignKey("rentals.id", ondelete="CASCADE"), unique=True, nullable=False)

    original_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False)
    final_amount = Column(Float, nullable=False)

    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())

    promo_code = relationship("PromoCode", back_populates="redemptions")
    rental = relationship("Rental", back_populates="promo_redemption", foreign_keys=[rental_id])

    def __repr__(self):
        return f"<PromoRedemption(id={self.id}, promo_code_id={self.promo_code_id}, user_id={self.user_id}, discount={self.discount_amount})>"
