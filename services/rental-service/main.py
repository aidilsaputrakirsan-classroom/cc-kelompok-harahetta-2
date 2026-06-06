import os
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from database import engine, get_db, Base
from models import Rental, Review, PromoCode, PromoRedemption, RentalStatus, DiscountType, PromoEligibility
from schemas import (
    RentalCreate, RentalStatusUpdate, RentalResponse, RentalListResponse,
    PickupInfoResponse, ReviewCreate, ReviewUpdate, ReviewResponse, ReviewListResponse,
    PromoCodeCreate, PromoCodeUpdate, PromoCodeResponse, PromoCodeListResponse,
    PromoCodePublicResponse, PromoValidateRequest, PromoValidateResponse,
    PromoRedemptionListResponse
)
from auth_client import verify_token_with_auth_service, get_admin_profile, get_admin_profile_by_user_id, get_user_profile, auth_circuit
from catalog_client import get_item_details, update_item_status, decrement_item_stock, restore_item_stock, catalog_circuit
from payment_client import create_payment_auto, cancel_payment_by_rental, credit_wallet_on_complete, check_payment_completed, payment_circuit

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rental Service",
    description="Rental, Booking, and Promo Microservice for Sewain",
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


# Helper: Check Roles
def check_admin(user: dict):
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Admin atau Super Admin."
        )

def check_super_admin(user: dict):
    if user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Halaman ini hanya untuk Super Admin."
        )

# Helper: Price calculation
def _calculate_total_harga(harga_per_hari: float, mulai: date, selesai: date) -> float:
    delta = selesai - mulai
    hari = delta.days
    if hari <= 0:
        return 0.0
    return hari * harga_per_hari

# Helper: Promo validation internal logic
def _is_user_eligible_new_user(db: Session, user_id: int) -> bool:
    count = db.query(func.count(Rental.id)).filter(
        Rental.user_id == user_id,
        Rental.status.in_([
            RentalStatus.disetujui,
            RentalStatus.sedang_disewa,
            RentalStatus.selesai,
        ]),
    ).scalar() or 0
    return count == 0

def _calculate_promo_discount(promo: PromoCode, original_amount: float) -> float:
    if promo.discount_type == DiscountType.percentage:
        discount = original_amount * (promo.discount_value / 100.0)
    else:
        discount = promo.discount_value

    if promo.max_discount is not None and discount > promo.max_discount:
        discount = promo.max_discount

    if discount > original_amount:
        discount = original_amount

    return int(discount)

def _validate_promo_logic(db: Session, user_id: int, code: str, original_amount: float) -> dict:
    code_norm = (code or "").strip().upper()
    if not code_norm:
        return {"valid": False, "message": "Kode promo tidak boleh kosong"}

    promo = db.query(PromoCode).filter(func.upper(PromoCode.code) == code_norm).first()
    if not promo:
        return {"valid": False, "message": "Kode promo tidak ditemukan"}

    if not promo.is_active:
        return {"valid": False, "message": "Promo sedang tidak aktif"}

    now = datetime.now()
    if promo.valid_from and promo.valid_from.replace(tzinfo=None) > now:
        return {"valid": False, "message": "Promo belum berlaku"}
    if promo.valid_until and promo.valid_until.replace(tzinfo=None) < now:
        return {"valid": False, "message": "Promo sudah kadaluarsa"}

    if promo.max_total_uses is not None and promo.used_count >= promo.max_total_uses:
        return {"valid": False, "message": "Kuota promo sudah habis"}

    user_use_count = db.query(func.count(PromoRedemption.id)).filter(
        PromoRedemption.promo_code_id == promo.id,
        PromoRedemption.user_id == user_id,
    ).scalar() or 0
    if user_use_count >= (promo.max_uses_per_user or 1):
        return {"valid": False, "message": "Anda sudah pernah memakai promo ini"}

    if promo.eligibility == PromoEligibility.new_user:
        if not _is_user_eligible_new_user(db, user_id):
            return {"valid": False, "message": "Promo ini khusus pengguna baru"}

    if original_amount < (promo.min_order or 0):
        return {
            "valid": False,
            "message": f"Minimum order Rp {int(promo.min_order):,} tidak terpenuhi".replace(",", "."),
        }

    discount_amount = _calculate_promo_discount(promo, original_amount)
    return {
        "valid": True,
        "message": "Promo dapat digunakan",
        "promo": promo,
        "discount_amount": discount_amount,
    }


