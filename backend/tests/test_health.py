"""
test_health.py — Test endpoint publik dan health check Sewain API
Kelompok Harahetta-2 | Lead Backend: Djaky Abbyyu Fauzan Timumum
"""


# ─────────────────────────────────────────────
# TEST 1: GET / — root info endpoint
# ─────────────────────────────────────────────

def test_root_returns_200(client):
    """Root endpoint harus mengembalikan HTTP 200."""
    resp = client.get("/")
    assert resp.status_code == 200


def test_root_contains_app_name(client):
    """Root endpoint harus menyertakan nama aplikasi 'Sewain'."""
    resp = client.get("/")
    data = resp.json()
    assert data["app"] == "Sewain"


def test_root_contains_status_running(client):
    """Root endpoint harus menyertakan status 'running'."""
    resp = client.get("/")
    data = resp.json()
    assert data["status"] == "running"


# ─────────────────────────────────────────────
# TEST 2: GET /health — health check
# ─────────────────────────────────────────────

def test_health_check_returns_200(client):
    """Health check endpoint harus mengembalikan HTTP 200."""
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_check_status_healthy(client):
    """Health check harus melaporkan status 'healthy'."""
    resp = client.get("/health")
    data = resp.json()
    assert data["status"] == "healthy"


def test_health_check_database_connected(client):
    """Health check harus menunjukkan database 'connected'."""
    resp = client.get("/health")
    data = resp.json()
    assert data["database"] == "connected"


# ─────────────────────────────────────────────
# TEST 3: GET /team — informasi tim
# ─────────────────────────────────────────────

def test_team_info_returns_200(client):
    """Endpoint /team harus mengembalikan HTTP 200."""
    resp = client.get("/team")
    assert resp.status_code == 200


def test_team_info_has_members(client):
    """Endpoint /team harus menyertakan daftar anggota tim."""
    resp = client.get("/team")
    data = resp.json()
    assert "members" in data
    assert len(data["members"]) > 0


# ─────────────────────────────────────────────
# TEST 4: GET /categories — publik, tanpa login
# ─────────────────────────────────────────────

def test_categories_list_public(client):
    """Endpoint /categories harus bisa diakses tanpa login (HTTP 200)."""
    resp = client.get("/categories")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
