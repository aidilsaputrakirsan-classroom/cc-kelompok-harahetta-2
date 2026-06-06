import sys
import os
from sqlalchemy import create_engine, text

# Set SECRET_KEY to match the default used in Docker Compose for token verification
os.environ["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Add paths to sys.path to resolve service modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services/item-service")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services/auth-service")))

import time
import pytest
import httpx
from circuit_breaker import CircuitBreaker
import email_service

AUTH_DB_URL = os.getenv("AUTH_DB_URL", "postgresql://postgres:postgres@localhost:5433/auth_db")
db_engine = create_engine(AUTH_DB_URL)

# Unique email generation to avoid conflicts on repeated runs
timestamp = int(time.time())
user_email = f"user_{timestamp}@example.com"
admin_email = f"admin_{timestamp}@example.com"
superadmin_email = f"superadmin_{timestamp}@example.com"

# Shared state between test cases
test_state = {
    "user_token": None,
    "user_id": None,
    "admin_token": None,
    "admin_id": None,
    "superadmin_token": None,
    "category_id": None,
    "item_id": None,
    "rental_id": None,
    "promo_id": None,
    "payment_id": None,
}

# =====================================================================
# 1. AUTHENTICATION & PROFILE TESTS
# =====================================================================

def test_01_register_users(client):
    """Test registering regular user, admin user, and superadmin."""
    # Register User
    res = client.post("/auth/register", json={
        "email": user_email,
        "nama": "Test User",
        "password": "Password123",
        "role": "user"
    })
    assert res.status_code == 201
    assert "email" in res.json()
    test_state["user_id"] = res.json()["id"]

    # Verify User's email using the token to allow login
    token = email_service.create_verification_token(test_state["user_id"])
    verify_res = client.post("/auth/verify-email", json={"token": token})
    assert verify_res.status_code == 200

    # Also mark user as verified (KTP verification) so they can create rentals
    with db_engine.begin() as conn:
        conn.execute(text("UPDATE users SET is_verified = TRUE WHERE id = :id"), {"id": test_state["user_id"]})

    # Register Admin
    res = client.post("/auth/register", json={
        "email": admin_email,
        "nama": "Test Admin",
        "password": "Password123",
        "role": "admin"
    })
    assert res.status_code == 201
    test_state["admin_id"] = res.json()["id"]

    # Manually upgrade admin role in database and verify
    with db_engine.begin() as conn:
        conn.execute(text("UPDATE users SET role = 'admin', email_verified_at = NOW(), is_verified = TRUE WHERE id = :id"), {"id": test_state["admin_id"]})
    
    # Register Super Admin
    res = client.post("/auth/register", json={
        "email": superadmin_email,
        "nama": "Test Superadmin",
        "password": "Password123",
        "role": "super_admin"
    })
    assert res.status_code == 201
    test_state["superadmin_id"] = res.json()["id"]

    # Manually upgrade superadmin role in database and verify
    with db_engine.begin() as conn:
        conn.execute(text("UPDATE users SET role = 'super_admin', email_verified_at = NOW() WHERE id = :id"), {"id": test_state["superadmin_id"]})