# Helper: Enrich single Rental response
async def enrich_rental(rental: Rental) -> dict:
    item_brief = None
    user_brief = None
    
    # Call catalog service
    try:
        item_data = await get_item_details(rental.item_id)
        if item_data:
            item_brief = {
                "id": item_data["id"],
                "admin_id": item_data["admin_id"],
                "nama": item_data["nama"],
                "foto_url": item_data.get("foto_url"),
                "harga_per_hari": item_data["harga_per_hari"]
            }
    except Exception:
        pass

    # Call auth service
    try:
        user_data = await get_user_profile(rental.user_id)
        if user_data:
            user_brief = {
                "id": user_data["id"],
                "email": user_data["email"],
                "nama": user_data["nama"]
            }
    except Exception:
        pass

    promo_code_brief = None
    if rental.promo_code:
        promo_code_brief = {
            "id": rental.promo_code.id,
            "code": rental.promo_code.code,
            "discount_type": rental.promo_code.discount_type,
            "discount_value": rental.promo_code.discount_value
        }

    return {
        "id": rental.id,
        "user_id": rental.user_id,
        "item_id": rental.item_id,
        "tanggal_mulai": rental.tanggal_mulai,
        "tanggal_selesai": rental.tanggal_selesai,
        "total_harga": rental.total_harga,
        "status": rental.status,
        "catatan": rental.catatan,
        "promo_code_id": rental.promo_code_id,
        "discount_amount": rental.discount_amount,
        "original_amount": rental.original_amount,
        "promo_code": promo_code_brief,
        "pickup_alamat": rental.pickup_alamat,
        "pickup_latitude": rental.pickup_latitude,
        "pickup_longitude": rental.pickup_longitude,
        "pickup_nama_usaha": rental.pickup_nama_usaha,
        "pickup_telepon": rental.pickup_telepon,
        "diambil_at": rental.diambil_at,
        "due_at": rental.due_at,
        "return_requested_at": rental.return_requested_at,
        "payment_deadline": rental.payment_deadline,
        "created_at": rental.created_at,
        "updated_at": rental.updated_at,
        "item": item_brief,
        "user": user_brief
    }


# Helper: Enrich single Review response
async def enrich_review(review: Review) -> dict:
    user_nama = None
    user_foto_profil = None
    item_nama = None
    item_foto_url = None

    try:
        user_data = await get_user_profile(review.user_id)
        if user_data:
            user_nama = user_data["nama"]
            user_foto_profil = user_data.get("foto_profil")
    except Exception:
        pass

    try:
        item_data = await get_item_details(review.item_id)
        if item_data:
            item_nama = item_data["nama"]
            item_foto_url = item_data.get("foto_url")
    except Exception:
        pass

    return {
        "id": review.id,
        "rental_id": review.rental_id,
        "user_id": review.user_id,
        "item_id": review.item_id,
        "admin_id": review.admin_id,
        "rating": review.rating,
        "komentar": review.komentar,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        "user_nama": user_nama,
        "user_foto_profil": user_foto_profil,
        "item_nama": item_nama,
        "item_foto_url": item_foto_url
    }


VALID_RENTAL_TRANSITIONS = {
    RentalStatus.pending: [RentalStatus.disetujui, RentalStatus.ditolak],
    RentalStatus.disetujui: [RentalStatus.sedang_disewa, RentalStatus.ditolak],
    RentalStatus.sedang_disewa: [RentalStatus.selesai],
    RentalStatus.selesai: [],
    RentalStatus.ditolak: [],
}

# ==========================================
# HEALTH & RELIABILITY STATUS
# ==========================================
@app.get("/health")
def health():
    auth_status = auth_circuit.get_status()
    catalog_status = catalog_circuit.get_status()
    payment_status = payment_circuit.get_status()
    overall = "healthy" if (auth_status["state"] == "CLOSED" and catalog_status["state"] == "CLOSED") else "degraded"
    return {
        "status": overall,
        "service": "rental-service",
        "dependencies": {
            "auth-service": auth_status,
            "catalog-service": catalog_status,
            "payment-service": payment_status,
        }
    }


