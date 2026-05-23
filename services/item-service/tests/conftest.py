"""
Konfigurasi pytest untuk Item Service.
- Menggunakan SQLite in-memory (tidak perlu PostgreSQL berjalan)
- Mock dependency verify_token_with_auth_service (tidak perlu Auth Service berjalan)
"""
import sys
import os

# ⚠️ PENTING: Set DATABASE_URL SEBELUM import apapun dari app
# Karena main.py memanggil Base.metadata.create_all(bind=engine) saat import
# Jika tidak di-set duluan, engine akan connect ke PostgreSQL (default) dan error
os.environ["DATABASE_URL"] = "sqlite:///./test_item.db"

# Tambahkan parent folder ke sys.path agar import module item-service bisa berjalan
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from auth_client import verify_token_with_auth_service

# ============================================================
# DATABASE IN-MEMORY (SQLite) — menggantikan PostgreSQL
# ============================================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_item.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency dengan SQLite test DB."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# MOCK AUTH — menggantikan HTTP call ke Auth Service
# ============================================================
FAKE_USER = {
    "user_id": 1,
    "email": "testuser@example.com",
    "name": "Test User",
}


async def override_verify_token():
    """Override auth dependency — selalu return fake user tanpa HTTP call."""
    return FAKE_USER


# ============================================================
# FIXTURES
# ============================================================
@pytest.fixture(scope="function")
def client():
    """
    Client pytest dengan:
    - SQLite in-memory sebagai database
    - Auth dependency di-mock (tidak panggil Auth Service)
    - Tabel dibuat fresh setiap test function
    """
    # Terapkan overrides
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_token_with_auth_service] = override_verify_token

    # Buat tabel fresh
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as c:
        yield c

    # Cleanup setelah setiap test
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client_with_items(client):
    """
    Client yang sudah di-seed dengan beberapa item untuk testing.
    Items:
      - Laptop: Rp 15.000.000
      - Mouse:  Rp 250.000
      - Keyboard: Rp 750.000
    """
    items_seed = [
        {"name": "Laptop", "description": "Gaming laptop", "price": 15000000.0, "quantity": 2},
        {"name": "Mouse", "description": "Wireless mouse", "price": 250000.0, "quantity": 10},
        {"name": "Keyboard", "description": "Mechanical keyboard", "price": 750000.0, "quantity": 5},
    ]
    for item in items_seed:
        client.post("/items", json=item, headers={"Authorization": "Bearer fake-token"})

    return client
