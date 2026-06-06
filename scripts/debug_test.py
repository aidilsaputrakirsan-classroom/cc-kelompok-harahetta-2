import httpx
import time
import sys
from sqlalchemy import create_engine, text

gw = 'http://127.0.0.1:80'
ts = int(time.time())
admin_email = f'debug_admin_{ts}@example.com'

# Register admin
r = httpx.post(f'{gw}/auth/register', json={'email': admin_email, 'nama': 'Debug Admin', 'password': 'Password123', 'role': 'admin'})
print('register:', r.status_code, r.json())
admin_id = r.json().get('id')

# Set verified in db
engine = create_engine('postgresql://postgres:postgres@localhost:5433/auth_db')
with engine.begin() as conn:
    conn.execute(text("UPDATE users SET role = 'admin', email_verified_at = NOW(), is_verified = TRUE WHERE id = :id"), {'id': admin_id})
print('DB updated, admin_id=', admin_id)

# Login
r = httpx.post(f'{gw}/auth/login', data={'username': admin_email, 'password': 'Password123'})
print('login:', r.status_code)
token = r.json().get('access_token')
print('token:', token[:30] if token else None)

# Create admin profile
headers = {'Authorization': f'Bearer {token}'}
r = httpx.post(f'{gw}/admin/profile', headers=headers, json={
    'nama_usaha': 'Debug Rental',
    'alamat_usaha': 'Jalan Test, Jakarta',
    'nomor_telepon': '08123456789',
    'latitude': -6.123,
    'longitude': 106.123
})
print('admin/profile POST:', r.status_code, r.json())

# Test the internal endpoint used by item-service
if token and admin_id:
    r2 = httpx.get(f'{gw}/users/{admin_id}/admin-profile', headers=headers)
    print('GET /users/{id}/admin-profile:', r2.status_code, r2.text[:300])

# Now try creating an item (use first category if any)
r3 = httpx.get(f'{gw}/categories')
cats = r3.json()
print('categories:', cats)
cat_id = cats[0]['id'] if cats else 1

r = httpx.post(f'{gw}/items', headers=headers, json={
    'category_id': cat_id,
    'nama': 'Test Camera',
    'deskripsi': 'Test Description',
    'harga_per_hari': 150000.0,
    'stok': 5,
    'foto_url': 'http://example.com/camera.jpg'
})
print('create item:', r.status_code, r.text[:500])