# ==========================================
# RENTALS ENDPOINTS
# ==========================================
@app.post("/rentals", response_model=RentalResponse, status_code=201)
async def create_rental(
    data: RentalCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    if user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Hanya penyewa (user) yang bisa membuat rental.")
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Anda belum terverifikasi. Lengkapi data diri dan upload KTP terlebih dahulu.")

    # Call catalog service to fetch item details
    item = await get_item_details(data.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    if item["status"] != "available":
        raise HTTPException(status_code=400, detail="Barang tidak tersedia untuk disewa saat ini")
    if item["stok"] <= 0:
        raise HTTPException(status_code=400, detail="Stok barang habis")

    original_amount = _calculate_total_harga(item["harga_per_hari"], data.tanggal_mulai, data.tanggal_selesai)
    if original_amount <= 0:
        raise HTTPException(status_code=400, detail="Durasi sewa tidak valid")

    promo = None
    discount_amount = 0.0
    if data.promo_code:
        validation = _validate_promo_logic(db=db, user_id=user["id"], code=data.promo_code, original_amount=original_amount)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["message"])
        promo = validation["promo"]
        discount_amount = validation["discount_amount"]

    final_amount = max(0.0, original_amount - discount_amount)

    # Decrement stock in catalog-service
    await decrement_item_stock(data.item_id)

    rental = Rental(
        user_id=user["id"],
        item_id=data.item_id,
        tanggal_mulai=data.tanggal_mulai,
        tanggal_selesai=data.tanggal_selesai,
        total_harga=final_amount,
        original_amount=original_amount,
        discount_amount=discount_amount if promo else 0.0,
        promo_code_id=promo.id if promo else None,
        catatan=data.catatan,
    )
    db.add(rental)
    db.flush()

    if promo:
        redemption = PromoRedemption(
            promo_code_id=promo.id,
            user_id=user["id"],
            rental_id=rental.id,
            original_amount=original_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
        )
        db.add(redemption)
        promo.used_count = (promo.used_count or 0) + 1

    db.commit()
    db.refresh(rental)

    return await enrich_rental(rental)

@app.get("/rentals/my", response_model=RentalListResponse)
async def my_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    query = db.query(Rental).filter(Rental.user_id == user["id"])
    if status_filter:
        try:
            status_enum = RentalStatus(status_filter)
            query = query.filter(Rental.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    rentals = query.order_by(Rental.created_at.desc()).offset(skip).limit(limit).all()
    
    enriched = []
    for r in rentals:
        enriched.append(await enrich_rental(r))
    return {"total": total, "rentals": enriched}

@app.get("/rentals/{rental_id}", response_model=RentalResponse)
async def get_rental(
    rental_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
        
    # Superadmin/Admin can see, or the user who owns it
    if user["role"] == "user" and rental.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    return await enrich_rental(rental)

@app.get("/admin/rentals", response_model=RentalListResponse)
async def admin_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    
    query = db.query(Rental)
    if user["role"] != "super_admin":
        # Get admin profile to get admin_id
        admin_profile = await get_admin_profile_by_user_id(user["id"])
        if not admin_profile:
            raise HTTPException(status_code=400, detail="Profil admin tidak ditemukan.")
            
        # Get item ids owned by this admin
        item_data = await get_item_details(0) # or get all, actually just filter rentals
        # To do this in microservices: rental service stores item_id, we can list rentals and filter by admin_id from catalog.
        # But for list_my_rentals for admin: we can fetch all rentals, call catalog to check if item belongs to admin.
        # This is a bit slow but correct for demo compose context.
        # Alternatively, we can assume we filter on python side.
        all_rentals = query.all()
        admin_rentals = []
        for r in all_rentals:
            try:
                item_details = await get_item_details(r.item_id)
                if item_details and item_details.get("admin_id") == admin_profile["id"]:
                    admin_rentals.append(r)
            except Exception:
                pass
                
        # Filter status
        if status_filter:
            admin_rentals = [r for r in admin_rentals if r.status.value == status_filter]
            
        total = len(admin_rentals)
        paginated = admin_rentals[skip:skip + limit]
        enriched = []
        for r in paginated:
            enriched.append(await enrich_rental(r))
        return {"total": total, "rentals": enriched}
    else:
        if status_filter:
            try:
                status_enum = RentalStatus(status_filter)
                query = query.filter(Rental.status == status_enum)
            except ValueError:
                pass
        total = query.count()
        rentals = query.order_by(Rental.created_at.desc()).offset(skip).limit(limit).all()
        enriched = []
        for r in rentals:
            enriched.append(await enrich_rental(r))
        return {"total": total, "rentals": enriched}

@app.put("/rentals/{rental_id}/status", response_model=RentalResponse)
async def update_rental_status(
    rental_id: int,
    data: RentalStatusUpdate,
    authorization: str = Header(...),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")

    item_details = await get_item_details(rental.item_id)
    if not item_details:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan di katalog.")

    # Authorization check
    if user["role"] != "super_admin":
        admin_profile = await get_admin_profile_by_user_id(user["id"])
        if not admin_profile or item_details["admin_id"] != admin_profile["id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan pemilik barang ini.")

    old_status = rental.status
    allowed_transitions = VALID_RENTAL_TRANSITIONS.get(old_status, [])
    if data.status not in allowed_transitions:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat mengubah status dari '{old_status.value}' ke '{data.status.value}'. Transisi tidak valid."
        )

    rental.status = data.status
    if data.catatan:
        rental.catatan = data.catatan

    if data.status == RentalStatus.disetujui and old_status == RentalStatus.pending:
        rental.payment_deadline = datetime.now(timezone.utc) + timedelta(hours=24)
        
        # Fetch pickup details
        admin_info = await get_admin_profile(item_details["admin_id"])
        if admin_info:
            rental.pickup_alamat = admin_info.get("alamat_usaha")
            rental.pickup_latitude = admin_info.get("latitude")
            rental.pickup_longitude = admin_info.get("longitude")
            rental.pickup_nama_usaha = admin_info.get("nama_usaha")
            rental.pickup_telepon = admin_info.get("nomor_telepon")
            
        # Call payment-service to auto-create payment
        await create_payment_auto(rental.id, rental.user_id, item_details["admin_id"], rental.total_harga)

    elif data.status in [RentalStatus.selesai, RentalStatus.ditolak]:
        # Restore stock in catalog
        await restore_item_stock(rental.item_id)
        # Update status in catalog to available
        await update_item_status(rental.item_id, "available", authorization)

        if data.status == RentalStatus.ditolak:
            # Cancel payment
            await cancel_payment_by_rental(rental.id)

        if data.status == RentalStatus.selesai:
            # Credit wallet
            await credit_wallet_on_complete(item_details["admin_id"], rental.total_harga, rental.id)

    db.commit()
    db.refresh(rental)
    return await enrich_rental(rental)

@app.get("/rentals/{rental_id}/pickup", response_model=PickupInfoResponse)
async def get_rental_pickup_info(
    rental_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
        
    if rental.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    # Check if payment is completed
    is_paid = await check_payment_completed(rental.id)
    if not is_paid:
        raise HTTPException(status_code=400, detail="Pembayaran belum lunas atau belum diverifikasi.")

    if not rental.pickup_alamat:
        raise HTTPException(status_code=400, detail="Informasi pickup belum siap.")

    item_details = await get_item_details(rental.item_id)
    item_nama = item_details.get("nama", "Barang Sewa")

    return {
        "rental_id": rental.id,
        "pickup_alamat": rental.pickup_alamat,
        "pickup_latitude": rental.pickup_latitude,
        "pickup_longitude": rental.pickup_longitude,
        "pickup_nama_usaha": rental.pickup_nama_usaha,
        "pickup_telepon": rental.pickup_telepon,
        "tanggal_mulai": rental.tanggal_mulai,
        "tanggal_selesai": rental.tanggal_selesai,
        "item_nama": item_nama
    }

@app.put("/rentals/{rental_id}/confirm-pickup")
async def confirm_pickup(
    rental_id: int,
    authorization: str = Header(...),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")

    item_details = await get_item_details(rental.item_id)
    if not item_details:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")

    if user["role"] != "super_admin":
        admin_profile = await get_admin_profile_by_user_id(user["id"])
        if not admin_profile or item_details["admin_id"] != admin_profile["id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan pemilik barang ini.")

    if rental.status != RentalStatus.disetujui:
        raise HTTPException(status_code=400, detail="Pengambilan hanya bisa dikonfirmasi untuk rental yang disetujui.")

    is_paid = await check_payment_completed(rental.id)
    if not is_paid:
        raise HTTPException(status_code=400, detail="Pengambilan tidak dapat dilakukan karena pembayaran belum selesai.")

    rental.status = RentalStatus.sedang_disewa
    rental.diambil_at = datetime.now()
    
    # Calculate due date (24h * durasi)
    durasi = (rental.tanggal_selesai - rental.tanggal_mulai).days
    rental.due_at = rental.diambil_at + timedelta(days=durasi)

    # Set item status to rented in catalog
    await update_item_status(rental.item_id, "rented", authorization)

    db.commit()
    db.refresh(rental)
    return {"message": "Pengambilan barang berhasil dikonfirmasi.", "rental": await enrich_rental(rental)}

@app.post("/rentals/{rental_id}/request-return")
async def request_return(
    rental_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")

    if rental.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Rental ini bukan milik Anda")

    if rental.status != RentalStatus.sedang_disewa:
        raise HTTPException(status_code=400, detail="Hanya rental dengan status 'sedang_disewa' yang bisa di-request pengembalian.")

    if rental.return_requested_at:
        raise HTTPException(status_code=400, detail="Pengembalian sudah pernah di-request.")

    rental.return_requested_at = datetime.now()
    db.commit()
    return {"message": "Permintaan pengembalian berhasil dikirim. Tunggu konfirmasi admin."}


# ==========================================
# INTERNAL ROUTE FOR CANCEL FROM PAYMENT
# ==========================================
@app.put("/rentals/internal/{rental_id}/cancel-from-payment")
async def cancel_from_payment(
    rental_id: int,
    db: Session = Depends(get_db)
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
        
    if rental.status in [RentalStatus.pending, RentalStatus.disetujui]:
        rental.status = RentalStatus.ditolak
        rental.catatan = "Dibatalkan secara otomatis karena kegagalan pembayaran."
        
        # Restore stock in catalog
        await restore_item_stock(rental.item_id)
        
    db.commit()
    return {"message": "Rental berhasil dibatalkan karena payment fail."}


# ==========================================
# REVIEWS ENDPOINTS
# ==========================================
@app.get("/admins/{admin_id}/reviews", response_model=ReviewListResponse)
async def get_shop_reviews(admin_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.admin_id == admin_id).order_by(Review.created_at.desc()).all()
    total = len(reviews)
    
    enriched = []
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    ratings_sum = 0
    for r in reviews:
        enriched.append(await enrich_review(r))
        distribution[str(r.rating)] += 1
        ratings_sum += r.rating
        
    avg = ratings_sum / total if total > 0 else 0.0
    summary = {"average": avg, "total": total, "distribution": distribution}
    return {"summary": summary, "total": total, "reviews": enriched}

@app.get("/items/{item_id}/reviews", response_model=ReviewListResponse)
async def list_item_reviews(item_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.item_id == item_id).order_by(Review.created_at.desc()).all()
    total = len(reviews)
    
    enriched = []
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    ratings_sum = 0
    for r in reviews:
        enriched.append(await enrich_review(r))
        distribution[str(r.rating)] += 1
        ratings_sum += r.rating
        
    avg = ratings_sum / total if total > 0 else 0.0
    summary = {"average": avg, "total": total, "distribution": distribution}
    return {"summary": summary, "total": total, "reviews": enriched}

@app.get("/rentals/{rental_id}/review", response_model=ReviewResponse)
async def get_rental_review(rental_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.rental_id == rental_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan untuk rental ini.")
    return await enrich_review(review)

@app.post("/rentals/{rental_id}/review", response_model=ReviewResponse, status_code=201)
async def create_rental_review(
    rental_id: int,
    data: ReviewCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
    if rental.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Anda tidak berhak mereview rental ini.")
    if rental.status != RentalStatus.selesai:
        raise HTTPException(status_code=400, detail="Hanya rental yang sudah selesai yang bisa direview.")
        
    existing = db.query(Review).filter(Review.rental_id == rental_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rental ini sudah direview.")

    item = await get_item_details(rental.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")

    review = Review(
        rental_id=rental_id,
        user_id=user["id"],
        item_id=rental.item_id,
        admin_id=item["admin_id"],
        rating=data.rating,
        komentar=data.komentar
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return await enrich_review(review)

@app.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review_endpoint(
    review_id: int,
    data: ReviewUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")
        
    # Check owner or superadmin
    if user["role"] != "super_admin" and review.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    # Limit to 7 days update check
    if user["role"] != "super_admin":
        elapsed = datetime.now(timezone.utc) - review.created_at.replace(tzinfo=timezone.utc)
        if elapsed.days > 7:
            raise HTTPException(status_code=400, detail="Review hanya bisa diupdate dalam waktu 7 hari sejak dibuat.")

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(review, field, value)
        
    db.commit()
    db.refresh(review)
    return await enrich_review(review)

@app.delete("/reviews/{review_id}", status_code=204)
async def delete_review_endpoint(
    review_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")

    if user["role"] != "super_admin" and review.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    db.delete(review)
    db.commit()
    return None


# ==========================================
# PROMO CODES ENDPOINTS
# ==========================================
@app.get("/promos/featured", response_model=List[PromoCodePublicResponse])
def list_featured_promos(db: Session = Depends(get_db)):
    promos = db.query(PromoCode).filter(
        PromoCode.is_active == True,
        PromoCode.is_featured == True
    ).all()
    return promos

@app.post("/promos/validate", response_model=PromoValidateResponse)
def validate_promo_endpoint(
    data: PromoValidateRequest,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    result = _validate_promo_logic(db=db, user_id=user["id"], code=data.code, original_amount=data.original_amount)
    if not result["valid"]:
        return {
            "valid": False,
            "discount_amount": 0.0,
            "final_amount": data.original_amount,
            "message": result["message"]
        }
    promo = result["promo"]
    discount = result["discount_amount"]
    return {
        "valid": True,
        "discount_amount": discount,
        "final_amount": max(0.0, data.original_amount - discount),
        "message": result["message"],
        "promo_code_id": promo.id
    }

@app.get("/superadmin/promos", response_model=PromoCodeListResponse)
def superadmin_list_promos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    query = db.query(PromoCode)
    total = query.count()
    promos = query.order_by(PromoCode.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "promos": promos}

@app.get("/superadmin/rentals", response_model=RentalListResponse)
async def superadmin_list_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    """Super Admin melihat semua transaksi sewa seluruh platform."""
    check_super_admin(user)

    query = db.query(Rental)
    if status_filter:
        try:
            status_enum = RentalStatus(status_filter)
            query = query.filter(Rental.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    rentals = query.order_by(Rental.created_at.desc()).offset(skip).limit(limit).all()

    enriched = []
    for r in rentals:
        enriched.append(await enrich_rental(r))
    return {"total": total, "rentals": enriched}



@app.post("/promos", response_model=PromoCodeResponse, status_code=201)
@app.post("/superadmin/promos", response_model=PromoCodeResponse, status_code=201)
def superadmin_create_promo(
    data: PromoCodeCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    existing = db.query(PromoCode).filter(func.upper(PromoCode.code) == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kode promo sudah terdaftar")
        
    promo = PromoCode(
        code=data.code,
        nama=data.nama,
        deskripsi=data.deskripsi,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        max_discount=data.max_discount,
        min_order=data.min_order,
        eligibility=data.eligibility,
        max_uses_per_user=data.max_uses_per_user,
        max_total_uses=data.max_total_uses,
        is_active=data.is_active,
        is_featured=data.is_featured,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
        created_by=user["id"]
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo

@app.put("/superadmin/promos/{promo_id}", response_model=PromoCodeResponse)
def superadmin_update_promo(
    promo_id: int,
    data: PromoCodeUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan")
        
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(promo, field, value)
        
    db.commit()
    db.refresh(promo)
    return promo

@app.delete("/superadmin/promos/{promo_id}", status_code=204)
def superadmin_delete_promo(
    promo_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan")
    db.delete(promo)
    db.commit()
    return None

@app.get("/superadmin/promos/{promo_id}/redemptions", response_model=PromoRedemptionListResponse)
def superadmin_promo_redemptions(
    promo_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    query = db.query(PromoRedemption).filter(PromoRedemption.promo_code_id == promo_id)
    total = query.count()
    redemptions = query.order_by(PromoRedemption.redeemed_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "redemptions": redemptions}


@app.get("/rentals/internal/{rental_id}")
async def get_rental_internal(rental_id: int, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
    return await enrich_rental(rental)

