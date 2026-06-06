"""
Payment Client — HTTP client untuk berkomunikasi dengan Payment Service.
Dilengkapi dengan circuit breaker.
"""
import os
import time
import asyncio
import logging
import httpx
from fastapi import HTTPException
from circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004")

payment_circuit = CircuitBreaker(
    name="payment-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def create_payment_auto(rental_id: int, user_id: int, admin_id: int, jumlah: float) -> dict:
    """
    Call Payment Service to auto-create a pending payment when a rental is approved.
    """
    if not payment_circuit.can_execute():
        logger.warning(f"Payment Service circuit breaker OPEN. Skipping payment auto-creation for rental {rental_id}")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYMENT_SERVICE_URL}/payments/internal/auto-create",
                json={
                    "rental_id": rental_id,
                    "user_id": user_id,
                    "admin_id": admin_id,
                    "jumlah": jumlah
                },
                timeout=5.0
            )

        if response.status_code in (200, 201):
            payment_circuit.record_success()
            return response.json()
        payment_circuit.record_success()
    except Exception as e:
        payment_circuit.record_failure()
        logger.error(f"Failed to auto-create payment: {e}")
    return {}


async def cancel_payment_by_rental(rental_id: int) -> dict:
    """
    Call Payment Service to cancel a pending payment for a rejected rental.
    """
    if not payment_circuit.can_execute():
        return {}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{PAYMENT_SERVICE_URL}/payments/internal/cancel-by-rental/{rental_id}",
                timeout=5.0
            )
        if response.status_code == 200:
            payment_circuit.record_success()
            return response.json()
        payment_circuit.record_success()
    except Exception as e:
        payment_circuit.record_failure()
        logger.error(f"Failed to cancel payment: {e}")
    return {}


async def credit_wallet_on_complete(admin_id: int, jumlah: float, rental_id: int) -> dict:
    """
    Call Payment Service to credit admin's wallet on rental completion.
    """
    if not payment_circuit.can_execute():
        return {}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYMENT_SERVICE_URL}/payments/internal/credit-wallet",
                json={
                    "admin_id": admin_id,
                    "jumlah": jumlah,
                    "rental_id": rental_id
                },
                timeout=5.0
            )
        if response.status_code in (200, 201):
            payment_circuit.record_success()
            return response.json()
        payment_circuit.record_success()
    except Exception as e:
        payment_circuit.record_failure()
        logger.error(f"Failed to credit wallet: {e}")
    return {}


async def check_payment_completed(rental_id: int) -> bool:
    """
    Call Payment Service to check if payment for a rental is completed.
    """
    if not payment_circuit.can_execute():
        return False
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{PAYMENT_SERVICE_URL}/payments/internal/status/{rental_id}",
                timeout=5.0
            )
        if response.status_code == 200:
            payment_circuit.record_success()
            return response.json().get("status") == "completed"
        payment_circuit.record_success()
    except Exception as e:
        payment_circuit.record_failure()
        logger.error(f"Failed to check payment status: {e}")
    return False
