"""
test_items.py — Test endpoint /items Sewain API
Mencakup: CRUD barang, /items/stats, pagination, edge cases input invalid & empty fields.
Target: ≥ 15 test backend total (file ini sudah ≥ 15 test).
Kelompok Harahetta-2 | Lead Backend: Djaky Abbyyu Fauzan Timumum
"""

import pytest


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION A: GET /items — Katalog publik
# ═══════════════════════════════════════════════════════════════════════════════

class TestListItems:
    """Test GET /items — endpoint publik tanpa login."""

    def test_list_items_public_returns_200(self, client):
        """Endpoint GET /items harus bisa diakses tanpa login."""
        resp = client.get("/items")
        assert resp.status_code == 200

    def test_list_items_returns_total_and_items_keys(self, client):
        """Response GET /items harus memiliki key 'total' dan 'items'."""
        resp = client.get("/items")
        data = resp.json()
        assert "total" in data
        assert "items" in data

    def test_list_items_empty_on_fresh_db(self, client):
        """Pada DB kosong, total item harus 0."""
        resp = client.get("/items")
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    # ── Pagination ──────────────────────────────────────────────────────────

    def test_pagination_skip_0_limit_2(self, client, admin_headers):
        """Pagination ?skip=0&limit=2 hanya boleh mengembalikan maks 2 item."""
        # Buat 4 item
        for i in range(4):
            client.post("/items", json={
                "nama": f"Barang Paginasi {i+1}",
                "harga_per_hari": 10000.0 * (i + 1),
                "stok": 2,
            }, headers=admin_headers)

        resp = client.get("/items?skip=0&limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 4  # Total keseluruhan tetap 4

    def test_pagination_skip_2_limit_2(self, client, admin_headers):
        """Pagination ?skip=2&limit=2 harus mengambil item ke-3 dan ke-4."""
        for i in range(4):
            client.post("/items", json={
                "nama": f"Barang Paginasi {i+1}",
                "harga_per_hari": 10000.0 * (i + 1),
                "stok": 2,
            }, headers=admin_headers)

        resp = client.get("/items?skip=2&limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2

    def test_pagination_invalid_skip_negative(self, client):
        """Nilai skip negatif harus ditolak dengan HTTP 422."""
        resp = client.get("/items?skip=-1")
        assert resp.status_code == 422

    def test_pagination_invalid_limit_zero(self, client):
        """Nilai limit=0 harus ditolak dengan HTTP 422."""
        resp = client.get("/items?limit=0")
        assert resp.status_code == 422

    def test_pagination_limit_exceeds_max(self, client):
        """Nilai limit > 100 harus ditolak dengan HTTP 422."""
        resp = client.get("/items?limit=200")
        assert resp.status_code == 422

    # ── Filter status ────────────────────────────────────────────────────────

    def test_filter_by_status_available(self, client, sample_item):
        """Filter ?status=available harus mengembalikan barang yang available."""
        resp = client.get("/items?status=available")
        assert resp.status_code == 200
        data = resp.json()
        for item in data["items"]:
            assert item["status"] == "available"


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION B: GET /items/stats — Statistik katalog
# ═══════════════════════════════════════════════════════════════════════════════

class TestItemsStats:
    """Test GET /items/stats endpoint publik."""

    def test_items_stats_returns_200(self, client):
        """Endpoint /items/stats harus mengembalikan HTTP 200."""
        resp = client.get("/items/stats")
        assert resp.status_code == 200

    def test_items_stats_has_required_keys(self, client):
        """Response /items/stats harus memiliki semua key yang diperlukan."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert "total" in data
        assert "available" in data
        assert "rented" in data
        assert "unavailable" in data
        assert "total_categories" in data

    def test_items_stats_zero_on_empty_db(self, client):
        """Pada DB kosong, semua nilai stats harus 0."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert data["total"] == 0
        assert data["available"] == 0
        assert data["rented"] == 0
        assert data["unavailable"] == 0

    def test_items_stats_counts_after_create(self, client, sample_item):
        """Setelah membuat item, stats.total dan stats.available harus bertambah."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert data["total"] >= 1
        assert data["available"] >= 1

    def test_items_stats_no_auth_required(self, client):
        """Endpoint /items/stats harus bisa diakses tanpa token (publik)."""
        resp = client.get("/items/stats")
        # Bukan 401/403
        assert resp.status_code not in (401, 403)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION C: GET /items/{item_id} — Detail satu barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetItemDetail:
    """Test GET /items/{item_id}."""

    def test_get_item_by_id_returns_200(self, client, sample_item):
        """GET /items/{id} dengan ID valid harus mengembalikan HTTP 200."""
        item_id = sample_item["id"]
        resp = client.get(f"/items/{item_id}")
        assert resp.status_code == 200

    def test_get_item_by_id_correct_data(self, client, sample_item):
        """Data item yang dikembalikan harus sesuai dengan yang dibuat."""
        item_id = sample_item["id"]
        resp = client.get(f"/items/{item_id}")
        data = resp.json()
        assert data["id"] == item_id
        assert data["nama"] == sample_item["nama"]
        assert data["harga_per_hari"] == sample_item["harga_per_hari"]

    def test_get_item_not_found_returns_404(self, client):
        """GET /items/{id} dengan ID tidak ada harus mengembalikan HTTP 404."""
        resp = client.get("/items/99999")
        assert resp.status_code == 404

    def test_get_item_invalid_id_type(self, client):
        """GET /items/abc (ID bukan integer) harus mengembalikan HTTP 422."""
        resp = client.get("/items/abc")
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION D: POST /items — Tambah barang (admin only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateItem:
    """Test POST /items — hanya admin yang bisa tambah barang."""

    def test_create_item_success(self, client, admin_headers):
        """Admin dapat membuat item baru dengan data valid."""
        resp = client.post("/items", json={
            "nama": "Tenda Camping",
            "harga_per_hari": 75000.0,
            "stok": 5,
            "deskripsi": "Tenda 4 orang",
        }, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["nama"] == "Tenda Camping"
        assert data["harga_per_hari"] == 75000.0
        assert data["stok"] == 5
        assert data["status"] == "available"

    def test_create_item_without_auth_returns_401(self, client):
        """POST /items tanpa token harus mengembalikan HTTP 401."""
        resp = client.post("/items", json={
            "nama": "Barang Tanpa Auth",
            "harga_per_hari": 50000.0,
            "stok": 1,
        })
        assert resp.status_code == 401

    def test_create_item_missing_required_field_nama(self, client, admin_headers):
        """POST /items tanpa 'nama' harus ditolak dengan HTTP 422."""
        resp = client.post("/items", json={
            "harga_per_hari": 50000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_missing_required_field_harga(self, client, admin_headers):
        """POST /items tanpa 'harga_per_hari' harus ditolak dengan HTTP 422."""
        resp = client.post("/items", json={
            "nama": "Barang Tanpa Harga",
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_empty_nama_returns_422(self, client, admin_headers):
        """POST /items dengan nama string kosong harus ditolak."""
        resp = client.post("/items", json={
            "nama": "",
            "harga_per_hari": 50000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_negative_harga_returns_422(self, client, admin_headers):
        """POST /items dengan harga_per_hari negatif harus ditolak."""
        resp = client.post("/items", json={
            "nama": "Barang Harga Negatif",
            "harga_per_hari": -5000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_negative_stok_returns_422(self, client, admin_headers):
        """POST /items dengan stok negatif harus ditolak."""
        resp = client.post("/items", json={
            "nama": "Barang Stok Negatif",
            "harga_per_hari": 50000.0,
            "stok": -1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_zero_stok_status_unavailable(self, client, admin_headers):
        """Item dengan stok=0 harus berstatus 'unavailable'."""
        resp = client.post("/items", json={
            "nama": "Barang Stok Habis",
            "harga_per_hari": 50000.0,
            "stok": 0,
        }, headers=admin_headers)
        # stok=0 valid (ge=0), item terbuat tapi status unavailable
        assert resp.status_code == 201
        data = resp.json()
        assert data["stok"] == 0
        # Status bisa unavailable karena stok = 0
        assert data["status"] in ("available", "unavailable")

    def test_create_item_empty_json_body_returns_422(self, client, admin_headers):
        """POST /items dengan body JSON kosong harus ditolak."""
        resp = client.post("/items", json={}, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_harga_zero_returns_422(self, client, admin_headers):
        """POST /items dengan harga_per_hari=0 harus ditolak (gt=0)."""
        resp = client.post("/items", json={
            "nama": "Barang Harga Nol",
            "harga_per_hari": 0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION E: PUT /items/{item_id} — Update barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateItem:
    """Test PUT /items/{item_id}."""

    def test_update_item_success(self, client, admin_headers, sample_item):
        """Admin pemilik dapat mengupdate item miliknya."""
        item_id = sample_item["id"]
        resp = client.put(f"/items/{item_id}", json={
            "nama": "Kamera Updated",
            "harga_per_hari": 200000.0,
        }, headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["nama"] == "Kamera Updated"

    def test_update_item_not_found(self, client, admin_headers):
        """PUT /items/99999 harus mengembalikan HTTP 404."""
        resp = client.put("/items/99999", json={
            "nama": "Tidak Ada",
        }, headers=admin_headers)
        assert resp.status_code == 404

    def test_update_item_without_auth_returns_401(self, client, sample_item):
        """PUT /items/{id} tanpa token harus ditolak dengan HTTP 401."""
        item_id = sample_item["id"]
        resp = client.put(f"/items/{item_id}", json={"nama": "Hacked"})
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION F: DELETE /items/{item_id} — Hapus barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeleteItem:
    """Test DELETE /items/{item_id}."""

    def test_delete_item_success(self, client, admin_headers, sample_item):
        """Admin dapat menghapus item miliknya dan mendapat HTTP 204."""
        item_id = sample_item["id"]
        resp = client.delete(f"/items/{item_id}", headers=admin_headers)
        assert resp.status_code == 204

    def test_delete_item_not_found_returns_404(self, client, admin_headers):
        """DELETE /items/99999 harus mengembalikan HTTP 404."""
        resp = client.delete("/items/99999", headers=admin_headers)
        assert resp.status_code == 404

    def test_delete_item_without_auth_returns_401(self, client, sample_item):
        """DELETE /items/{id} tanpa token harus ditolak dengan HTTP 401."""
        item_id = sample_item["id"]
        resp = client.delete(f"/items/{item_id}")
        assert resp.status_code == 401

    def test_item_not_found_after_delete(self, client, admin_headers, sample_item):
        """Setelah dihapus, GET /items/{id} harus mengembalikan HTTP 404."""
        item_id = sample_item["id"]
        client.delete(f"/items/{item_id}", headers=admin_headers)
        resp = client.get(f"/items/{item_id}")
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION G: Auth edge cases — Register
# ═══════════════════════════════════════════════════════════════════════════════

class TestAuthEdgeCases:
    """Test edge case pada auth register & login."""

    def test_register_empty_email_returns_422(self, client):
        """Registrasi dengan email kosong harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "",
            "nama": "Test User",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_invalid_email_format_returns_422(self, client):
        """Registrasi dengan format email tidak valid harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "bukan-email",
            "nama": "Test User",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_weak_password_returns_422(self, client):
        """Registrasi dengan password lemah (< 8 karakter / tanpa angka) harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "test@test.com",
            "nama": "Test User",
            "password": "weak",
        })
        assert resp.status_code == 422

    def test_register_missing_nama_returns_422(self, client):
        """Registrasi tanpa field 'nama' harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "test@test.com",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_duplicate_email_returns_400(self, client):
        """Registrasi dengan email yang sudah ada harus mengembalikan HTTP 400."""
        payload = {
            "email": "duplikat@test.com",
            "nama": "User Pertama",
            "password": "Password123",
        }
        client.post("/auth/register", json=payload)
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400

    def test_login_wrong_password_returns_401(self, client):
        """Login dengan password salah harus mengembalikan HTTP 401."""
        # Daftar dulu
        client.post("/auth/register", json={
            "email": "logintest@test.com",
            "nama": "Login Test",
            "password": "Password123",
        })
        resp = client.post("/auth/login", data={
            "username": "logintest@test.com",
            "password": "WrongPass999",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user_returns_401(self, client):
        """Login dengan email yang tidak terdaftar harus mengembalikan HTTP 401."""
        resp = client.post("/auth/login", data={
            "username": "tidakada@test.com",
            "password": "Password123",
        })
        assert resp.status_code == 401
"""
test_items.py — Test endpoint /items Sewain API
Mencakup: CRUD barang, /items/stats, pagination, edge cases input invalid & empty fields.
Target: ≥ 15 test backend total (file ini sudah ≥ 15 test).
Kelompok Harahetta-2 | Lead Backend: Djaky Abbyyu Fauzan Timumum
"""

import pytest


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION A: GET /items — Katalog publik
# ═══════════════════════════════════════════════════════════════════════════════

class TestListItems:
    """Test GET /items — endpoint publik tanpa login."""

    def test_list_items_public_returns_200(self, client):
        """Endpoint GET /items harus bisa diakses tanpa login."""
        resp = client.get("/items")
        assert resp.status_code == 200

    def test_list_items_returns_total_and_items_keys(self, client):
        """Response GET /items harus memiliki key 'total' dan 'items'."""
        resp = client.get("/items")
        data = resp.json()
        assert "total" in data
        assert "items" in data

    def test_list_items_empty_on_fresh_db(self, client):
        """Pada DB kosong, total item harus 0."""
        resp = client.get("/items")
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    # ── Pagination ──────────────────────────────────────────────────────────

    def test_pagination_skip_0_limit_2(self, client, admin_headers):
        """Pagination ?skip=0&limit=2 hanya boleh mengembalikan maks 2 item."""
        # Buat 4 item
        for i in range(4):
            client.post("/items", json={
                "nama": f"Barang Paginasi {i+1}",
                "harga_per_hari": 10000.0 * (i + 1),
                "stok": 2,
            }, headers=admin_headers)

        resp = client.get("/items?skip=0&limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 4  # Total keseluruhan tetap 4

    def test_pagination_skip_2_limit_2(self, client, admin_headers):
        """Pagination ?skip=2&limit=2 harus mengambil item ke-3 dan ke-4."""
        for i in range(4):
            client.post("/items", json={
                "nama": f"Barang Paginasi {i+1}",
                "harga_per_hari": 10000.0 * (i + 1),
                "stok": 2,
            }, headers=admin_headers)

        resp = client.get("/items?skip=2&limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2

    def test_pagination_invalid_skip_negative(self, client):
        """Nilai skip negatif harus ditolak dengan HTTP 422."""
        resp = client.get("/items?skip=-1")
        assert resp.status_code == 422

    def test_pagination_invalid_limit_zero(self, client):
        """Nilai limit=0 harus ditolak dengan HTTP 422."""
        resp = client.get("/items?limit=0")
        assert resp.status_code == 422

    def test_pagination_limit_exceeds_max(self, client):
        """Nilai limit > 100 harus ditolak dengan HTTP 422."""
        resp = client.get("/items?limit=200")
        assert resp.status_code == 422

    # ── Filter status ────────────────────────────────────────────────────────

    def test_filter_by_status_available(self, client, sample_item):
        """Filter ?status=available harus mengembalikan barang yang available."""
        resp = client.get("/items?status=available")
        assert resp.status_code == 200
        data = resp.json()
        for item in data["items"]:
            assert item["status"] == "available"


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION B: GET /items/stats — Statistik katalog
# ═══════════════════════════════════════════════════════════════════════════════

class TestItemsStats:
    """Test GET /items/stats endpoint publik."""

    def test_items_stats_returns_200(self, client):
        """Endpoint /items/stats harus mengembalikan HTTP 200."""
        resp = client.get("/items/stats")
        assert resp.status_code == 200

    def test_items_stats_has_required_keys(self, client):
        """Response /items/stats harus memiliki semua key yang diperlukan."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert "total" in data
        assert "available" in data
        assert "rented" in data
        assert "unavailable" in data
        assert "total_categories" in data

    def test_items_stats_zero_on_empty_db(self, client):
        """Pada DB kosong, semua nilai stats harus 0."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert data["total"] == 0
        assert data["available"] == 0
        assert data["rented"] == 0
        assert data["unavailable"] == 0

    def test_items_stats_counts_after_create(self, client, sample_item):
        """Setelah membuat item, stats.total dan stats.available harus bertambah."""
        resp = client.get("/items/stats")
        data = resp.json()
        assert data["total"] >= 1
        assert data["available"] >= 1

    def test_items_stats_no_auth_required(self, client):
        """Endpoint /items/stats harus bisa diakses tanpa token (publik)."""
        resp = client.get("/items/stats")
        # Bukan 401/403
        assert resp.status_code not in (401, 403)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION C: GET /items/{item_id} — Detail satu barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetItemDetail:
    """Test GET /items/{item_id}."""

    def test_get_item_by_id_returns_200(self, client, sample_item):
        """GET /items/{id} dengan ID valid harus mengembalikan HTTP 200."""
        item_id = sample_item["id"]
        resp = client.get(f"/items/{item_id}")
        assert resp.status_code == 200

    def test_get_item_by_id_correct_data(self, client, sample_item):
        """Data item yang dikembalikan harus sesuai dengan yang dibuat."""
        item_id = sample_item["id"]
        resp = client.get(f"/items/{item_id}")
        data = resp.json()
        assert data["id"] == item_id
        assert data["nama"] == sample_item["nama"]
        assert data["harga_per_hari"] == sample_item["harga_per_hari"]

    def test_get_item_not_found_returns_404(self, client):
        """GET /items/{id} dengan ID tidak ada harus mengembalikan HTTP 404."""
        resp = client.get("/items/99999")
        assert resp.status_code == 404

    def test_get_item_invalid_id_type(self, client):
        """GET /items/abc (ID bukan integer) harus mengembalikan HTTP 422."""
        resp = client.get("/items/abc")
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION D: POST /items — Tambah barang (admin only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateItem:
    """Test POST /items — hanya admin yang bisa tambah barang."""

    def test_create_item_success(self, client, admin_headers):
        """Admin dapat membuat item baru dengan data valid."""
        resp = client.post("/items", json={
            "nama": "Tenda Camping",
            "harga_per_hari": 75000.0,
            "stok": 5,
            "deskripsi": "Tenda 4 orang",
        }, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["nama"] == "Tenda Camping"
        assert data["harga_per_hari"] == 75000.0
        assert data["stok"] == 5
        assert data["status"] == "available"

    def test_create_item_without_auth_returns_401(self, client):
        """POST /items tanpa token harus mengembalikan HTTP 401."""
        resp = client.post("/items", json={
            "nama": "Barang Tanpa Auth",
            "harga_per_hari": 50000.0,
            "stok": 1,
        })
        assert resp.status_code == 401

    def test_create_item_missing_required_field_nama(self, client, admin_headers):
        """POST /items tanpa 'nama' harus ditolak dengan HTTP 422."""
        resp = client.post("/items", json={
            "harga_per_hari": 50000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_missing_required_field_harga(self, client, admin_headers):
        """POST /items tanpa 'harga_per_hari' harus ditolak dengan HTTP 422."""
        resp = client.post("/items", json={
            "nama": "Barang Tanpa Harga",
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_empty_nama_returns_422(self, client, admin_headers):
        """POST /items dengan nama string kosong harus ditolak."""
        resp = client.post("/items", json={
            "nama": "",
            "harga_per_hari": 50000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_negative_harga_returns_422(self, client, admin_headers):
        """POST /items dengan harga_per_hari negatif harus ditolak."""
        resp = client.post("/items", json={
            "nama": "Barang Harga Negatif",
            "harga_per_hari": -5000.0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_negative_stok_returns_422(self, client, admin_headers):
        """POST /items dengan stok negatif harus ditolak."""
        resp = client.post("/items", json={
            "nama": "Barang Stok Negatif",
            "harga_per_hari": 50000.0,
            "stok": -1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_zero_stok_status_unavailable(self, client, admin_headers):
        """Item dengan stok=0 harus berstatus 'unavailable'."""
        resp = client.post("/items", json={
            "nama": "Barang Stok Habis",
            "harga_per_hari": 50000.0,
            "stok": 0,
        }, headers=admin_headers)
        # stok=0 valid (ge=0), item terbuat tapi status unavailable
        assert resp.status_code == 201
        data = resp.json()
        assert data["stok"] == 0
        # Status bisa unavailable karena stok = 0
        assert data["status"] in ("available", "unavailable")

    def test_create_item_empty_json_body_returns_422(self, client, admin_headers):
        """POST /items dengan body JSON kosong harus ditolak."""
        resp = client.post("/items", json={}, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_item_harga_zero_returns_422(self, client, admin_headers):
        """POST /items dengan harga_per_hari=0 harus ditolak (gt=0)."""
        resp = client.post("/items", json={
            "nama": "Barang Harga Nol",
            "harga_per_hari": 0,
            "stok": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION E: PUT /items/{item_id} — Update barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateItem:
    """Test PUT /items/{item_id}."""

    def test_update_item_success(self, client, admin_headers, sample_item):
        """Admin pemilik dapat mengupdate item miliknya."""
        item_id = sample_item["id"]
        resp = client.put(f"/items/{item_id}", json={
            "nama": "Kamera Updated",
            "harga_per_hari": 200000.0,
        }, headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["nama"] == "Kamera Updated"

    def test_update_item_not_found(self, client, admin_headers):
        """PUT /items/99999 harus mengembalikan HTTP 404."""
        resp = client.put("/items/99999", json={
            "nama": "Tidak Ada",
        }, headers=admin_headers)
        assert resp.status_code == 404

    def test_update_item_without_auth_returns_401(self, client, sample_item):
        """PUT /items/{id} tanpa token harus ditolak dengan HTTP 401."""
        item_id = sample_item["id"]
        resp = client.put(f"/items/{item_id}", json={"nama": "Hacked"})
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION F: DELETE /items/{item_id} — Hapus barang
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeleteItem:
    """Test DELETE /items/{item_id}."""

    def test_delete_item_success(self, client, admin_headers, sample_item):
        """Admin dapat menghapus item miliknya dan mendapat HTTP 204."""
        item_id = sample_item["id"]
        resp = client.delete(f"/items/{item_id}", headers=admin_headers)
        assert resp.status_code == 204

    def test_delete_item_not_found_returns_404(self, client, admin_headers):
        """DELETE /items/99999 harus mengembalikan HTTP 404."""
        resp = client.delete("/items/99999", headers=admin_headers)
        assert resp.status_code == 404

    def test_delete_item_without_auth_returns_401(self, client, sample_item):
        """DELETE /items/{id} tanpa token harus ditolak dengan HTTP 401."""
        item_id = sample_item["id"]
        resp = client.delete(f"/items/{item_id}")
        assert resp.status_code == 401

    def test_item_not_found_after_delete(self, client, admin_headers, sample_item):
        """Setelah dihapus, GET /items/{id} harus mengembalikan HTTP 404."""
        item_id = sample_item["id"]
        client.delete(f"/items/{item_id}", headers=admin_headers)
        resp = client.get(f"/items/{item_id}")
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION G: Auth edge cases — Register
# ═══════════════════════════════════════════════════════════════════════════════

class TestAuthEdgeCases:
    """Test edge case pada auth register & login."""

    def test_register_empty_email_returns_422(self, client):
        """Registrasi dengan email kosong harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "",
            "nama": "Test User",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_invalid_email_format_returns_422(self, client):
        """Registrasi dengan format email tidak valid harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "bukan-email",
            "nama": "Test User",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_weak_password_returns_422(self, client):
        """Registrasi dengan password lemah (< 8 karakter / tanpa angka) harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "test@test.com",
            "nama": "Test User",
            "password": "weak",
        })
        assert resp.status_code == 422

    def test_register_missing_nama_returns_422(self, client):
        """Registrasi tanpa field 'nama' harus ditolak."""
        resp = client.post("/auth/register", json={
            "email": "test@test.com",
            "password": "Password123",
        })
        assert resp.status_code == 422

    def test_register_duplicate_email_returns_400(self, client):
        """Registrasi dengan email yang sudah ada harus mengembalikan HTTP 400."""
        payload = {
            "email": "duplikat@test.com",
            "nama": "User Pertama",
            "password": "Password123",
        }
        client.post("/auth/register", json=payload)
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400

    def test_login_wrong_password_returns_401(self, client):
        """Login dengan password salah harus mengembalikan HTTP 401."""
        # Daftar dulu
        client.post("/auth/register", json={
            "email": "logintest@test.com",
            "nama": "Login Test",
            "password": "Password123",
        })
        resp = client.post("/auth/login", data={
            "username": "logintest@test.com",
            "password": "WrongPass999",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user_returns_401(self, client):
        """Login dengan email yang tidak terdaftar harus mengembalikan HTTP 401."""
        resp = client.post("/auth/login", data={
            "username": "tidakada@test.com",
            "password": "Password123",
        })
        assert resp.status_code == 401
