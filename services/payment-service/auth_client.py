"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import time
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
            last_exception = e
        except httpx.TimeoutException as e:
            last_exception = e

        if attempt < MAX_RETRIES:
            await asyncio.sleep(BASE_DELAY * (2 ** (attempt - 1)))

    auth_circuit.record_failure()
    raise HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(
    authorization: str = Header(...)
) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return await _call_auth_service(authorization)


async def get_admin_profile(admin_id: int) -> dict:
    if not auth_circuit.can_execute():
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
    except Exception:
        auth_circuit.record_failure()
    return {}


async def get_user_profile(user_id: int) -> dict:
    if not auth_circuit.can_execute():
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/users/{user_id}",
                timeout=TIMEOUT_SECONDS
            )
        if response.status_code == 200:
            auth_circuit.record_success()
            return response.json()
        auth_circuit.record_success()
    except Exception:
        auth_circuit.record_failure()
    return {}
