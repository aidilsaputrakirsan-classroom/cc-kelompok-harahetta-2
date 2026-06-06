"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import time
from typing import Optional
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header
from circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

# =====================
# RETRY CONFIG
# =====================
MAX_RETRIES = 3
BASE_DELAY = 0.5           # 0.5 detik delay awal
TIMEOUT_SECONDS = 5.0      # Timeout per request

# Error yang layak di-retry (transient errors)
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}

# Circuit breaker instance (global — shared di seluruh app)
auth_circuit = CircuitBreaker(
    name="auth-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def _call_auth_service(authorization: str) -> dict:
    """
    Internal: Panggil Auth Service dengan retry + exponential backoff.
    """
    # Circuit breaker check
    if not auth_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Auth Service circuit breaker OPEN. Try again later."
        )

    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_SERVICE_URL}/verify",
                    headers={"Authorization": authorization},
                    timeout=TIMEOUT_SECONDS,
                )

            # Success
            if response.status_code == 200:
                auth_circuit.record_success()
                logger.info(f"Auth verified (attempt {attempt})")
                return response.json()

            # Non-retryable errors — gagalkan langsung
            if response.status_code == 401:
                auth_circuit.record_success()  # Service responsif, token salah
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                auth_circuit.record_success()
                raise HTTPException(status_code=400, detail="Bad auth request")

            # Retryable server errors
            if response.status_code in RETRYABLE_STATUS_CODES:
                logger.warning(
                    f"Auth service returned {response.status_code} "
                    f"(attempt {attempt}/{MAX_RETRIES})"
                )
                last_exception = HTTPException(
                    status_code=response.status_code,
                    detail=f"Auth service error: {response.status_code}"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Unexpected auth response: {response.status_code}"
                )

        except httpx.ConnectError as e:
            logger.warning(
                f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES}): {e}"
            )
            last_exception = e

        except httpx.TimeoutException as e:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES}): {e}"
            )
            last_exception = e

        # Exponential backoff (hanya jika akan retry)
        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))  # 0.5s, 1s, 2s
            logger.info(f"Retrying in {delay}s...")
            await asyncio.sleep(delay)

    # Semua retry gagal → record failure di circuit breaker
    auth_circuit.record_failure()
    logger.error(f"Auth Service unreachable after {MAX_RETRIES} attempts")
    raise HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(
    authorization: str = Header(...)
) -> dict:
    """
    FastAPI Dependency: Verifikasi token via Auth Service.
    Dengan retry logic dan proper error handling.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    return await _call_auth_service(authorization)


# =====================
# GRACEFUL DEGRADATION METHODS
# =====================
_INDO_PROVINCES = {
    "aceh", "bali", "banten", "bengkulu", "daerah istimewa yogyakarta",
    "di yogyakarta", "yogyakarta", "dki jakarta", "jakarta", "gorontalo",
    "jambi", "jawa barat", "jawa tengah", "jawa timur", "kalimantan barat",
    "kalimantan selatan", "kalimantan tengah", "kalimantan timur",
    "kalimantan utara", "kepulauan bangka belitung", "kepulauan riau",
    "lampung", "maluku", "maluku utara", "nusa tenggara barat",
    "nusa tenggara timur", "papua", "papua barat", "papua barat daya",
    "papua pegunungan", "papua selatan", "papua tengah", "riau",
    "sulawesi barat", "sulawesi selatan", "sulawesi tengah",
    "sulawesi tenggara", "sulawesi utara", "sumatera barat",
    "sumatera selatan", "sumatera utara", "indonesia",
}


def extract_city(alamat: Optional[str]) -> Optional[str]:
    if not alamat:
        return None
    parts = [p.strip() for p in alamat.split(",") if p.strip()]
    if not parts:
        return None

    cleaned = []
    for p in parts:
        low = p.lower()
        if low.replace(" ", "").isdigit():
            continue
        if low in _INDO_PROVINCES:
            continue
        for prefix in ("kota ", "kabupaten ", "kab. ", "kab "):
            if low.startswith(prefix):
                p = p[len(prefix):].strip()
                low = p.lower()
                break
        cleaned.append(p)

    if not cleaned:
        return None
    return cleaned[-1]


async def get_admin_profile(admin_id: int) -> dict:
    """
    Fetch admin profile details from Auth Service by admin_profile.id.
    Used when we have an admin_id from an Item record (Item.admin_id = AdminProfile.id).
    """
    if not auth_circuit.can_execute():
        logger.warning(f"[CircuitBreaker] Skip call to Auth Service for admin {admin_id} (state is OPEN/HALF_OPEN)")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/admins/{admin_id}/payment-info",
                timeout=TIMEOUT_SECONDS
            )
        if response.status_code == 200:
            auth_circuit.record_success()
            return response.json()
        auth_circuit.record_success()
    except Exception as e:
        auth_circuit.record_failure()
        logger.error(f"Failed to fetch admin profile for admin_id {admin_id}: {e}")
    return {}


async def get_admin_profile_by_user_id(user_id: int) -> dict:
    """
    Fetch admin profile details from Auth Service by user_id.
    Used when we only have the authenticated user's id (user["id"]).
    Calls /users/{user_id}/admin-profile which looks up AdminProfile.user_id.
    """
    if not auth_circuit.can_execute():
        logger.warning(f"[CircuitBreaker] Skip call to Auth Service for user {user_id} (state is OPEN/HALF_OPEN)")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/users/{user_id}/admin-profile",
                timeout=TIMEOUT_SECONDS
            )
        if response.status_code == 200:
            auth_circuit.record_success()
            return response.json()
        auth_circuit.record_success()
    except Exception as e:
        auth_circuit.record_failure()
        logger.error(f"Failed to fetch admin profile for user {user_id}: {e}")
    return {}


