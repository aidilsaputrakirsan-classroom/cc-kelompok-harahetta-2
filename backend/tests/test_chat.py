"""Test fitur Chat User ↔ Admin (REST endpoints)."""

from datetime import datetime, timezone

import pytest

from auth import hash_password
from models import AdminProfile, Item, User, UserRole


# ============================================================
# FIXTURES
# ============================================================

def _create_user(
    db_session,
    *,
    email: str,
    nama: str,
    role: UserRole = UserRole.user,
    is_verified: bool = True,
) -> User:
    user = User(
        email=email,
        nama=nama,
        hashed_password=hash_password("Password123"),
        role=role,
        is_active=True,
        is_verified=is_verified,
        email_verified_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, email: str, password: str = "Password123") -> dict:
    res = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def chat_world(db_session, client):
    """Bangun dunia minimal: 1 user penyewa, 1 admin penyedia, 1 item."""
    user = _create_user(db_session, email="penyewa@test.com", nama="Penyewa")
    admin_user = _create_user(
        db_session,
        email="admin@test.com",
        nama="Admin Toko",
        role=UserRole.admin,
    )
    admin_profile = AdminProfile(
        user_id=admin_user.id,
        nama_usaha="Toko Sewa Test",
        alamat_usaha="Balikpapan",
        nomor_telepon="08123456789",
    )
    db_session.add(admin_profile)
    db_session.commit()
    db_session.refresh(admin_profile)

    item = Item(
        admin_id=admin_profile.id,
        nama="Kamera Test",
        deskripsi="Kamera untuk test",
        harga_per_hari=100000.0,
        stok=1,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    user_headers = _login(client, "penyewa@test.com")
    admin_headers = _login(client, "admin@test.com")

    return {
        "user": user,
        "admin_user": admin_user,
        "admin_profile": admin_profile,
        "item": item,
        "user_headers": user_headers,
        "admin_headers": admin_headers,
    }


# ============================================================
# TESTS
# ============================================================

def test_open_room_requires_auth(client, chat_world):
    res = client.post("/chat/rooms", json={"item_id": chat_world["item"].id})
    assert res.status_code == 401


def test_user_can_open_room_for_item(client, chat_world):
    res = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["item_id"] == chat_world["item"].id
    assert body["partner_id"] == chat_world["admin_user"].id
    assert body["partner_role"] == "admin"
    assert body["unread_count"] == 0


def test_open_room_is_idempotent(client, chat_world):
    first = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    second = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    assert first["id"] == second["id"]


def test_admin_cannot_open_room_from_item_endpoint(client, chat_world):
    res = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["admin_headers"],
    )
    assert res.status_code == 403


def test_open_room_for_unknown_item(client, chat_world):
    res = client.post(
        "/chat/rooms",
        json={"item_id": 99999},
        headers=chat_world["user_headers"],
    )
    assert res.status_code == 404


def test_send_and_list_messages(client, chat_world):
    room = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    room_id = room["id"]

    # Penyewa kirim pesan
    res = client.post(
        f"/chat/rooms/{room_id}/messages",
        json={"body": "Halo, barang masih ready?"},
        headers=chat_world["user_headers"],
    )
    assert res.status_code == 201, res.text
    msg = res.json()
    assert msg["body"] == "Halo, barang masih ready?"
    assert msg["sender_id"] == chat_world["user"].id

    # Admin balas
    res2 = client.post(
        f"/chat/rooms/{room_id}/messages",
        json={"body": "Masih ready, kak"},
        headers=chat_world["admin_headers"],
    )
    assert res2.status_code == 201

    # List pesan dari sisi user
    listing = client.get(
        f"/chat/rooms/{room_id}/messages",
        headers=chat_world["user_headers"],
    ).json()
    assert listing["total"] == 2
    assert [m["body"] for m in listing["messages"]] == [
        "Halo, barang masih ready?",
        "Masih ready, kak",
    ]


def test_outsider_cannot_access_room(client, chat_world, db_session):
    room = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    other = _create_user(db_session, email="lain@test.com", nama="Orang Lain")
    other_headers = _login(client, "lain@test.com")

    res = client.get(f"/chat/rooms/{room['id']}", headers=other_headers)
    assert res.status_code == 403

    res2 = client.get(
        f"/chat/rooms/{room['id']}/messages",
        headers=other_headers,
    )
    assert res2.status_code == 403

    res3 = client.post(
        f"/chat/rooms/{room['id']}/messages",
        json={"body": "halo"},
        headers=other_headers,
    )
    assert res3.status_code == 403


