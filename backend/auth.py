"""
auth.py — JWT Authentication & Role-Based Authorization Sewain
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole

load_dotenv()

# Konfigurasi dari environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development-minimum-32")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Password hashing menggunakan bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — FastAPI akan mencari header "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==================== PASSWORD ====================

def hash_password(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password terhadap hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ==================== JWT TOKEN ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Buat JWT access token dengan expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode dan verifikasi JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== DEPENDENCY: Get Current User ====================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency: Ambil current user dari JWT token.
    Gunakan di semua endpoint yang butuh autentikasi.
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid: user_id tidak ditemukan",
        )
    user_id = int(user_id)

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif. Hubungi administrator.",
        )

    return user


# ==================== ROLE-BASED DEPENDENCIES ====================

def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Hanya Super Admin yang bisa akses.
    Gunakan di endpoint manajemen platform.
    """
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Super Admin.",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Admin DAN Super Admin bisa akses.
    Gunakan di endpoint kelola barang & penyewaan.
    """
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Admin atau Super Admin.",
        )
    return current_user


def require_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: User yang sudah login (semua role).
    Gunakan di endpoint yang bisa diakses semua.
    """
    return current_user


def require_verified_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: User dengan role 'user' yang sudah terverifikasi identitasnya.
    Gunakan di endpoint ajukan sewa.
    """
    if current_user.role != UserRole.user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint ini hanya untuk penyewa (user).",
        )
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda belum terverifikasi. Lengkapi data diri dan upload KTP terlebih dahulu.",
        )
    return current_user