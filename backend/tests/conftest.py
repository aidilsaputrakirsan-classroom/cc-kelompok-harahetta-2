"""
conftest.py — Test Fixtures untuk Sewain Backend
Menggunakan SQLite file sementara (test_sewain.db) sebagai database testing.

Strategi:
- Set DATABASE_URL ke SQLite file sementara SEBELUM import apapun dari aplikasi.
- load_dotenv(override=False) memastikan env var ini tidak ditimpa oleh .env.
- Setiap test mendapat tabel bersih (create_all → test → drop_all).
- dependency_overrides menggantikan session produksi dengan session test.
"""

import os
import pytest

# ── WAJIB: set env vars SEBELUM import aplikasi ────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite:///./test_sewain.db"
os.environ["SECRET_KEY"] = "testsecretkey1234567890abcdef"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

# Sekarang aman untuk import aplikasi
from sqlalchemy.orm import sessionmaker          # noqa: E402
from fastapi.testclient import TestClient        # noqa: E402
from database import engine, get_db, Base       # noqa: E402
from main import app                             # noqa: E402

# Session factory yang menggunakan engine yang sama dengan aplikasi (test_sewain.db)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def db_session():
    """
    Buat semua tabel di SQLite test DB, yield session, drop semua tabel setelah test.
    Scope 'function' = isolasi penuh antar test.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient dengan dependency override:
    setiap request ke get_db mengembalikan session test yang sama.
    """
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass  # Jangan tutup session di sini; db_session fixture yang urus

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ── Auth helper fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def admin_headers(client, db_session):
    """
    Buat user admin + profil usaha langsung di DB, login, dan kembalikan header JWT.
    Catatan: client fixture sudah meng-override get_db, jadi perubahan di
    db_session langsung terlihat oleh request melalui client.
    """
    from auth import hash_password
    from models import User, UserRole, AdminProfile

    admin_user = User(
        email="admin@test.com",
        nama="Admin Toko",
        hashed_password=hash_password("Adminpass123"),
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    admin_profile = AdminProfile(
        user_id=admin_user.id,
        nama_usaha="Toko Test Sewa",
    )
    db_session.add(admin_profile)
    db_session.commit()

    resp = client.post("/auth/login", data={
        "username": "admin@test.com",
        "password": "Adminpass123",
    })
    assert resp.status_code == 200, f"Login admin gagal: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def superadmin_headers(client, db_session):
    """
    Buat user super_admin di DB, login, dan kembalikan header JWT.
    """
    from auth import hash_password
    from models import User, UserRole

    sa = User(
        email="sa@test.com",
        nama="Super Admin",
        hashed_password=hash_password("SApass123"),
        role=UserRole.super_admin,
        is_active=True,
    )
    db_session.add(sa)
    db_session.commit()

    resp = client.post("/auth/login", data={
        "username": "sa@test.com",
        "password": "SApass123",
    })
    assert resp.status_code == 200, f"Login super admin gagal: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_item(client, admin_headers):
    """Buat satu item sewa sampel via API dan kembalikan data JSON-nya."""
    resp = client.post("/items", json={
        "nama": "Kamera Test",
        "harga_per_hari": 150000.0,
        "stok": 3,
        "deskripsi": "Kamera untuk testing",
    }, headers=admin_headers)
    assert resp.status_code == 201, f"Gagal buat item: {resp.text}"
    return resp.json()
