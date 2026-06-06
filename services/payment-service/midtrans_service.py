import os
import time
import hashlib
from typing import Optional


def build_order_id(rental_id: int) -> str:
    return f"SEWAIN-{rental_id}-{int(time.time() * 1000)}"


def verify_signature(
    order_id: str,
    status_code: str,
    gross_amount: str,
    signature_key: str,
) -> bool:
    server_key = os.getenv("MIDTRANS_SERVER_KEY", "").strip()
    if not server_key or server_key == "dummy-server-key":
        return True  # Bypass verification in mock mode
    raw = f"{order_id}{status_code}{gross_amount}{server_key}"
    expected = hashlib.sha512(raw.encode("utf-8")).hexdigest()
    return expected == (signature_key or "").lower()


def map_midtrans_status(
    transaction_status: str,
    fraud_status: Optional[str] = None,
) -> str:
    ts = (transaction_status or "").lower()
    fs = (fraud_status or "").lower()

    if ts in ("settlement", "success"):
        return "completed"
    if ts == "capture":
        return "completed" if fs == "accept" else "pending"
    if ts in ("pending", "authorize"):
        return "pending"
    if ts in ("deny",):
        return "failed"
    if ts in ("cancel", "expire", "refund", "partial_refund", "chargeback", "partial_chargeback"):
        return "cancelled"
    return "pending"


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
    server_key = os.getenv("MIDTRANS_SERVER_KEY", "").strip()
    if not server_key or server_key == "dummy-server-key":
        token = f"mock-snap-token-{int(time.time())}"
        return {
            "token": token,
            "redirect_url": f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{token}"
        }

    try:
        import midtransclient
        snap = midtransclient.Snap(
            is_production=os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true",
            server_key=server_key,
            client_key=os.getenv("MIDTRANS_CLIENT_KEY", "").strip()
        )
        
        gross_amount = int(round(gross_amount))
        
        payload = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount,
            },
            "credit_card": {"secure": True},
        }
        
        response = snap.create_transaction(payload)
        return {
            "token": response["token"],
            "redirect_url": response["redirect_url"],
        }
    except Exception:
        # Fallback to mock if midtransclient fails or is not installed
        token = f"mock-snap-token-{int(time.time())}"
        return {
            "token": token,
            "redirect_url": f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{token}"
        }


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
    server_key = os.getenv("MIDTRANS_SERVER_KEY", "").strip()
    if not server_key or server_key == "dummy-server-key":
        response = {
            "transaction_status": "pending",
            "order_id": order_id,
            "gross_amount": str(gross_amount),
            "payment_type": payment_type,
        }
        if payment_type == "gopay":
            response["actions"] = [
                {"name": "generate-qr-code", "url": "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"},
                {"name": "deeplink-redirect", "url": "https://gopay.co.id"}
            ]
        elif payment_type == "shopeepay":
            response["actions"] = [
                {"name": "deeplink-redirect", "url": "https://shopee.co.id"}
            ]
        elif payment_type == "qris":
            response["actions"] = [
                {"name": "generate-qr-code", "url": "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"}
            ]
        elif payment_type == "bank_transfer":
            if bank == "mandiri":
                response["biller_code"] = "70012"
                response["bill_key"] = "998877665544"
            else:
                response["va_numbers"] = [
                    {"bank": bank, "va_number": "123456789012345"}
                ]
        return response

    import midtransclient
    core = midtransclient.CoreApi(
        is_production=os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true",
        server_key=server_key,
        client_key=os.getenv("MIDTRANS_CLIENT_KEY", "").strip()
    )

    gross_amount = int(round(gross_amount))
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

    if payment_type == "bank_transfer":
        if bank == "mandiri":
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

    payload["custom_expiry"] = {
        "expiry_duration": 30,
        "unit": "minute",
    }

    return core.charge(payload)
