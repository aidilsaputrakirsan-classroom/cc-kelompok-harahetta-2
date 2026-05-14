"""Test Category endpoints."""
from models import User, UserRole
from auth import hash_password


def _create_super_admin(db_session):
    user = User(
        email="super@test.com",
        nama="Super Admin",
        hashed_password=hash_password("Super123!"),
        role=UserRole.super_admin,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def _login(client, email, password):
    resp = client.post("/auth/login", data={"username": email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_list_categories_public(client):
    """Test list kategori tanpa login → 200."""
    response = client.get("/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_category_unauthorized(client):
    """Test buat kategori tanpa login → 401."""
    response = client.post("/categories", json={"nama": "Test"})
    assert response.status_code == 401


def test_create_category_forbidden_user(client, auth_headers):
    """Test user biasa tidak bisa buat kategori → 403."""
    response = client.post("/categories", json={"nama": "Test"}, headers=auth_headers)
    assert response.status_code == 403


def test_create_category_superadmin(client, db_session):
    """Test super admin bisa buat kategori."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.post("/categories", json={
        "nama": "Elektronik",
        "deskripsi": "Barang elektronik",
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nama"] == "Elektronik"


def test_create_category_duplicate(client, db_session):
    """Test buat kategori duplikat → 400."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    client.post("/categories", json={"nama": "Outdoor"}, headers=headers)
    response = client.post("/categories", json={"nama": "Outdoor"}, headers=headers)
    assert response.status_code == 400


def test_update_category(client, db_session):
    """Test update kategori."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    resp = client.post("/categories", json={"nama": "Old Name"}, headers=headers)
    cat_id = resp.json()["id"]

    response = client.put(f"/categories/{cat_id}", json={"nama": "New Name"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["nama"] == "New Name"


def test_delete_category(client, db_session):
    """Test hapus kategori."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    resp = client.post("/categories", json={"nama": "ToDelete"}, headers=headers)
    cat_id = resp.json()["id"]

    response = client.delete(f"/categories/{cat_id}", headers=headers)
    assert response.status_code == 204


def test_delete_category_not_found(client, db_session):
    """Test hapus kategori yang tidak ada → 404."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.delete("/categories/9999", headers=headers)
    assert response.status_code == 404
