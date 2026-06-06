"""
Catalog Client — HTTP client untuk berkomunikasi dengan Catalog (Item) Service.
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

CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://item-service:8002")

catalog_circuit = CircuitBreaker(
    name="catalog-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def get_item_details(item_id: int) -> dict:
    if not catalog_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Catalog Service circuit breaker OPEN. Try again later."
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CATALOG_SERVICE_URL}/items/{item_id}",
                timeout=5.0
            )

        if response.status_code == 200:
            catalog_circuit.record_success()
            return response.json()
        elif response.status_code == 404:
            catalog_circuit.record_success()
            raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
        else:
            catalog_circuit.record_success()
            raise HTTPException(
                status_code=response.status_code,
                detail="Gagal mengambil informasi barang dari Catalog Service"
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        catalog_circuit.record_failure()
        logger.error(f"Cannot connect to Catalog Service: {e}")
        raise HTTPException(
            status_code=503,
            detail="Catalog Service sedang tidak tersedia."
        )


async def update_item_status(item_id: int, status: str, auth_header: str) -> dict:
    if not catalog_circuit.can_execute():
        logger.warning(f"Catalog Service circuit breaker OPEN. Skipping update for item {item_id}")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{CATALOG_SERVICE_URL}/items/{item_id}",
                json={"status": status},
                headers={"Authorization": auth_header},
                timeout=5.0
            )

        if response.status_code == 200:
            catalog_circuit.record_success()
            return response.json()
        catalog_circuit.record_success()
    except Exception as e:
        catalog_circuit.record_failure()
        logger.error(f"Failed to update item status: {e}")
    return {}


async def decrement_item_stock(item_id: int) -> dict:
    if not catalog_circuit.can_execute():
        return {}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{CATALOG_SERVICE_URL}/items/internal/{item_id}/decrement-stock",
                timeout=5.0
            )
        if response.status_code == 200:
            catalog_circuit.record_success()
            return response.json()
        catalog_circuit.record_success()
    except Exception as e:
        catalog_circuit.record_failure()
        logger.error(f"Failed to decrement item stock: {e}")
    return {}


async def restore_item_stock(item_id: int) -> dict:
    if not catalog_circuit.can_execute():
        return {}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{CATALOG_SERVICE_URL}/items/internal/{item_id}/restore-stock",
                timeout=5.0
            )
        if response.status_code == 200:
            catalog_circuit.record_success()
            return response.json()
        catalog_circuit.record_success()
    except Exception as e:
        catalog_circuit.record_failure()
        logger.error(f"Failed to restore item stock: {e}")
    return {}
