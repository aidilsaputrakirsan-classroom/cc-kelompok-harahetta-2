"""Test fitur Review/Testimoni dan endpoint profil toko."""

from datetime import date, datetime, timezone, timedelta

import pytest

from auth import hash_password
from models import (
    AdminProfile, Item, Rental, RentalStatus, Review, User, UserRole,
)


# ============================================================
# FIXTURES & HELPERS
# ============================================================

def _make_user(db, email, nama, role=UserRole.user, verified=True):
    u = User(
        email=email,
        nama=nama,
        hashed_password=hash_password("Password123"),
        role=role,
        is_active=True,
        is_verified=verified,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _login(client, email, password="Password123"):
    res = client.post("/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def world(db_session, client):
    """Bangun: 1 user, 1 admin (toko), 1 item, 1 rental selesai."""
    user = _make_user(db_session, "penyewa1@test.com", "Penyewa Satu")
    admin_user = _make_user(
        db_session, "tokoA@test.com", "Pemilik Toko", role=UserRole.admin,
    )
    admin = AdminProfile(
        user_id=admin_user.id,
        nama_usaha="Toko Alpha",
        alamat_usaha="Jl. Sudirman, Balikpapan",
        nomor_telepon="08123456789",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    item = Item(
        admin_id=admin.id,
        nama="Kamera Sony A7",
        deskripsi="Kamera mirrorless",
        harga_per_hari=200000.0,
        stok=2,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    rental = Rental(
        user_id=user.id,
        item_id=item.id,
        tanggal_mulai=date.today() - timedelta(days=5),
        tanggal_selesai=date.today() - timedelta(days=2),
        total_harga=600000.0,
        status=RentalStatus.selesai,
    )
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)

    return {
        "user": user,
        "admin_user": admin_user,
        "admin": admin,
        "item": item,
        "rental": rental,
        "user_headers": _login(client, "penyewa1@test.com"),
        "admin_headers": _login(client, "tokoA@test.com"),
    }


# ============================================================
# CREATE REVIEW
# ============================================================

def test_create_review_success(client, world):
    res = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "Sangat memuaskan!"},
        headers=world["user_headers"],
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["rating"] == 5
    assert body["komentar"] == "Sangat memuaskan!"
    assert body["item_id"] == world["item"].id
    assert body["admin_id"] == world["admin"].id
    assert body["user_nama"] == "Penyewa Satu"


def test_create_review_requires_auth(client, world):
    res = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "x"},
    )
    assert res.status_code == 401


def test_create_review_only_for_completed_rental(client, world, db_session):
    # Ubah status rental jadi pending
    rental = db_session.query(Rental).filter(Rental.id == world["rental"].id).first()
    rental.status = RentalStatus.pending
    db_session.commit()

    res = client.post(
        f"/rentals/{rental.id}/review",
        json={"rating": 5, "komentar": "x"},
        headers=world["user_headers"],
    )
    assert res.status_code == 400
    assert "selesai" in res.json()["detail"].lower()


def test_create_review_only_owner(client, world, db_session):
    # User lain coba review rental orang lain
    other = _make_user(db_session, "lain@test.com", "Orang Lain")
    h = _login(client, "lain@test.com")
    res = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 4, "komentar": "Bukan milikku"},
        headers=h,
    )
    assert res.status_code == 403


def test_create_review_no_double(client, world):
    # Pertama: sukses
    r1 = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "ok"},
        headers=world["user_headers"],
    )
    assert r1.status_code == 201
    # Kedua: blok
    r2 = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 4, "komentar": "lagi"},
        headers=world["user_headers"],
    )
    assert r2.status_code == 400
    assert "sudah" in r2.json()["detail"].lower()


def test_create_review_validates_rating_range(client, world):
    res = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 6, "komentar": "x"},
        headers=world["user_headers"],
    )
    assert res.status_code == 422


# ============================================================
# READ REVIEWS
# ============================================================

def test_item_reviews_empty(client, world):
    res = client.get(f"/items/{world['item'].id}/reviews")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["summary"]["average"] == 0.0
    assert body["reviews"] == []


def test_item_reviews_summary_after_create(client, world):
    client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 4, "komentar": "Bagus"},
        headers=world["user_headers"],
    )
    res = client.get(f"/items/{world['item'].id}/reviews")
    body = res.json()
    assert body["total"] == 1
    assert body["summary"]["average"] == 4.0
    assert body["summary"]["distribution"]["4"] == 1
    assert body["reviews"][0]["rating"] == 4


def test_get_rental_review_404_if_none(client, world):
    res = client.get(
        f"/rentals/{world['rental'].id}/review",
        headers=world["user_headers"],
    )
    assert res.status_code == 404


def test_get_rental_review_after_create(client, world):
    client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "Mantap"},
        headers=world["user_headers"],
    )
    res = client.get(
        f"/rentals/{world['rental'].id}/review",
        headers=world["user_headers"],
    )
    assert res.status_code == 200
    assert res.json()["rating"] == 5


# ============================================================
# UPDATE / DELETE REVIEW
# ============================================================

def test_update_own_review(client, world):
    cr = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 3, "komentar": "biasa"},
        headers=world["user_headers"],
    )
    rid = cr.json()["id"]

    res = client.put(
        f"/reviews/{rid}",
        json={"rating": 4, "komentar": "Lebih baik dari yang dikira"},
        headers=world["user_headers"],
    )
    assert res.status_code == 200, res.text
    assert res.json()["rating"] == 4


def test_other_user_cannot_update_review(client, world, db_session):
    cr = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 3, "komentar": "x"},
        headers=world["user_headers"],
    )
    rid = cr.json()["id"]
    _make_user(db_session, "x@test.com", "X")
    h = _login(client, "x@test.com")
    res = client.put(f"/reviews/{rid}", json={"rating": 1}, headers=h)
    assert res.status_code == 403


def test_delete_own_review(client, world):
    cr = client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "x"},
        headers=world["user_headers"],
    )
    rid = cr.json()["id"]
    res = client.delete(f"/reviews/{rid}", headers=world["user_headers"])
    assert res.status_code == 204
    # Sudah benar-benar terhapus
    res2 = client.get(f"/items/{world['item'].id}/reviews")
    assert res2.json()["total"] == 0


# ============================================================
# SHOP PROFILE
# ============================================================

def test_shop_profile_empty_rating(client, world):
    res = client.get(f"/admins/{world['admin'].id}/shop")
    assert res.status_code == 200
    body = res.json()
    assert body["nama_usaha"] == "Toko Alpha"
    assert body["total_items"] == 1
    assert body["rating"]["total"] == 0


def test_shop_profile_with_review(client, world):
    client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 5, "komentar": "ok"},
        headers=world["user_headers"],
    )
    res = client.get(f"/admins/{world['admin'].id}/shop")
    body = res.json()
    assert body["rating"]["total"] == 1
    assert body["rating"]["average"] == 5.0


def test_shop_items_endpoint(client, world):
    res = client.get(f"/admins/{world['admin'].id}/items")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["nama"] == "Kamera Sony A7"


def test_shop_reviews_endpoint(client, world):
    client.post(
        f"/rentals/{world['rental'].id}/review",
        json={"rating": 4, "komentar": "ok"},
        headers=world["user_headers"],
    )
    res = client.get(f"/admins/{world['admin'].id}/reviews")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["reviews"][0]["item_nama"] == "Kamera Sony A7"


def test_shop_404_unknown_admin(client):
    res = client.get("/admins/99999/shop")
    assert res.status_code == 404