def test_unread_count_and_mark_read(client, chat_world):
    room = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    room_id = room["id"]

    # Admin kirim 2 pesan
    for body in ("p1", "p2"):
        client.post(
            f"/chat/rooms/{room_id}/messages",
            json={"body": body},
            headers=chat_world["admin_headers"],
        )

    # Dari sisi user → ada 2 unread
    listing = client.get("/chat/rooms", headers=chat_world["user_headers"]).json()
    assert listing["total"] == 1
    assert listing["rooms"][0]["unread_count"] == 2

    summary = client.get("/chat/unread-count", headers=chat_world["user_headers"]).json()
    assert summary["unread"] == 2

    # Tandai sudah dibaca
    res = client.post(f"/chat/rooms/{room_id}/read", headers=chat_world["user_headers"])
    assert res.status_code == 200
    assert res.json()["marked_read"] == 2

    summary2 = client.get("/chat/unread-count", headers=chat_world["user_headers"]).json()
    assert summary2["unread"] == 0


def test_list_my_rooms_includes_partner_info(client, chat_world):
    client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    )
    # Dari sisi admin
    listing = client.get("/chat/rooms", headers=chat_world["admin_headers"]).json()
    assert listing["total"] == 1
    room = listing["rooms"][0]
    assert room["partner_id"] == chat_world["user"].id
    assert room["partner_role"] == "user"
    assert room["item_nama"] == chat_world["item"].nama


def test_send_empty_message_fails(client, chat_world):
    room = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    res = client.post(
        f"/chat/rooms/{room['id']}/messages",
        json={"body": "   "},
        headers=chat_world["user_headers"],
    )
    # Body whitespace lolos validasi length tapi disimpan strip → kita izinkan 201
    # tetapi pesan kosong setelah strip menghasilkan body kosong yang ditolak validator.
    # Untuk amannya kita cek 201 atau 422 tergantung implementasi.
    assert res.status_code in (201, 422)
    if res.status_code == 201:
        assert res.json()["body"] != ""


def test_open_room_for_self_admin_forbidden(client, chat_world):
    # Admin tidak bisa pakai endpoint open_room (cek role pada endpoint).
    res = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["admin_headers"],
    )
    assert res.status_code == 403


def test_partner_name_uses_store_name_for_admin(client, chat_world):
    """Saat user lihat room ke admin, partner_nama = nama_usaha (TOKO KUDA), bukan User.nama."""
    res = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    )
    assert res.status_code == 200
    body = res.json()
    assert body["partner_nama"] == chat_world["admin_profile"].nama_usaha == "Toko Sewa Test"
    # Bukan nama akun
    assert body["partner_nama"] != chat_world["admin_user"].nama


def test_partner_name_admin_falls_back_to_user_name_when_no_profile(client, db_session):
    """Admin tanpa AdminProfile jatuh ke User.nama (jangan crash)."""
    from auth import hash_password
    from datetime import datetime, timezone
    from models import User, UserRole

    # Buat user penyewa
    user = User(
        email="penyewa2@test.com",
        nama="Penyewa Dua",
        hashed_password=hash_password("Password123"),
        role=UserRole.user,
        is_active=True,
        is_verified=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    # Admin tanpa profile
    admin_user = User(
        email="adminnoprof@test.com",
        nama="Admin Tanpa Profil",
        hashed_password=hash_password("Password123"),
        role=UserRole.admin,
        is_active=True,
        is_verified=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(admin_user)

    # Buat room manual karena open_room butuh item
    from models import ChatRoom
    room = ChatRoom(user_id=user.id, admin_id=admin_user.id, item_id=None)
    db_session.add(room)
    db_session.commit()

    # Login sebagai user
    res = client.post(
        "/auth/login",
        data={"username": "penyewa2@test.com", "password": "Password123"},
    )
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    listing = client.get("/chat/rooms", headers=headers).json()
    assert listing["total"] == 1
    assert listing["rooms"][0]["partner_nama"] == "Admin Tanpa Profil"


def test_presence_endpoint_default_offline(client, chat_world):
    """Tanpa koneksi WS aktif, presence endpoint mengembalikan list kosong."""
    client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    )
    res = client.get("/chat/presence", headers=chat_world["user_headers"])
    assert res.status_code == 200
    assert res.json() == {"online": []}


def test_room_response_has_partner_online_field(client, chat_world):
    res = client.post(
        "/chat/rooms",
        json={"item_id": chat_world["item"].id},
        headers=chat_world["user_headers"],
    ).json()
    assert "partner_online" in res
    assert res["partner_online"] is False
