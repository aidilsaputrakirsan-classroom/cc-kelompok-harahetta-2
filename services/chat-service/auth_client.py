"""
auth_client.py — HTTP client untuk verifikasi token via Auth Service.
Pola sama seperti item-service/auth_client.py (retry + circuit breaker).
"""
import os
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header
from circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

MAX_RETRIES = 3
BASE_DELAY = 0.5
TIMEOUT_SECONDS = 5.0
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}

auth_circuit = CircuitBreaker(
    name="auth-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def _call_auth_service(authorization: str) -> dict:
    """Internal: Panggil Auth Service dengan retry + exponential backoff."""
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

            if response.status_code == 200:
                auth_circuit.record_success()
                return response.json()

            if response.status_code == 401:
                auth_circuit.record_success()
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                auth_circuit.record_success()
                raise HTTPException(status_code=400, detail="Bad auth request")

            if response.status_code in RETRYABLE_STATUS_CODES:
                logger.warning(f"Auth service returned {response.status_code} (attempt {attempt}/{MAX_RETRIES})")
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
            logger.warning(f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES}): {e}")
            last_exception = e
        except httpx.TimeoutException as e:
            logger.warning(f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES}): {e}")
            last_exception = e

        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    auth_circuit.record_failure()
    logger.error(f"Auth Service unreachable after {MAX_RETRIES} attempts")
    raise HTTPException(status_code=503, detail="Auth Service unavailable. Please try again later.")


async def verify_token_with_auth_service(
    authorization: str = Header(...)
) -> dict:
    """
    FastAPI Dependency: Verifikasi token via Auth Service.
    Mengembalikan dict user (id, nama, role, dll).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return await _call_auth_service(authorization)


async def get_user_by_id(user_id: int) -> dict:
    """Fetch user info dari Auth Service by user_id."""
    if not auth_circuit.can_execute():
        return {}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/users/{user_id}",
                timeout=TIMEOUT_SECONDS,
            )
        if response.status_code == 200:
            auth_circuit.record_success()
            return response.json()
        auth_circuit.record_success()
    except Exception as e:
        auth_circuit.record_failure()
        logger.error(f"Failed to fetch user {user_id}: {e}")
    return {}
