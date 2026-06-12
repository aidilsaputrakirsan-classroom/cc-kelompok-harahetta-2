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


def test_register_duplicate_email(client, db_session):
    """Test registrasi email yang sudah verified → 400. Email belum verified → 201 (replace)."""
    from datetime import datetime, timezone
    from models import User

    # 1. Register pertama kali → 201
    client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "DupPass123!",
        "nama": "Dup User",
    })

    # 2. Daftar ulang dengan email yang BELUM diverifikasi → 201 (replace data)
    response = client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "NewPass123!",
        "nama": "Dup User 2",
    })
    assert response.status_code == 201

    # 3. Tandai email sebagai verified, lalu coba daftar ulang → 400
    user = db_session.query(User).filter(User.email == "dup@example.com").first()
    user.email_verified_at = datetime.now(timezone.utc)
    db_session.commit()

    response = client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "AnotherPass123!",
        "nama": "Dup User 3",
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


def test_login_success(client, db_session):
    """Test login berhasil (setelah email diverifikasi)."""
    from datetime import datetime, timezone
    from models import User

    client.post("/auth/register", json={
        "email": "login@example.com",
        "password": "Login123!",
        "nama": "Login User",
    })
    # Verifikasi email di DB (simulasi klik link verifikasi)
    user = db_session.query(User).filter(User.email == "login@example.com").first()
    user.email_verified_at = datetime.now(timezone.utc)
    db_session.commit()

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


# ============================================================
# PUT /auth/me — update foto profil & nama
# ============================================================

def test_update_me_set_and_clear_foto_profil(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json().get("foto_profil") in (None, "")

    # Set foto
    payload = {"foto_profil": "data:image/png;base64,AAAA"}
    res2 = client.put("/auth/me", json=payload, headers=auth_headers)
    assert res2.status_code == 200, res2.text
    assert res2.json()["foto_profil"] == "data:image/png;base64,AAAA"

    # Hapus foto
    res3 = client.put("/auth/me", json={"foto_profil": ""}, headers=auth_headers)
    assert res3.status_code == 200
    assert res3.json()["foto_profil"] is None


def test_update_me_change_nama(client, auth_headers):
    res = client.put("/auth/me", json={"nama": "Nama Baru"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["nama"] == "Nama Baru"


def test_update_me_rejects_short_nama(client, auth_headers):
    res = client.put("/auth/me", json={"nama": "a"}, headers=auth_headers)
    # Pydantic min_length=2 akan pulangkan 422 sebelum sampai endpoint
    assert res.status_code in (400, 422)


def test_update_me_requires_auth(client):
    res = client.put("/auth/me", json={"foto_profil": ""})
    assert res.status_code == 401
