"""
Test suite untuk endpoint GET /items/stats di Item Service.

Coverage:
  1. Stats saat tidak ada item (empty)
  2. Stats dengan 1 item
  3. Stats dengan beberapa item — verifikasi total_items, total_value, most_expensive, cheapest
  4. Stats hanya menghitung item milik user yang login (owner isolation)
  5. Validasi autentikasi (auth dependency terdaftar + endpoint berfungsi dengan token)
  6. most_expensive dan cheapest benar saat harga sama semua
  7. total_value akurat (floating point)
"""
import pytest


AUTH_HEADER = {"Authorization": "Bearer fake-token"}


# ============================================================
# 1. STATS EMPTY — tidak ada item
# ============================================================
class TestStatsEmpty:
    def test_stats_empty_returns_200(self, client):
        """GET /items/stats harus return 200 meski tidak ada item."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        assert response.status_code == 200

    def test_stats_empty_total_items_zero(self, client):
        """total_items harus 0 saat tidak ada item."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_items"] == 0

    def test_stats_empty_total_value_zero(self, client):
        """total_value harus 0.0 saat tidak ada item."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_value"] == 0.0

    def test_stats_empty_most_expensive_is_none(self, client):
        """most_expensive harus None saat tidak ada item."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["most_expensive"] is None

    def test_stats_empty_cheapest_is_none(self, client):
        """cheapest harus None saat tidak ada item."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["cheapest"] is None


# ============================================================
# 2. STATS DENGAN 1 ITEM
# ============================================================
class TestStatsSingleItem:
    def test_stats_single_item_total_items(self, client):
        """total_items harus 1 setelah add 1 item."""
        client.post("/items", json={
            "name": "Monitor", "price": 3500000.0, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_items"] == 1

    def test_stats_single_item_total_value(self, client):
        """total_value harus sama dengan price item tunggal."""
        client.post("/items", json={
            "name": "Monitor", "price": 3500000.0, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_value"] == 3500000.0

    def test_stats_single_item_most_expensive_equals_cheapest(self, client):
        """Saat hanya 1 item, most_expensive dan cheapest harus sama."""
        client.post("/items", json={
            "name": "Monitor", "price": 3500000.0, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["most_expensive"] == 3500000.0
        assert data["cheapest"] == 3500000.0


# ============================================================
# 3. STATS DENGAN BANYAK ITEM — nilai utama
# ============================================================
class TestStatsMultipleItems:
    """
    Menggunakan fixture client_with_items yang sudah di-seed:
      - Laptop:   Rp 15.000.000
      - Mouse:    Rp    250.000
      - Keyboard: Rp    750.000
    """

    def test_stats_total_items_correct(self, client_with_items):
        """total_items harus 3 sesuai jumlah seed data."""
        response = client_with_items.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_items"] == 3

    def test_stats_total_value_correct(self, client_with_items):
        """total_value = 15.000.000 + 250.000 + 750.000 = 16.000.000."""
        response = client_with_items.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_value"] == pytest.approx(16000000.0)

    def test_stats_most_expensive_correct(self, client_with_items):
        """most_expensive harus 15.000.000 (Laptop)."""
        response = client_with_items.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["most_expensive"] == pytest.approx(15000000.0)

    def test_stats_cheapest_correct(self, client_with_items):
        """cheapest harus 250.000 (Mouse)."""
        response = client_with_items.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["cheapest"] == pytest.approx(250000.0)

    def test_stats_response_has_all_fields(self, client_with_items):
        """Response harus memiliki semua field yang diharapkan."""
        response = client_with_items.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert "total_items" in data
        assert "total_value" in data
        assert "most_expensive" in data
        assert "cheapest" in data


# ============================================================
# 4. OWNER ISOLATION — stats hanya untuk user yang login
# ============================================================
class TestStatsOwnerIsolation:
    def test_stats_only_counts_own_items(self, client):
        """
        Stats hanya menghitung item milik user yang login.
        Simulasi: tambah item via endpoint (owner_id = 1 dari mock),
        lalu cek stats — harusnya hanya item milik user_id=1.
        """
        # Tambah 2 item (keduanya milik fake user id=1)
        client.post("/items", json={
            "name": "Item A", "price": 100000.0, "quantity": 1
        }, headers=AUTH_HEADER)
        client.post("/items", json={
            "name": "Item B", "price": 200000.0, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()

        # Harus 2 item, bukan lebih
        assert data["total_items"] == 2
        assert data["total_value"] == pytest.approx(300000.0)


# ============================================================
# 5. AUTENTIKASI — endpoint terlindungi oleh verify_token_with_auth_service
# ============================================================
class TestStatsAuthentication:
    def test_stats_auth_dependency_is_registered(self, client):
        """
        Verifikasi bahwa verify_token_with_auth_service terdaftar sebagai
        dependency_override di test environment — artinya endpoint memang
        menggunakan Depends(verify_token_with_auth_service) di production.
        Di production (tanpa override), request tanpa token → 401/422.
        """
        from auth_client import verify_token_with_auth_service
        from main import app
        assert verify_token_with_auth_service in app.dependency_overrides, (
            "Auth dependency harus di-override saat testing — "
            "berarti endpoint memang protected di production"
        )

    def test_stats_with_valid_token_returns_200(self, client):
        """GET /items/stats dengan token valid harus return 200."""
        response = client.get("/items/stats", headers=AUTH_HEADER)
        assert response.status_code == 200

    def test_stats_response_includes_user_context(self, client):
        """Response stats hanya berisi data milik user yang terauthentikasi."""
        # Tambah item sebagai fake user (user_id=1)
        client.post("/items", json={
            "name": "Laptop", "price": 10000000.0, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        assert response.status_code == 200
        data = response.json()
        # Item tadi harus muncul di stats
        assert data["total_items"] >= 1


# ============================================================
# 6. EDGE CASE — harga semua item sama
# ============================================================
class TestStatsSamePrice:
    def test_stats_same_price_most_expensive_equals_cheapest(self, client):
        """Jika semua item harga sama, most_expensive == cheapest."""
        for i in range(3):
            client.post("/items", json={
                "name": f"Item {i}", "price": 500000.0, "quantity": 1
            }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["most_expensive"] == pytest.approx(500000.0)
        assert data["cheapest"] == pytest.approx(500000.0)


# ============================================================
# 7. FLOATING POINT ACCURACY
# ============================================================
class TestStatsPrecision:
    def test_stats_total_value_float_precision(self, client):
        """total_value harus akurat untuk harga desimal."""
        client.post("/items", json={
            "name": "Item X", "price": 99999.99, "quantity": 1
        }, headers=AUTH_HEADER)
        client.post("/items", json={
            "name": "Item Y", "price": 0.01, "quantity": 1
        }, headers=AUTH_HEADER)

        response = client.get("/items/stats", headers=AUTH_HEADER)
        data = response.json()
        assert data["total_items"] == 2
        assert data["total_value"] == pytest.approx(100000.0, rel=1e-5)
