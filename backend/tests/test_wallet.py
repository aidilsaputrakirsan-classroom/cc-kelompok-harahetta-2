"""Test Wallet & Withdrawal endpoints."""
from models import User, UserRole, AdminProfile, Wallet
from auth import hash_password


def _create_admin_with_wallet(db_session, saldo=0):
    """Helper: buat admin user + profile + wallet langsung di DB."""
    user = User(
        email="admin@test.com",
        nama="Admin Test",
        hashed_password=hash_password("Admin123!"),
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    profile = AdminProfile(
        user_id=user.id,
        nama_usaha="Toko Test",
        alamat_usaha="Jl. Test",
        nomor_telepon="08123456789",
        latitude=-1.0,
        longitude=116.0,
    )
    db_session.add(profile)
    db_session.flush()

    wallet = Wallet(
        admin_id=profile.id,
        saldo=saldo,
        total_pendapatan=saldo,
        total_withdrawn=0,
    )
    db_session.add(wallet)
    db_session.commit()
    return user, profile, wallet


def _create_super_admin(db_session):
    """Helper: buat super admin user langsung di DB."""
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
    """Helper: login dan return headers."""
    resp = client.post("/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_wallet_unauthorized(client):
    """Test akses wallet tanpa login → 401."""
    response = client.get("/admin/wallet")
    assert response.status_code == 401


def test_get_wallet_forbidden_user(client, auth_headers):
    """Test user biasa tidak bisa akses wallet → 403."""
    response = client.get("/admin/wallet", headers=auth_headers)
    assert response.status_code == 403


def test_get_wallet_admin(client, db_session):
    """Test admin bisa lihat wallet-nya."""
    _create_admin_with_wallet(db_session, saldo=0)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.get("/admin/wallet", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["saldo"] == 0.0
    assert data["total_pendapatan"] == 0.0
    assert data["total_withdrawn"] == 0.0


def test_get_wallet_transactions_empty(client, db_session):
    """Test riwayat transaksi kosong."""
    _create_admin_with_wallet(db_session, saldo=0)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.get("/admin/wallet/transactions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["transactions"] == []


def test_withdraw_insufficient_balance(client, db_session):
    """Test WD gagal karena saldo tidak cukup."""
    _create_admin_with_wallet(db_session, saldo=0)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.post("/admin/wallet/withdraw", headers=headers, json={
        "jumlah": 100000,
        "bank_name": "BCA",
        "account_number": "1234567890",
        "account_holder": "Admin Test",
    })
    assert response.status_code == 400
    assert "Saldo tidak cukup" in response.json()["detail"]


def test_withdraw_below_minimum(client, db_session):
    """Test WD gagal karena di bawah minimum."""
    _create_admin_with_wallet(db_session, saldo=100000)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.post("/admin/wallet/withdraw", headers=headers, json={
        "jumlah": 10000,
        "bank_name": "BCA",
        "account_number": "1234567890",
        "account_holder": "Admin Test",
    })
    assert response.status_code == 400
    assert "Minimal" in response.json()["detail"]


def test_withdraw_success(client, db_session):
    """Test WD berhasil diajukan."""
    _create_admin_with_wallet(db_session, saldo=500000)
    headers = _login(client, "admin@test.com", "Admin123!")

    response = client.post("/admin/wallet/withdraw", headers=headers, json={
        "jumlah": 200000,
        "bank_name": "BNI",
        "account_number": "9876543210",
        "account_holder": "Admin Test",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["jumlah"] == 200000
    assert data["bank_name"] == "BNI"
    assert data["status"] == "pending"

    # Cek saldo berkurang
    resp2 = client.get("/admin/wallet", headers=headers)
    assert resp2.json()["saldo"] == 300000


def test_my_withdrawals(client, db_session):
    """Test admin lihat riwayat WD."""
    _create_admin_with_wallet(db_session, saldo=500000)
    headers = _login(client, "admin@test.com", "Admin123!")

    # Buat WD via API
    resp = client.post("/admin/wallet/withdraw", headers=headers, json={
        "jumlah": 100000, "bank_name": "BCA",
        "account_number": "11111", "account_holder": "Test",
    })
    assert resp.status_code == 201

    response = client.get("/admin/wallet/withdrawals", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["withdrawals"][0]["jumlah"] == 100000


def test_superadmin_list_withdrawals(client, db_session):
    """Test super admin lihat semua WD."""
    _create_super_admin(db_session)
    _create_admin_with_wallet(db_session, saldo=500000)

    # Admin buat WD
    admin_headers = _login(client, "admin@test.com", "Admin123!")
    resp = client.post("/admin/wallet/withdraw", headers=admin_headers, json={
        "jumlah": 100000, "bank_name": "BRI",
        "account_number": "22222", "account_holder": "Test",
    })
    assert resp.status_code == 201

    # Super admin lihat
    sa_headers = _login(client, "super@test.com", "Super123!")
    response = client.get("/superadmin/withdrawals", headers=sa_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_superadmin_process_withdrawal(client, db_session):
    """Test super admin proses WD: pending → processing → completed."""
    _create_super_admin(db_session)
    _create_admin_with_wallet(db_session, saldo=500000)

    admin_headers = _login(client, "admin@test.com", "Admin123!")
    resp = client.post("/admin/wallet/withdraw", headers=admin_headers, json={
        "jumlah": 200000, "bank_name": "Mandiri",
        "account_number": "33333", "account_holder": "Test",
    })
    assert resp.status_code == 201
    wd_id = resp.json()["id"]

    sa_headers = _login(client, "super@test.com", "Super123!")

    # pending → processing
    resp2 = client.put(f"/superadmin/withdrawals/{wd_id}", headers=sa_headers, json={
        "status": "processing", "catatan": "Sedang diproses",
    })
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "processing"

    # processing → completed
    resp3 = client.put(f"/superadmin/withdrawals/{wd_id}", headers=sa_headers, json={
        "status": "completed",
    })
    assert resp3.status_code == 200
    assert resp3.json()["status"] == "completed"


def test_superadmin_reject_withdrawal(client, db_session):
    """Test super admin tolak WD → saldo dikembalikan."""
    _create_super_admin(db_session)
    _create_admin_with_wallet(db_session, saldo=500000)

    admin_headers = _login(client, "admin@test.com", "Admin123!")
    resp = client.post("/admin/wallet/withdraw", headers=admin_headers, json={
        "jumlah": 150000, "bank_name": "BSI",
        "account_number": "44444", "account_holder": "Test",
    })
    assert resp.status_code == 201
    wd_id = resp.json()["id"]

    # Saldo sekarang 350000
    sa_headers = _login(client, "super@test.com", "Super123!")
    resp2 = client.put(f"/superadmin/withdrawals/{wd_id}", headers=sa_headers, json={
        "status": "rejected", "rejected_reason": "Nomor rekening salah",
    })
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "rejected"
    assert resp2.json()["rejected_reason"] == "Nomor rekening salah"

    # Saldo harus kembali ke 500000
    resp3 = client.get("/admin/wallet", headers=admin_headers)
    assert resp3.json()["saldo"] == 500000


def test_invalid_withdrawal_transition(client, db_session):
    """Test transisi status WD yang tidak valid."""
    _create_super_admin(db_session)
    _create_admin_with_wallet(db_session, saldo=500000)

    admin_headers = _login(client, "admin@test.com", "Admin123!")
    resp = client.post("/admin/wallet/withdraw", headers=admin_headers, json={
        "jumlah": 100000, "bank_name": "BCA",
        "account_number": "55555", "account_holder": "Test",
    })
    assert resp.status_code == 201
    wd_id = resp.json()["id"]

    sa_headers = _login(client, "super@test.com", "Super123!")
    # pending → completed langsung (tidak valid, harus lewat processing)
    resp2 = client.put(f"/superadmin/withdrawals/{wd_id}", headers=sa_headers, json={
        "status": "completed",
    })
    assert resp2.status_code == 400


def test_withdrawal_not_found(client, db_session):
    """Test proses WD yang tidak ada."""
    _create_super_admin(db_session)
    sa_headers = _login(client, "super@test.com", "Super123!")

    resp = client.put("/superadmin/withdrawals/9999", headers=sa_headers, json={
        "status": "processing",
    })
    assert resp.status_code == 404
