import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Header, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Payment, Wallet, Withdrawal, PaymentStatus, PaymentMethod, WithdrawalStatus
from schemas import (
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentListResponse,
    MidtransChargeResponse, WalletResponse, WithdrawalCreate, WithdrawalResponse,
    WithdrawalListResponse, WithdrawalActionByAdmin, PaymentAutoCreateRequest, WalletCreditRequest
)
from auth_client import verify_token_with_auth_service, get_admin_profile, get_user_profile, auth_circuit
from rental_client import cancel_rental, get_rental_details, rental_circuit
import midtrans_service

logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Payment Service",
    description="Payment, Wallet, and Withdrawal Microservice for Sewain",
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


# Helper: Wallets
def get_or_create_wallet(db: Session, admin_id: int) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.admin_id == admin_id).first()
    if not wallet:
        wallet = Wallet(admin_id=admin_id, saldo=0.0, total_pendapatan=0.0, total_withdrawn=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def add_wallet_balance(db: Session, admin_id: int, amount: float) -> Wallet:
    wallet = get_or_create_wallet(db, admin_id)
    wallet.saldo += amount
    wallet.total_pendapatan += amount
    db.commit()
    db.refresh(wallet)
    return wallet


# ==========================================
# HEALTH & CIRCUIT BREAKER
# ==========================================
@app.get("/health")
def health():
    auth_status = auth_circuit.get_status()
    rental_status = rental_circuit.get_status()
    overall = "healthy" if (auth_status["state"] == "CLOSED" and rental_status["state"] == "CLOSED") else "degraded"
    return {
        "status": overall,
        "service": "payment-service",
        "dependencies": {
            "auth-service": auth_status,
            "rental-service": rental_status,
        }
    }


# ==========================================
# PUBLIC PAYMENT ENDPOINTS
# ==========================================
@app.get("/payments/config/public")
def midtrans_public_config():
    return {
        "client_key": os.getenv("MIDTRANS_CLIENT_KEY", "dummy-client-key"),
        "is_production": os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"
    }


# ==========================================
# CUSTOMER/ADMIN PAYMENT ENDPOINTS
# ==========================================
@app.post("/payments/rentals/{rental_id}", response_model=PaymentResponse, status_code=201)
async def create_payment_for_rental(
    rental_id: int,
    data: PaymentCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    # Fetch rental details
    rental = await get_rental_details(rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan.")

    if rental["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak. Rental ini bukan milik Anda.")

    existing = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if existing:
        return existing

    # Find admin_id from item details (rental details contains item info)
    item = rental.get("item")
    admin_id = item.get("admin_id") if item else 0

    payment = Payment(
        rental_id=rental_id,
        user_id=user["id"],
        admin_id=admin_id,
        jumlah=rental["total_harga"],
        metode_pembayaran=data.metode_pembayaran,
        status=PaymentStatus.pending,
        catatan=data.catatan
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@app.get("/payments/my", response_model=PaymentListResponse)
def my_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    query = db.query(Payment).filter(Payment.user_id == user["id"])
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "payments": payments}

@app.get("/payments/status/{rental_id}", response_model=PaymentResponse)
def get_payment_by_rental(
    rental_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    """Get payment status for a specific rental. Accessible by the renting user, admin, or superadmin."""
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pembayaran untuk rental ini tidak ditemukan")
    
    # Only the owner user, admin, or superadmin can access
    if user["role"] == "user" and payment.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    
    return payment

@app.get("/payments/{payment_id}")
async def get_payment_detail(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pembayaran tidak ditemukan")
    
    rental_details = await get_rental_details(payment.rental_id)
    user_details = await get_user_profile(payment.user_id)
    return {
        "payment": payment,
        "rental": rental_details,
        "user": user_details
    }

@app.put("/payments/{payment_id}/status", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    data: PaymentUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pembayaran tidak ditemukan")

    old_status = payment.status
    payment.status = data.status

    if data.bukti_pembayaran:
        payment.bukti_pembayaran = data.bukti_pembayaran
    if data.catatan:
        payment.catatan = data.catatan

    if data.status == PaymentStatus.completed:
        payment.tanggal_pembayaran = datetime.now()
        # Credit wallet balance
        add_wallet_balance(db, payment.admin_id, payment.jumlah)

    # Cancel rental if payment fails/cancels
    if data.status in [PaymentStatus.failed, PaymentStatus.cancelled] and old_status != data.status:
        await cancel_rental(payment.rental_id)

    db.commit()
    db.refresh(payment)
    return payment


# ==========================================
# ADMIN INCOMING PAYMENTS
# ==========================================
@app.get("/admin/payments", response_model=PaymentListResponse)
async def admin_incoming_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    admin_profile = await get_admin_profile(user["id"])
    if not admin_profile:
        raise HTTPException(status_code=400, detail="Profil admin tidak ditemukan.")

    query = db.query(Payment).filter(Payment.admin_id == admin_profile["id"])
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "payments": payments}

@app.get("/admin/payments/stats")
async def admin_payment_stats(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    admin_profile = await get_admin_profile(user["id"])
    if not admin_profile:
        raise HTTPException(status_code=400, detail="Profil admin tidak ditemukan.")

    total_payments = db.query(func.count(Payment.id)).filter(Payment.admin_id == admin_profile["id"]).scalar() or 0
    completed_payments = db.query(func.count(Payment.id)).filter(
        Payment.admin_id == admin_profile["id"], Payment.status == PaymentStatus.completed
    ).scalar() or 0
    pending_payments = db.query(func.count(Payment.id)).filter(
        Payment.admin_id == admin_profile["id"], Payment.status == PaymentStatus.pending
    ).scalar() or 0

    total_received = db.query(func.sum(Payment.jumlah)).filter(
        Payment.admin_id == admin_profile["id"], Payment.status == PaymentStatus.completed
    ).scalar() or 0.0
    total_pending = db.query(func.sum(Payment.jumlah)).filter(
        Payment.admin_id == admin_profile["id"], Payment.status == PaymentStatus.pending
    ).scalar() or 0.0

    return {
        "total_payments": total_payments,
        "completed_payments": completed_payments,
        "pending_payments": pending_payments,
        "total_received": float(total_received),
        "total_pending": float(total_pending)
    }


# ==========================================
# SUPERADMIN PAYMENTS
# ==========================================
@app.get("/superadmin/payments", response_model=PaymentListResponse)
def all_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    query = db.query(Payment)
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "payments": payments}

@app.get("/superadmin/payments/stats")
def platform_payment_stats(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    total_payments = db.query(func.count(Payment.id)).scalar() or 0
    completed_payments = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.completed).scalar() or 0
    pending_payments = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.pending).scalar() or 0

    total_received = db.query(func.sum(Payment.jumlah)).filter(Payment.status == PaymentStatus.completed).scalar() or 0.0
    total_pending = db.query(func.sum(Payment.jumlah)).filter(Payment.status == PaymentStatus.pending).scalar() or 0.0

    return {
        "total_payments": total_payments,
        "completed_payments": completed_payments,
        "pending_payments": pending_payments,
        "total_received": float(total_received),
        "total_pending": float(total_pending)
    }


# ==========================================
# MIDTRANS SNAP GENERATION
# ==========================================
@app.post("/payments/rentals/{rental_id}/charge", response_model=MidtransChargeResponse)
async def create_midtrans_charge(
    rental_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    rental = await get_rental_details(rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan.")

    if rental["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    # Find existing or create payment
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    item = rental.get("item")
    admin_id = item.get("admin_id") if item else 0

    if not payment:
        payment = Payment(
            rental_id=rental_id,
            user_id=user["id"],
            admin_id=admin_id,
            jumlah=rental["total_harga"],
            metode_pembayaran=PaymentMethod.midtrans,
            status=PaymentStatus.pending
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    # Set new midtrans_order_id if not present
    if not payment.midtrans_order_id:
        payment.midtrans_order_id = midtrans_service.build_order_id(rental_id)

    # Call Midtrans SNAP
    try:
        snap_res = midtrans_service.create_snap_transaction(
            order_id=payment.midtrans_order_id,
            gross_amount=int(payment.jumlah),
            item_name=item["nama"] if item else "Sewa Barang",
            item_qty_days=1,
            price_per_day=int(payment.jumlah),
            customer_name=user["nama"],
            customer_email=user["email"]
        )
        payment.snap_token = snap_res["token"]
        payment.snap_redirect_url = snap_res["redirect_url"]
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Midtrans integration error: {e}")

    return {
        "payment_id": payment.id,
        "rental_id": payment.rental_id,
        "order_id": payment.midtrans_order_id,
        "snap_token": payment.snap_token,
        "snap_redirect_url": payment.snap_redirect_url,
        "client_key": os.getenv("MIDTRANS_CLIENT_KEY", "dummy-client-key"),
        "jumlah": payment.jumlah,
        "status": payment.status
    }


@app.post("/payments/rentals/{rental_id}/charge-direct")
async def create_direct_charge(
    rental_id: int,
    body: dict,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    payment_type = body.get("payment_type")
    bank = body.get("bank")

    if not payment_type:
        raise HTTPException(status_code=400, detail="payment_type wajib diisi")

    valid_types = ["qris", "bank_transfer", "gopay", "shopeepay"]
    if payment_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"payment_type harus salah satu dari: {valid_types}")

    if payment_type == "bank_transfer" and not bank:
        raise HTTPException(status_code=400, detail="bank wajib diisi untuk bank_transfer (bca/bni/bri/mandiri/permata)")

    if not user.get("is_verified"):
        raise HTTPException(
            status_code=403,
            detail="Anda belum terverifikasi. Lengkapi data diri dan upload KTP terlebih dahulu."
        )

    # Validasi rental
    rental = await get_rental_details(rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
    if rental.get("user_id") != user.get("id"):
        raise HTTPException(status_code=403, detail="Rental ini bukan milik Anda")
    if rental.get("status") != "disetujui":
        raise HTTPException(status_code=400, detail="Rental belum disetujui admin")

    # Cek batas waktu pembayaran 24 jam
    payment_deadline_str = rental.get("payment_deadline")
    if payment_deadline_str:
        try:
            clean_str = payment_deadline_str.replace("Z", "+00:00")
            payment_deadline = datetime.fromisoformat(clean_str)
            if payment_deadline.tzinfo is None:
                payment_deadline = payment_deadline.replace(tzinfo=timezone.utc)
            
            now_utc = datetime.now(timezone.utc)
            if now_utc > payment_deadline:
                # Auto-cancel
                await cancel_rental(rental_id)
                pending_pay = db.query(Payment).filter(
                    Payment.rental_id == rental_id, 
                    Payment.status == PaymentStatus.pending
                ).first()
                if pending_pay:
                    pending_pay.status = PaymentStatus.failed
                    pending_pay.catatan = "Expired — batas waktu pembayaran 24 jam terlampaui"
                    db.commit()
                raise HTTPException(
                    status_code=400, 
                    detail="Batas waktu pembayaran (24 jam) telah terlampaui. Silakan buat pesanan baru."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking payment deadline: {e}")

    # Ambil/buat payment
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if not payment:
        item = rental.get("item")
        admin_id = item.get("admin_id") if item else 0
        payment = Payment(
            rental_id=rental_id,
            user_id=rental.get("user_id"),
            admin_id=admin_id,
            jumlah=rental.get("total_harga"),
            metode_pembayaran=PaymentMethod.midtrans,
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    if payment.status == PaymentStatus.completed:
        raise HTTPException(status_code=400, detail="Pembayaran sudah lunas")

    # Generate order_id baru
    order_id = midtrans_service.build_order_id(rental_id)

    # Ambil data item & user
    item = rental.get("item")
    item_name = item.get("nama") if item else f"Sewa #{rental_id}"
    
    # Ambil phone from user profile
    user_profile = await get_user_profile(rental.get("user_id"))
    phone = user_profile.get("nomor_telepon") if user_profile else None

    try:
        response = midtrans_service.create_core_charge(
            order_id=order_id,
            gross_amount=int(round(rental.get("total_harga"))),
            payment_type=payment_type,
            item_name=item_name,
            customer_name=user.get("nama"),
            customer_email=user.get("email"),
            customer_phone=phone,
            bank=bank,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gagal charge Midtrans: {e}")

    # Update payment record
    payment.midtrans_order_id = order_id
    payment.metode_pembayaran = PaymentMethod.midtrans
    payment.status = PaymentStatus.pending

    # Set expiry 30 menit dari sekarang
    payment.expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    # Simpan response Midtrans (VA number, QR URL, dll) untuk ditampilkan ulang
    import json
    payment.charge_response = json.dumps(response)

    # Simpan payment_channel
    channel = payment_type
    if payment_type == "bank_transfer":
        channel = f"{bank}_va"
    elif payment_type == "echannel":
        channel = "mandiri_bill"
    payment.payment_channel = channel

    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "order_id": order_id,
        "payment_type": payment_type,
        "status": response.get("transaction_status", "pending"),
        "midtrans_response": response,
    }


@app.post("/payments/midtrans/notification")
async def midtrans_notification(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    order_id = payload.get("order_id")
    status_code = payload.get("status_code")
    gross_amount = payload.get("gross_amount")
    signature_key = payload.get("signature_key")

    # Verify signature
    is_valid = midtrans_service.verify_signature(order_id, status_code, gross_amount, signature_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature key")

    payment = db.query(Payment).filter(Payment.midtrans_order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    new_status = midtrans_service.map_midtrans_status(payload.get("transaction_status"), payload.get("fraud_status"))
    payment.status = new_status
    payment.raw_notification = str(payload)

    if new_status == PaymentStatus.completed:
        payment.tanggal_pembayaran = datetime.now()
        # Credit wallet
        add_wallet_balance(db, payment.admin_id, payment.jumlah)
    elif new_status in [PaymentStatus.failed, PaymentStatus.cancelled]:
        await cancel_rental(payment.rental_id)

    db.commit()
    return {"status": "ok"}


# ==========================================
# WALLET & WITHDRAWALS ENDPOINTS
# ==========================================
@app.get("/admin/wallet", response_model=WalletResponse)
def get_my_wallet(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    admin_profile = get_admin_profile(user["id"]) # in demo, user["id"] can act directly as admin profile user_id
    # To map properly, in auth-service users table maps 1-1 to AdminProfile.
    # We can fetch admin profile or use user_id directly as admin_id since we enforce 1:1.
    # In monolith admin_id is AdminProfile.id. We can query get_admin_profile.
    # Let's call get_admin_profile helper.
    # Wait, get_admin_profile returns a dict of AdminProfile info: { "id": ... }
    # So we get profile from cache/HTTP.
    # Let's fetch it:
    import asyncio
    profile_dict = asyncio.run(get_admin_profile(user["id"]))
    admin_id = profile_dict.get("id") if profile_dict else user["id"]

    wallet = get_or_create_wallet(db, admin_id)
    return wallet

@app.get("/admin/wallet/transactions")
async def get_my_wallet_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    profile_dict = await get_admin_profile(user["id"])
    admin_id = profile_dict.get("id") if profile_dict else user["id"]

    query = db.query(Payment).filter(
        Payment.admin_id == admin_id,
        Payment.status == PaymentStatus.completed
    )
    total = query.count()
    payments = query.order_by(Payment.tanggal_pembayaran.desc()).offset(skip).limit(limit).all()

    transactions = []
    for p in payments:
        # Fetch rental details & user profile to populate
        rental_details = await get_rental_details(p.rental_id)
        item_nama = "Sewa Barang"
        if rental_details and rental_details.get("item"):
            item_nama = rental_details["item"].get("nama", "Sewa Barang")

        user_details = await get_user_profile(p.user_id)
        penyewa = user_details.get("nama", "Penyewa")

        transactions.append({
            "rental_id": p.rental_id,
            "item_nama": item_nama,
            "jumlah": p.jumlah,
            "tanggal": p.tanggal_pembayaran or p.created_at,
            "penyewa": penyewa
        })

    return {"total": total, "transactions": transactions}

@app.post("/admin/wallet/withdraw", response_model=WithdrawalResponse, status_code=201)
async def request_withdrawal(
    data: WithdrawalCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    profile_dict = await get_admin_profile(user["id"])
    admin_id = profile_dict.get("id") if profile_dict else user["id"]

    MIN_WITHDRAWAL = 50000.0
    wallet = get_or_create_wallet(db, admin_id)

    if data.jumlah < MIN_WITHDRAWAL:
        raise HTTPException(status_code=400, detail=f"Minimal penarikan Rp {int(MIN_WITHDRAWAL):,}".replace(",", "."))
    if data.jumlah > wallet.saldo:
        raise HTTPException(status_code=400, detail=f"Saldo tidak cukup. Saldo saat ini: Rp {wallet.saldo:,.0f}".replace(",", "."))

    # Hold the balance
    wallet.saldo -= data.jumlah

    withdrawal = Withdrawal(
        wallet_id=wallet.id,
        admin_id=admin_id,
        jumlah=data.jumlah,
        bank_name=data.bank_name,
        account_number=data.account_number,
        account_holder=data.account_holder,
        status=WithdrawalStatus.pending,
        catatan=data.catatan
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal

@app.get("/admin/wallet/withdrawals", response_model=WithdrawalListResponse)
async def my_withdrawals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    profile_dict = await get_admin_profile(user["id"])
    admin_id = profile_dict.get("id") if profile_dict else user["id"]

    query = db.query(Withdrawal).filter(Withdrawal.admin_id == admin_id)
    total = query.count()
    withdrawals = query.order_by(Withdrawal.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "withdrawals": withdrawals}

@app.get("/superadmin/withdrawals", response_model=WithdrawalListResponse)
def all_withdrawals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    query = db.query(Withdrawal)
    if status_filter:
        try:
            status_enum = WithdrawalStatus(status_filter)
            query = query.filter(Withdrawal.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    withdrawals = query.order_by(Withdrawal.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "withdrawals": withdrawals}

@app.put("/superadmin/withdrawals/{withdrawal_id}", response_model=WithdrawalResponse)
def process_withdrawal(
    withdrawal_id: int,
    data: WithdrawalActionByAdmin,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Request withdrawal tidak ditemukan.")

    old_status = withdrawal.status
    
    # Simple transition validation
    valid_transitions = {
        WithdrawalStatus.pending: [WithdrawalStatus.processing, WithdrawalStatus.rejected],
        WithdrawalStatus.processing: [WithdrawalStatus.completed, WithdrawalStatus.rejected],
        WithdrawalStatus.completed: [],
        WithdrawalStatus.rejected: [],
    }

    if data.status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat mengubah status dari '{old_status.value}' ke '{data.status.value}'"
        )

    withdrawal.status = data.status
    if data.catatan:
        withdrawal.catatan = data.catatan

    if data.status == WithdrawalStatus.rejected:
        withdrawal.rejected_reason = data.rejected_reason
        # Restore balance
        wallet = db.query(Wallet).filter(Wallet.id == withdrawal.wallet_id).first()
        if wallet:
            wallet.saldo += withdrawal.jumlah

    if data.status == WithdrawalStatus.completed:
        withdrawal.completed_at = datetime.now()
        # Update total withdrawn
        wallet = db.query(Wallet).filter(Wallet.id == withdrawal.wallet_id).first()
        if wallet:
            wallet.total_withdrawn += withdrawal.jumlah

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


# ==========================================
# INTERNAL SERVICE ENDPOINTS
# ==========================================
@app.post("/payments/internal/auto-create", response_model=PaymentResponse, status_code=201)
def internal_auto_create(data: PaymentAutoCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Payment).filter(Payment.rental_id == data.rental_id).first()
    if existing:
        return existing

    payment = Payment(
        rental_id=data.rental_id,
        user_id=data.user_id,
        admin_id=data.admin_id,
        jumlah=data.jumlah,
        metode_pembayaran=PaymentMethod.midtrans,
        status=PaymentStatus.pending
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@app.put("/payments/internal/cancel-by-rental/{rental_id}")
def internal_cancel_by_rental(rental_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if payment and payment.status == PaymentStatus.pending:
        payment.status = PaymentStatus.cancelled
        db.commit()
    return {"message": "Payment cancelled."}

@app.post("/payments/internal/credit-wallet")
def internal_credit_wallet(data: WalletCreditRequest, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.rental_id == data.rental_id).first()
    if payment and payment.status == PaymentStatus.completed:
        add_wallet_balance(db, data.admin_id, data.jumlah)
    return {"message": "Wallet credited."}

@app.get("/payments/internal/status/{rental_id}")
def internal_get_status(rental_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.rental_id == rental_id).first()
    if not payment:
        return {"status": "none"}
    return {"status": payment.status.value}
