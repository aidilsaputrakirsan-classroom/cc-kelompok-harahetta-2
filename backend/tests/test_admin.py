"""Test Admin Profile & Super Admin endpoints."""
from models import User, UserRole, AdminProfile
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


def _create_admin(db_session):
    user = User(
        email="admin@test.com",
        nama="Admin Test",
        hashed_password=hash_password("Admin123!"),
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, email, password):
    resp = client.post("/auth/login", data={"username": email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_create_admin_profile(client, db_session):
    """Test admin buat profil usaha."""
    _create_admin(db_session)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.post("/admin/profile", headers=headers, json={
        "nama_usaha": "Toko Sewa",
        "alamat_usaha": "Jl. Test No.1",
        "nomor_telepon": "08123456789",
        "latitude": -1.265,
        "longitude": 116.831,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["nama_usaha"] == "Toko Sewa"


def test_create_admin_profile_duplicate(client, db_session):
    """Test buat profil usaha duplikat → 400."""
    _create_admin(db_session)
    headers = _login(client, "admin@test.com", "Admin123!")

    client.post("/admin/profile", headers=headers, json={
        "nama_usaha": "Toko 1",
        "alamat_usaha": "Jl. A",
        "nomor_telepon": "081",
    })
    response = client.post("/admin/profile", headers=headers, json={
        "nama_usaha": "Toko 2",
        "alamat_usaha": "Jl. B",
        "nomor_telepon": "082",
    })
    assert response.status_code == 400


def test_get_admin_profile(client, db_session):
    """Test admin lihat profil usaha."""
    user = _create_admin(db_session)
    profile = AdminProfile(
        user_id=user.id, nama_usaha="Existing",
        alamat_usaha="Jl. X", nomor_telepon="08111",
        latitude=-1.0, longitude=116.0,
    )
    db_session.add(profile)
    db_session.commit()

    headers = _login(client, "admin@test.com", "Admin123!")
    response = client.get("/admin/profile", headers=headers)
    assert response.status_code == 200
    assert response.json()["nama_usaha"] == "Existing"


def test_get_admin_profile_not_found(client, db_session):
    """Test admin tanpa profil → 404."""
    _create_admin(db_session)
    headers = _login(client, "admin@test.com", "Admin123!")
    response = client.get("/admin/profile", headers=headers)
    assert response.status_code == 404


def test_update_admin_profile(client, db_session):
    """Test admin update profil usaha."""
    user = _create_admin(db_session)
    profile = AdminProfile(
        user_id=user.id, nama_usaha="Old Name",
        alamat_usaha="Jl. Old", nomor_telepon="08111",
        latitude=-1.0, longitude=116.0,
    )
    db_session.add(profile)
    db_session.commit()

    headers = _login(client, "admin@test.com", "Admin123!")
    response = client.put("/admin/profile", headers=headers, json={
        "nama_usaha": "New Name",
        "alamat_usaha": "Jl. New",
    })
    assert response.status_code == 200
    assert response.json()["nama_usaha"] == "New Name"


def test_superadmin_stats(client, db_session):
    """Test super admin lihat stats platform."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.get("/superadmin/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_admins" in data
    assert "total_revenue" in data


def test_superadmin_create_admin(client, db_session):
    """Test super admin buat admin baru."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.post("/superadmin/admins", headers=headers, json={
        "email": "newadmin@test.com",
        "nama": "New Admin",
        "password": "NewAdmin123!",
        "nama_usaha": "Toko Baru",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["nama_usaha"] == "Toko Baru"


def test_superadmin_list_users(client, db_session):
    """Test super admin lihat semua user."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.get("/superadmin/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "users" in data


def test_superadmin_list_admins(client, db_session):
    """Test super admin lihat semua admin."""
    _create_super_admin(db_session)
    headers = _login(client, "super@test.com", "Super123!")

    response = client.get("/superadmin/admins", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data


def test_user_cannot_access_superadmin(client, auth_headers):
    """Test user biasa tidak bisa akses endpoint super admin."""
    response = client.get("/superadmin/stats", headers=auth_headers)
    assert response.status_code == 403

    response = client.get("/superadmin/users", headers=auth_headers)
    assert response.status_code == 403
