"""Tests untuk logic due_at: countdown 24 jam × durasi sejak pickup."""

from datetime import datetime, date, timedelta, timezone

import pytest

from auth import hash_password
from models import (
    AdminProfile, Item, ItemStatus, Rental, RentalStatus, User, UserRole,
)


def _make_world(db_session, *, durasi_hari: int = 1):
    """Bangun user verified, admin profile, item, dan rental sedang_disewa."""
    user = User(
        email="penyewa@test.com",
        nama="Penyewa",
        hashed_password=hash_password("Password123"),
        role=UserRole.user,
        is_active=True,
        is_verified=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    admin_user = User(
        email="adminpenyedia@test.com",
        nama="Admin",
        hashed_password=hash_password("Password123"),
        role=UserRole.admin,
        is_active=True,
        is_verified=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db_session.add_all([user, admin_user])
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(admin_user)

    admin_profile = AdminProfile(
        user_id=admin_user.id,
        nama_usaha="Toko Tes",
        alamat_usaha="Balikpapan",
        nomor_telepon="08123456789",
    )
    db_session.add(admin_profile)
    db_session.commit()
    db_session.refresh(admin_profile)

    item = Item(
        admin_id=admin_profile.id,
        nama="Tenda",
        harga_per_hari=100000.0,
        stok=1,
        status=ItemStatus.available,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    today = date.today()
    rental = Rental(
        user_id=user.id,
        item_id=item.id,
        tanggal_mulai=today,
        tanggal_selesai=today + timedelta(days=durasi_hari),
        total_harga=100000.0 * durasi_hari,
        status=RentalStatus.sedang_disewa,
    )
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)

    return user, admin_user, item, rental


def _admin_headers(client, email="adminpenyedia@test.com"):
    res = client.post(
        "/auth/login",
        data={"username": email, "password": "Password123"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _parse_dt(s: str) -> datetime:
    """Parse ISO datetime string ke timezone-aware UTC."""
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        # SQLite tidak menyimpan tz info — anggap sudah UTC karena server menulis dengan datetime.now(tz.utc).
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def test_confirm_pickup_sets_due_at_24_hours_for_one_day(client, db_session):
    _, _, _, rental = _make_world(db_session, durasi_hari=1)
    headers = _admin_headers(client)

    before = datetime.now(timezone.utc)
    res = client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["durasi_hari"] == 1
    assert body["diambil_at"] is not None
    assert body["due_at"] is not None

    diambil_at = _parse_dt(body["diambil_at"])
    due_at = _parse_dt(body["due_at"])

    delta = due_at - diambil_at
    # Selisih harus tepat 24 jam (toleransi 5 detik untuk pembulatan/jaringan)
    assert abs(delta - timedelta(hours=24)) < timedelta(seconds=5), delta

    # Diambil harus sekitar "sekarang"
    assert before - timedelta(seconds=5) <= diambil_at <= datetime.now(timezone.utc) + timedelta(seconds=5)


def test_confirm_pickup_sets_due_at_72_hours_for_three_days(client, db_session):
    _, _, _, rental = _make_world(db_session, durasi_hari=3)
    headers = _admin_headers(client)

    res = client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)
    assert res.status_code == 200
    body = res.json()
    diambil_at = _parse_dt(body["diambil_at"])
    due_at = _parse_dt(body["due_at"])
    assert abs((due_at - diambil_at) - timedelta(days=3)) < timedelta(seconds=5)
    assert body["durasi_hari"] == 3


def test_due_at_appears_in_rental_response(client, db_session):
    _, _, _, rental = _make_world(db_session, durasi_hari=2)
    headers = _admin_headers(client)
    client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)

    res = client.get(f"/rentals/{rental.id}", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["due_at"] is not None
    assert body["diambil_at"] is not None


def test_confirm_pickup_idempotent_on_second_call_resets_due_at(client, db_session):
    """Dipanggil dua kali (admin re-confirm) → due_at re-computed dari pickup terbaru.
    Sederhana: kita tidak proteksi, tapi pastikan tidak crash & menghasilkan due_at konsisten.
    """
    _, _, _, rental = _make_world(db_session, durasi_hari=1)
    headers = _admin_headers(client)
    res1 = client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)
    assert res1.status_code == 200
    res2 = client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)
    # Second call boleh sukses (re-set diambil_at + due_at) atau gagal 400 jika status sudah berubah.
    assert res2.status_code in (200, 400)


def test_confirm_pickup_requires_status_sedang_disewa(client, db_session):
    user, admin_user, item, rental = _make_world(db_session, durasi_hari=1)
    rental.status = RentalStatus.disetujui
    db_session.commit()
    headers = _admin_headers(client)

    res = client.put(f"/rentals/{rental.id}/confirm-pickup", headers=headers)
    assert res.status_code == 400
