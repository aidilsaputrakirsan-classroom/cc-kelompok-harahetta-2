"""Test CRUD item endpoints — disesuaikan dengan arsitektur Sewain API."""


def test_get_items_public(client):
    """Test mengambil daftar items tanpa login → 200 (endpoint publik)."""
    response = client.get("/items")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data


def test_get_item_not_found(client, auth_headers):
    """Test mengambil item yang tidak ada → 404."""
    response = client.get("/items/9999")
    assert response.status_code == 404


def test_create_item_unauthorized(client):
    """Test membuat item tanpa login → 401."""
    response = client.post("/items", json={
        "nama": "Laptop",
        "harga_per_hari": 150000,
        "stok": 1
    })
    assert response.status_code == 401


def test_create_item_user_forbidden(client, auth_headers):
    """Test user biasa tidak bisa tambah item → 403 (hanya admin yang bisa)."""
    response = client.post("/items", json={
        "nama": "Laptop",
        "harga_per_hari": 150000,
        "stok": 1
    }, headers=auth_headers)
    # User biasa (role: user) tidak punya akses, hanya admin/super_admin
    assert response.status_code == 403


def test_search_items_public(client):
    """Test search item tanpa login → 200."""
    response = client.get("/items?search=laptop")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data


def test_list_items_with_pagination(client):
    """Test pagination pada list items."""
    response = client.get("/items?skip=0&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert isinstance(data["items"], list)
