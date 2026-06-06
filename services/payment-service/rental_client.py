"""
Rental Client — HTTP client untuk berkomunikasi dengan Rental Service.
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

RENTAL_SERVICE_URL = os.getenv("RENTAL_SERVICE_URL", "http://rental-service:8003")

rental_circuit = CircuitBreaker(
    name="rental-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def cancel_rental(rental_id: int) -> dict:
    """
    Call Rental Service to cancel a rental due to payment failure or cancellation.
    """
    if not rental_circuit.can_execute():
        logger.warning(f"Rental Service circuit breaker OPEN. Skipping cancel for rental {rental_id}")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{RENTAL_SERVICE_URL}/rentals/internal/{rental_id}/cancel-from-payment",
                timeout=5.0
            )

        if response.status_code == 200:
            rental_circuit.record_success()
            return response.json()
        rental_circuit.record_success()
    except Exception as e:
        rental_circuit.record_failure()
        logger.error(f"Failed to notify Rental Service of cancellation: {e}")
    return {}


async def get_rental_details(rental_id: int, auth_token: str = None) -> dict:
    """
    Fetch rental details from Rental Service.
    """
    if not rental_circuit.can_execute():
        return {}
    try:
        headers = {}
        if auth_token:
            headers["Authorization"] = auth_token
        async with httpx.AsyncClient() as client:
            # We bypass verify if we call internal or standard route
            # Let's call standard but passing token if available, or call internal if we make one
            # Actually, standard route /rentals/{rental_id} works.
            # But wait! If we call standard route, we must pass the authorization header!
            # What if we have a rental internal endpoint that doesn't need auth token?
            # Yes! Let's make an internal route in rental-service or catalog-service.
            # In rental-service main.py we can add `@app.get("/rentals/internal/{rental_id}")` which doesn't check JWT!
            # That is much cleaner and doesn't require passing client auth tokens for internal query.
            response = await client.get(
                f"{RENTAL_SERVICE_URL}/rentals/internal/{rental_id}",
                timeout=5.0
            )
        if response.status_code == 200:
            rental_circuit.record_success()
            return response.json()
        rental_circuit.record_success()
    except Exception as e:
        rental_circuit.record_failure()
        logger.error(f"Failed to fetch rental details: {e}")
    return {}
