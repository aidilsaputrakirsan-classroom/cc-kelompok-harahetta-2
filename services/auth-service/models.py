import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Boolean, Enum as SAEnum, ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class VerificationStatus(str, enum.Enum):
    menunggu = "menunggu"
    disetujui = "disetujui"
    ditolak = "ditolak"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.user)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    foto_profil = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    user_profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class AdminProfile(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    nama_usaha = Column(String(100), nullable=False)
    alamat_usaha = Column(Text, nullable=True)
    nomor_telepon = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="admin_profile")

    def __repr__(self):
        return f"<AdminProfile(id={self.id}, nama_usaha='{self.nama_usaha}')>"


class UserProfile(Base):
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
