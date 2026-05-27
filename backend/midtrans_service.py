"""
midtrans_service.py — Integrasi Payment Gateway Midtrans (Sandbox)

Thin wrapper di atas midtransclient + helper untuk verifikasi signature &
pemetaan status. Semua kredensial diambil dari environment (.env):
  - MIDTRANS_SERVER_KEY
  - MIDTRANS_CLIENT_KEY
  - MIDTRANS_IS_PRODUCTION
  - MIDTRANS_FINISH_REDIRECT_URL
"""

import os
import hashlib
import time
from typing import Optional

import midtransclient

from models import PaymentStatus


# ============================================================
# CONFIG
# ============================================================

def _env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "y")


def get_server_key() -> str:
    key = os.getenv("MIDTRANS_SERVER_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "MIDTRANS_SERVER_KEY belum diisi di .env. "
            "Dapatkan dari https://dashboard.sandbox.midtrans.com → Settings → Access Keys."
        )
    return key


def get_client_key() -> str:
    return os.getenv("MIDTRANS_CLIENT_KEY", "").strip()


def is_production() -> bool:
    return _env_bool("MIDTRANS_IS_PRODUCTION", default=False)


def _snap_client() -> midtransclient.Snap:
    return midtransclient.Snap(
        is_production=is_production(),
        server_key=get_server_key(),
        client_key=get_client_key(),
    )


def _core_client() -> midtransclient.CoreApi:
    return midtransclient.CoreApi(
        is_production=is_production(),
        server_key=get_server_key(),
        client_key=get_client_key(),
    )


# ============================================================
# HELPERS
# ============================================================

def build_order_id(rental_id: int) -> str:
    """
    Format: SEWAIN-{rental_id}-{epoch_ms}.
    Epoch diikutkan agar tiap percobaan bayar (setelah gagal/expire) menghasilkan
    order_id baru — Midtrans tidak mengizinkan order_id terpakai ulang.
    """
    return f"SEWAIN-{rental_id}-{int(time.time() * 1000)}"


def verify_signature(
    order_id: str,
    status_code: str,
    gross_amount: str,
    signature_key: str,
) -> bool:
    """
    Verifikasi signature webhook Midtrans.
    Formula resmi: SHA512(order_id + status_code + gross_amount + server_key)
    """
    server_key = get_server_key()
    raw = f"{order_id}{status_code}{gross_amount}{server_key}"
    expected = hashlib.sha512(raw.encode("utf-8")).hexdigest()
    return expected == (signature_key or "").lower()


def map_midtrans_status(
    transaction_status: str,
    fraud_status: Optional[str] = None,
) -> PaymentStatus:
    """
    Map transaction_status Midtrans → PaymentStatus internal.

    Reference: https://docs.midtrans.com/docs/https-notification-webhooks
    """
    ts = (transaction_status or "").lower()
    fs = (fraud_status or "").lower()

    if ts in ("settlement",):
        return PaymentStatus.completed
    if ts == "capture":
        # Hanya completed kalau fraud_status=accept
        return PaymentStatus.completed if fs == "accept" else PaymentStatus.pending
    if ts in ("pending", "authorize"):
        return PaymentStatus.pending
    if ts in ("deny",):
        return PaymentStatus.failed
    if ts in ("cancel", "expire", "refund", "partial_refund", "chargeback", "partial_chargeback"):
        return PaymentStatus.cancelled
    return PaymentStatus.pending


# ============================================================
# CORE: Create Snap transaction
# ============================================================