def test_02_login_users(client):
    """Test user login and token generation."""
    # User Login
    res = client.post("/auth/login", data={
        "username": user_email,
        "password": "Password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    test_state["user_token"] = res.json()["access_token"]

    # Admin Login
    res = client.post("/auth/login", data={
        "username": admin_email,
        "password": "Password123"
    })
    assert res.status_code == 200
    test_state["admin_token"] = res.json()["access_token"]

    # Superadmin Login
    res = client.post("/auth/login", data={
        "username": superadmin_email,
        "password": "Password123"
    })
    assert res.status_code == 200
    test_state["superadmin_token"] = res.json()["access_token"]

# =====================================================================
# 2. CATALOG & CATEGORY CRUD TESTS
# =====================================================================

def test_03_category_management(client):
    """Test category creation by Super Admin."""
    headers = {"Authorization": f"Bearer {test_state['superadmin_token']}"}
    
    # Create Category
    res = client.post("/categories", headers=headers, json={
        "nama": f"Category_{timestamp}",
        "deskripsi": "Testing category"
    })
    assert res.status_code == 201
    assert "id" in res.json()
    test_state["category_id"] = res.json()["id"]

    # Get Categories List
    res = client.get("/categories")
    assert res.status_code == 200
    assert len(res.json()) >= 1

def test_04_item_management(client):
    """Test item creation by Admin."""
    headers = {"Authorization": f"Bearer {test_state['admin_token']}"}
    
    # Create Admin Profile
    res = client.post("/admin/profile", headers=headers, json={
        "nama_usaha": "Harahetta Rental",
        "alamat_usaha": "Jalan Kebon Jeruk, Jakarta Barat",
        "nomor_telepon": "08123456789",
        "latitude": -6.123,
        "longitude": 106.123
    })
    assert res.status_code == 201

    # Create Item in Item Service
    res = client.post("/items", headers=headers, json={
        "category_id": test_state["category_id"],
        "nama": "Canon EOS 80D Camera",
        "deskripsi": "Professional DSLR Camera for Rent",
        "harga_per_hari": 150000.0,
        "stok": 5,
        "foto_url": "http://example.com/camera.jpg"
    })
    assert res.status_code == 201
    assert "id" in res.json()
    test_state["item_id"] = res.json()["id"]

# =====================================================================
# 3. RENTAL BOOKING & AUTOMATED PAYMENT INTEGRATION TESTS
# =====================================================================

def test_05_rental_creation(client):
    """Test creating a rental booking by a User."""
    headers = {"Authorization": f"Bearer {test_state['user_token']}"}
    
    res = client.post("/rentals", headers=headers, json={
        "item_id": test_state["item_id"],
        "tanggal_mulai": "2026-07-01",
        "tanggal_selesai": "2026-07-03", # 2 days rental
        "catatan": "Please approve quickly"
    })
    assert res.status_code == 201
    assert res.json()["status"] == "pending"
    assert "id" in res.json()
    test_state["rental_id"] = res.json()["id"]

def test_06_rental_approval_triggers_payment(client):
    """Test that approving a rental automatically triggers a pending payment."""
    # Approve rental using admin credentials
    headers = {"Authorization": f"Bearer {test_state['admin_token']}"}
    
    res = client.put(f"/rentals/{test_state['rental_id']}/status", headers=headers, json={"status": "disetujui"})
    assert res.status_code == 200
    assert res.json()["status"] == "disetujui"

    # Verify that a pending payment was auto-created in Payment Service
    # We query the gateway's status check endpoint
    headers_user = {"Authorization": f"Bearer {test_state['user_token']}"}
    time.sleep(1.0) # wait briefly for async DB creation if any, though it should be synchronous inside the route
    
    # We check through the public /payments/status/{rental_id} route
    res = client.get(f"/payments/status/{test_state['rental_id']}", headers=headers_user)
    assert res.status_code == 200
    data = res.json()
    assert data["rental_id"] == test_state["rental_id"]
    assert data["status"] == "pending"
    assert data["jumlah"] == 300000.0 # 2 days * 150000
    test_state["payment_id"] = data["id"]

# =====================================================================
# 4. PROMO CODES & WALLET MANAGEMENT TESTS
# =====================================================================

def test_07_promo_code_validation(client):
    """Test promo code creation and validation."""
    headers_super = {"Authorization": f"Bearer {test_state['superadmin_token']}"}
    headers_user = {"Authorization": f"Bearer {test_state['user_token']}"}
    
    # Create Promo Code
    promo_code = f"PROMO_{timestamp}"
    res = client.post("/superadmin/promos", headers=headers_super, json={
        "code": promo_code,
        "nama": "Discount Promo",
        "deskripsi": "Gets 10% off",
        "discount_type": "percentage",
        "discount_value": 10.0,
        "max_discount": 50000.0,
        "min_order": 100000.0,
        "eligibility": "all",
        "max_uses_per_user": 1,
        "is_active": True
    })
    assert res.status_code == 201
    
    # Validate Promo Code
    res = client.post(f"/promos/validate", headers=headers_user, json={
        "code": promo_code,
        "original_amount": 300000.0
    })
    assert res.status_code == 200
    assert res.json()["discount_amount"] == 30000.0 # 10% of 300000

# =====================================================================
# 5. CIRCUIT BREAKER RELIABILITY TESTS (Unit / Mock HTTP level)
# =====================================================================

def test_08_circuit_breaker_transitions():
    """Verify that circuit breaker changes states correctly (CLOSED -> OPEN -> HALF-OPEN -> CLOSED)."""
    # Initialize circuit breaker with failure threshold of 3, cooldown of 1 second
    breaker = CircuitBreaker(name="test-breaker", failure_threshold=3, cooldown_seconds=1)
    
    # Initially CLOSED
    assert breaker.state == "CLOSED"
    assert breaker.can_execute() is True
    
    # Trip the breaker (3 failures)
    breaker.record_failure()
    assert breaker.state == "CLOSED"
    breaker.record_failure()
    assert breaker.state == "CLOSED"
    breaker.record_failure() # 3rd failure: trips the breaker
    assert breaker.state == "OPEN"
    
    # Now it should deny execution (fail fast)
    assert breaker.can_execute() is False
    
    # Wait for cooldown (1.1 seconds)
    time.sleep(1.1)
    
    # Next execution check should transition it to HALF-OPEN
    assert breaker.can_execute() is True
    assert breaker.state == "HALF_OPEN"
    
    # If the execution fails again during HALF-OPEN, it trips back to OPEN
    breaker.record_failure()
    assert breaker.state == "OPEN"
    assert breaker.can_execute() is False
    
    # Wait for cooldown again
    time.sleep(1.1)
    assert breaker.can_execute() is True
    assert breaker.state == "HALF_OPEN"
    
    # If successful, it recovers back to CLOSED
    breaker.record_success()
    assert breaker.state == "CLOSED"
    assert breaker.can_execute() is True
