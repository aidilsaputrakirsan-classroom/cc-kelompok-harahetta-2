import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import bcrypt
import jwt

from database import engine, get_db, Base
from models import User, AdminProfile, UserProfile, UserRole, VerificationStatus
from schemas import (
    UserCreate, UserResponse, TokenResponse, UserUpdateByAdmin,
    EmailVerifyRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserMeUpdate, AdminProfileCreate, AdminProfileUpdate, AdminProfileResponse,
    AdminCreateRequest, AdminPaymentInfoResponse, UserProfileCreate, UserProfileUpdate,
    UserProfileResponse, VerificationAction, TokenVerifyResponse
)
import email_service

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auth Service",
    description="Authentication and User Management Microservice for Sewain",
    version="2.0.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing helper
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development-minimum-32")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Dependencies
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid: user_id tidak ditemukan",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
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

def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Super Admin.",
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Admin atau Super Admin.",
        )
    return current_user

# ==========================================
# PUBLIC INFO / HEALTH
# ==========================================
@app.get("/health")
def health():
    return {"status": "healthy", "service": "auth-service"}

@app.get("/team")
def team_info():
    return {
        "team": "Kelompok Harahetta-2",
        "institution": "Sistem Informasi — Institut Teknologi Kalimantan",
        "course": "Komputasi Awan",
        "app": "Sewain — Platform Sewa Barang Online",
        "members": [
            {"nama": "Djaky Abbyyu Fauzan Timumum", "nim": "10231032", "peran": "Lead Backend"},
            {"nama": "Achmad Zaki Zaidan", "nim": "10231002", "peran": "Lead Frontend"},
            {"nama": "Muhammad Alif Setiawan", "nim": "10231056", "peran": "Lead DevOps"},
            {"nama": "Riqqah Khalda Karina", "nim": "10231082", "peran": "Lead QA & Docs"},
        ],
    }

@app.get("/stats/public")
def public_stats(db: Session = Depends(get_db)):
    active_users = db.query(User).filter(
        User.role == UserRole.user,
        User.is_active == True,
        User.email_verified_at.isnot(None),
    ).count()
    return {"active_users": active_users}

# ==========================================
# AUTH ENDPOINTS
# ==========================================
@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        if existing.email_verified_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email sudah terdaftar dan terverifikasi. Silakan login atau gunakan fitur lupa password.",
            )
        existing.nama = user_data.nama
        existing.hashed_password = hash_password(user_data.password)
        db.commit()
        db.refresh(existing)
        user = existing
    else:
        user = User(
            email=user_data.email,
            nama=user_data.nama,
            hashed_password=hash_password(user_data.password),
            role=UserRole.user,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = email_service.create_verification_token(user.id)
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.nama,
        token,
    )
    return user

@app.post("/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan. Hubungi administrator.",
        )
    if user.role == UserRole.user and not user.email_verified_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email belum diverifikasi. Silakan cek inbox email Anda untuk link verifikasi.",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/auth/me", response_model=UserResponse)
def update_me(data: UserMeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payload = data.model_dump(exclude_unset=True)
    if "nama" in payload:
        nama = (payload["nama"] or "").strip()
        if len(nama) < 2:
            raise HTTPException(status_code=422, detail="Nama minimal 2 karakter")
        current_user.nama = nama

    if "foto_profil" in payload:
        foto = payload["foto_profil"]
        if foto is None or foto == "":
            current_user.foto_profil = None
        else:
            if len(foto) > 5_500_000:
                raise HTTPException(
                    status_code=413,
                    detail="Foto terlalu besar. Mohon kompres ke ukuran lebih kecil.",
                )
            current_user.foto_profil = foto

    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/auth/verify-email")
def verify_email(data: EmailVerifyRequest, db: Session = Depends(get_db)):
    payload = email_service.decode_email_token(data.token, "verify_email")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token verifikasi tidak valid atau sudah expired. Silakan minta kirim ulang.",
        )
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    if user.email_verified_at:
        return {"message": "Email sudah diverifikasi sebelumnya. Silakan login."}
    user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Email berhasil diverifikasi. Silakan login."}

@app.post("/auth/resend-verification")
def resend_verification(data: ResendVerificationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar.")
    if user.email_verified_at:
        return {"message": "Email sudah terverifikasi. Silakan login."}
    token = email_service.create_verification_token(user.id)
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.nama,
        token,
    )
    return {"message": "Email verifikasi baru telah dikirim."}

@app.post("/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar.")
    token = email_service.create_reset_password_token(user.id)
    background_tasks.add_task(
        email_service.send_reset_password_email,
        user.email,
        user.nama,
        token,
    )
    return {"message": "Link reset password telah dikirim ke email Anda."}