def create_snap_transaction(
    *,
    order_id: str,
    gross_amount: int,
    item_name: str,
    item_qty_days: int,
    price_per_day: int,
    customer_name: str,
    customer_email: str,
    customer_phone: Optional[str] = None,
) -> dict:
    """
    Panggil Midtrans Snap API untuk generate token pembayaran.

    Return dict:
      {
        "token": "<snap_token>",
        "redirect_url": "<url>"
      }

    Raise Exception dari midtransclient kalau API error.
    """
    # Midtrans mewajibkan gross_amount bilangan bulat (IDR)
    gross_amount = int(round(gross_amount))
    price_per_day = int(round(price_per_day))
    # Normalisasi jumlah: price × qty harus sama dengan gross_amount
    # Kalau tidak pas (misal ada pembulatan), pakai 1 item saja dengan harga total.
    if price_per_day * max(1, item_qty_days) != gross_amount:
        item_details = [{
            "id": f"RENTAL-{order_id}",
            "price": gross_amount,
            "quantity": 1,
            "name": item_name[:50],  # Midtrans max 50 char
        }]
    else:
        item_details = [{
            "id": f"RENTAL-{order_id}",
            "price": price_per_day,
            "quantity": max(1, item_qty_days),
            "name": item_name[:50],
        }]

    customer_details = {
        "first_name": (customer_name or "Customer")[:20],
        "email": customer_email,
    }
    if customer_phone:
        customer_details["phone"] = customer_phone

    finish_url = os.getenv(
        "MIDTRANS_FINISH_REDIRECT_URL",
        "http://localhost:5173/payment/finish",
    )

    payload = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "item_details": item_details,
        "customer_details": customer_details,
        "callbacks": {"finish": finish_url},
        "credit_card": {"secure": True},
    }

    snap = _snap_client()
    response = snap.create_transaction(payload)
    return {
        "token": response["token"],
        "redirect_url": response["redirect_url"],
    }


def fetch_transaction_status(order_id: str) -> dict:
    """
    Poll status transaksi ke Midtrans berdasarkan order_id.
    Berguna sebagai fallback kalau webhook tidak sampai.
    """
    core = midtransclient.CoreApi(
        is_production=is_production(),
        server_key=get_server_key(),
        client_key=get_client_key(),
    )
    return core.transactions.status(order_id)


# ============================================================
# CORE API: Direct Charge (tanpa Snap popup)
# ============================================================

def create_core_charge(
    *,
    order_id: str,
    gross_amount: int,
    payment_type: str,
    item_name: str,
    customer_name: str,
    customer_email: str,
    customer_phone: Optional[str] = None,
    bank: Optional[str] = None,
) -> dict:
    """
    Charge langsung via Midtrans Core API.

    payment_type bisa:
      - "qris" → return QR code URL
      - "bank_transfer" → return VA number (butuh param bank: bca/bni/bri/mandiri/permata)
      - "gopay" → return deeplink + QR URL
      - "shopeepay" → return deeplink URL
      - "echannel" → Mandiri Bill Payment

    Return dict dengan info pembayaran (VA number, QR URL, dll).
    """
    gross_amount = int(round(gross_amount))
    core = _core_client()

    payload = {
        "payment_type": payment_type,
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "item_details": [{
            "id": f"RENTAL-{order_id}",
            "price": gross_amount,
            "quantity": 1,
            "name": item_name[:50],
        }],
        "customer_details": {
            "first_name": (customer_name or "Customer")[:20],
            "email": customer_email,
            "phone": customer_phone or "",
        },
    }

    # Payment-type specific params
    if payment_type == "bank_transfer":
        if bank == "mandiri":
            # Mandiri uses echannel
            payload["payment_type"] = "echannel"
            payload["echannel"] = {
                "bill_info1": "Payment:",
                "bill_info2": item_name[:20],
            }
        else:
            payload["bank_transfer"] = {"bank": bank or "bca"}

    elif payment_type == "qris":
        payload["qris"] = {"acquirer": "gopay"}

    elif payment_type == "gopay":
        payload["gopay"] = {"enable_callback": True}

    elif payment_type == "shopeepay":
        finish_url = os.getenv("MIDTRANS_FINISH_REDIRECT_URL", "http://localhost:5173/payment/finish")
        payload["shopeepay"] = {"callback_url": finish_url}

    # Set expiry: 30 menit dari sekarang
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    payload["custom_expiry"] = {
        "expiry_duration": 30,
        "unit": "minute",
    }

    response = core.charge(payload)
    return response
