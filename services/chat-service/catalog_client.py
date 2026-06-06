"""
catalog_client.py — HTTP client untuk resolve item info dari Item Service
dan admin user_id dari Auth Service.

Dipakai untuk mendapatkan admin_user_id dari item_id saat membuka chat room.
"""
import os
import logging
import httpx
from circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

ITEM_SERVICE_URL = os.getenv("ITEM_SERVICE_URL", "http://item-service:8002")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
TIMEOUT_SECONDS = 5.0

item_circuit = CircuitBreaker(
    name="item-service",
    failure_threshold=5,
    cooldown_seconds=30,
)

auth_circuit_catalog = CircuitBreaker(
    name="auth-service-catalog",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def get_item(item_id: int) -> dict:
    """
    Fetch item detail dari Item Service.
    Return dict dengan field: id, admin_id (AdminProfile.id), nama, foto_url, dll.
    Return {} jika gagal (graceful degradation).
    """
    if not item_circuit.can_execute():
        logger.warning(f"[CircuitBreaker] Skip call to Item Service for item {item_id} (OPEN)")
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ITEM_SERVICE_URL}/items/{item_id}",
                timeout=TIMEOUT_SECONDS,
            )
        if response.status_code == 200:
            item_circuit.record_success()
            return response.json()
        item_circuit.record_success()
        logger.warning(f"Item Service returned {response.status_code} for item {item_id}")
    except Exception as e:
        item_circuit.record_failure()
        logger.error(f"Failed to fetch item {item_id}: {e}")
    return {}


async def get_admin_user_id_from_item(item_id: int) -> int | None:
    """
    Resolve admin user.id (User.id) dari item_id.
    Flow:
      1. GET /items/{item_id} → dapat admin_id (= AdminProfile.id)
      2. GET /admins/{admin_id}/payment-info dari auth-service → dapat user_id
    Return None jika gagal.
    """
    # Step 1: get item
    item_data = await get_item(item_id)
    if not item_data:
        return None

    admin_profile_id = item_data.get("admin_id")
    if not admin_profile_id:
        return None

    # Step 2: get admin profile untuk resolve user_id
    if not auth_circuit_catalog.can_execute():
        logger.warning(f"[CircuitBreaker] Skip call to Auth Service (OPEN)")
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/admins/{admin_profile_id}/payment-info",
                timeout=TIMEOUT_SECONDS,
            )
        if response.status_code == 200:
            auth_circuit_catalog.record_success()
            profile_data = response.json()
            return profile_data.get("user_id")
        auth_circuit_catalog.record_success()
        logger.warning(f"Auth Service returned {response.status_code} for admin {admin_profile_id}")
    except Exception as e:
        auth_circuit_catalog.record_failure()
        logger.error(f"Failed to fetch admin profile for admin_id {admin_profile_id}: {e}")

    return None
