"""Test Auth endpoints."""


def test_register_success(client):
    """Test registrasi user baru berhasil."""
    response = client.post("/auth/register", json={
        "email": "new@example.com",
        "password": "NewPass123!",
        "nama": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["role"] == "user"


def test_register_duplicate_email(client):
    """Test registrasi dengan email yang sudah ada → 400."""
    client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "DupPass123!",
        "nama": "Dup User",
    })
    response = client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "DupPass123!",
        "nama": "Dup User 2",
    })
    assert response.status_code == 400


def test_register_weak_password(client):
    """Test registrasi dengan password lemah → 422."""
    response = client.post("/auth/register", json={
        "email": "weak@example.com",
        "password": "123",
        "nama": "Weak User",
    })
    assert response.status_code == 422


def test_login_success(client):
    """Test login berhasil."""
    client.post("/auth/register", json={
        "email": "login@example.com",
        "password": "Login123!",
        "nama": "Login User",
    })
    response = client.post("/auth/login", data={
        "username": "login@example.com",
        "password": "Login123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@example.com"


def test_login_wrong_password(client):
    """Test login dengan password salah → 401."""
    client.post("/auth/register", json={
        "email": "wrong@example.com",
        "password": "Right123!",
        "nama": "Wrong User",
    })
    response = client.post("/auth/login", data={
        "username": "wrong@example.com",
        "password": "WrongPass123!",
    })
    assert response.status_code == 401


def test_login_nonexistent_email(client):
    """Test login dengan email yang tidak ada → 401."""
    response = client.post("/auth/login", data={
        "username": "ghost@example.com",
        "password": "Ghost123!",
    })
    assert response.status_code == 401


def test_get_me(client, auth_headers):
    """Test ambil data user yang sedang login."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "user"


def test_get_me_unauthorized(client):
    """Test akses /auth/me tanpa token → 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401