@app.post("/auth/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = email_service.decode_email_token(data.token, "reset_password")
    if not payload:
        raise HTTPException(status_code=400, detail="Token reset password tidak valid atau sudah expired.")
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    user.hashed_password = hash_password(data.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password berhasil diubah. Silakan login dengan password baru."}

# ==========================================
# INTER-SERVICE VERIFICATION ENDPOINT
# ==========================================
@app.get("/verify", response_model=TokenVerifyResponse)
def verify_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return user
    
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    return user

# ==========================================
# PROFILE & VERIFICATION ENDPOINTS
# ==========================================
@app.get("/profile", response_model=UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@app.put("/profile", response_model=UserProfileResponse)
def update_my_profile(data: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(profile, field, value)

    # Auto-verify check
    if (profile.alamat and profile.alamat.strip() and
        profile.nomor_telepon and profile.nomor_telepon.strip() and
        profile.foto_ktp and profile.foto_ktp.strip() and
        profile.foto_selfie_ktp and profile.foto_selfie_ktp.strip()):
        profile.status_verifikasi = VerificationStatus.disetujui
        current_user.is_verified = True

    db.commit()
    db.refresh(profile)
    return profile

# ==========================================
# ADMIN PROFILE ENDPOINTS
# ==========================================
@app.post("/admin/profile", response_model=AdminProfileResponse, status_code=201)
def create_admin_profile(data: AdminProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profil admin sudah ada.")
    profile = AdminProfile(
        user_id=current_user.id,
        nama_usaha=data.nama_usaha,
        alamat_usaha=data.alamat_usaha,
        nomor_telepon=data.nomor_telepon,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@app.get("/admin/profile", response_model=AdminProfileResponse)
def get_my_admin_profile(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil admin belum dibuat.")
    return profile

@app.put("/admin/profile", response_model=AdminProfileResponse)
def update_my_admin_profile(data: AdminProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil admin tidak ditemukan.")
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile

@app.get("/admins/{admin_id}/payment-info", response_model=AdminPaymentInfoResponse)
def get_admin_payment_info(admin_id: int, db: Session = Depends(get_db)):
    profile = db.query(AdminProfile).filter(AdminProfile.id == admin_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Admin tidak ditemukan.")
    return profile

@app.get("/users/{user_id}/admin-profile", response_model=AdminPaymentInfoResponse)
def get_admin_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Lookup admin profile by user_id (used internally by item-service and rental-service)."""
    profile = db.query(AdminProfile).filter(AdminProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil admin tidak ditemukan untuk user ini.")
    return profile

@app.get("/admins/{admin_id}/shop")
def get_shop(admin_id: int, db: Session = Depends(get_db)):
    profile = db.query(AdminProfile).filter(AdminProfile.id == admin_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan.")
    return {
        "admin_id": profile.id,
        "user_id": profile.user_id,
        "nama_usaha": profile.nama_usaha,
        "alamat_usaha": profile.alamat_usaha,
        "nomor_telepon": profile.nomor_telepon,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "foto_profil": (profile.user.foto_profil if profile.user else None),
        "is_verified": bool(profile.user.is_verified) if profile.user else False,
        "created_at": profile.created_at,
        "total_items": 0,
        "rating": {
            "average": 0.0,
            "total": 0,
            "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        }
    }

# ==========================================
# SUPER ADMIN ENDPOINTS
# ==========================================
@app.get("/superadmin/users")
def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    query = db.query(User)
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "users": users}

@app.put("/superadmin/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdateByAdmin,
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@app.delete("/superadmin/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    db.delete(user)
    db.commit()
    return None

@app.get("/superadmin/verifications")
def pending_verifications(
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    profiles = db.query(UserProfile).filter(UserProfile.status_verifikasi == VerificationStatus.menunggu).all()
    # Populate user info
    result = []
    for profile in profiles:
        result.append({
            "id": profile.id,
            "user_id": profile.user_id,
            "nama_orang_tua": profile.nama_orang_tua,
            "alamat": profile.alamat,
            "nomor_telepon": profile.nomor_telepon,
            "foto_ktp": profile.foto_ktp,
            "foto_selfie_ktp": profile.foto_selfie_ktp,
            "status_verifikasi": profile.status_verifikasi,
            "updated_at": profile.updated_at,
            "user": profile.user
        })
    return result

@app.put("/superadmin/users/{user_id}/verify", response_model=UserProfileResponse)
def verify_user_identity(
    user_id: int,
    action: VerificationAction,
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil user tidak ditemukan.")
    profile.status_verifikasi = action.status
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_verified = (action.status == VerificationStatus.disetujui)
    db.commit()
    db.refresh(profile)
    return profile

@app.get("/superadmin/admins")
def list_all_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    query = db.query(AdminProfile)
    total = query.count()
    admins = query.order_by(AdminProfile.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "admins": admins}

@app.post("/superadmin/admins", response_model=AdminProfileResponse, status_code=201)
def create_admin_by_superadmin(
    data: AdminCreateRequest,
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar.")

    new_user = User(
        email=data.email,
        nama=data.nama,
        hashed_password=hash_password(data.password),
        role=UserRole.admin,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    admin_profile = AdminProfile(
        user_id=new_user.id,
        nama_usaha=data.nama_usaha,
        alamat_usaha=data.alamat_usaha,
        nomor_telepon=data.nomor_telepon,
    )
    db.add(admin_profile)
    db.commit()
    db.refresh(admin_profile)

    return admin_profile

@app.get("/superadmin/stats")
def platform_stats(
    db: Session = Depends(get_db),
    super_admin: User = Depends(require_super_admin)
):
    """Dashboard statistik keseluruhan platform Sewain (dari sisi user & admin)."""
    from sqlalchemy import func
    total_users = db.query(func.count(User.id)).filter(User.role == UserRole.user).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.admin).scalar() or 0
    pending_verif = db.query(func.count(UserProfile.id)).filter(
        UserProfile.status_verifikasi == VerificationStatus.menunggu
    ).scalar() or 0
    total_admin_profiles = db.query(func.count(AdminProfile.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_items": 0,       # from item-service (not available here)
        "total_rentals": 0,     # from rental-service (not available here)
        "pending_rentals": 0,   # from rental-service (not available here)
        "pending_verifications": pending_verif,
        "total_revenue": 0.0,   # from payment-service (not available here)
        "total_admin_profiles": total_admin_profiles,
    }
