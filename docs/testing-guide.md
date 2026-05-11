# Panduan Pengujian Proyek (Testing Guide)

Dokumen ini dibuat sebagai panduan bagi anggota tim maupun pembaca lain untuk memahami proses pengujian (*testing*) dan alur *Continuous Integration* (CI) pada proyek ini. Tujuannya adalah memastikan setiap kode yang masuk ke branch `main` telah diperiksa dan berjalan dengan baik.

---

# 1. Tools yang Digunakan

## Backend

Backend menggunakan:

- `pytest` → menjalankan testing Python
- `SQLite in-memory` → database sementara untuk testing

## Frontend

Frontend menggunakan:

- `Vitest` → test runner untuk React/Vite
- `React Testing Library` → testing komponen React
- `jsdom` → simulasi browser saat testing

---

# 2. Setup Awal

Sebelum menjalankan testing, pastikan perangkat sudah memiliki:

- Python 3.9+
- Node.js 18+
- npm
- Git

Docker bersifat opsional dan hanya digunakan jika ingin menjalankan testing menggunakan container.

---

# 3. Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Buat virtual environment:

## Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

## Mac/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 4. Setup Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

# 5. Menjalankan Testing Backend

Masuk ke folder backend:

```bash
cd backend
```

Aktifkan virtual environment:

## Windows

```bash
.venv\Scripts\activate
```

## Mac/Linux

```bash
source .venv/bin/activate
```

Jalankan seluruh test:

```bash
pytest -v
```

Menjalankan satu file test:

```bash
pytest tests/test_items.py -v
```

Menjalankan satu test tertentu:

```bash
pytest tests/test_items.py::test_create_item -v
```

---

# 6. Menjalankan Testing Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Jalankan testing:

```bash
npm test
```

Menjalankan testing dengan mode watch:

```bash
npx vitest --watch
```

Menampilkan coverage report:

```bash
npm run test:coverage
```

---

# 7. Contoh Test Sederhana

## Backend (Pytest)

```python
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
```

## Frontend (Vitest)

```javascript
import { render, screen } from '@testing-library/react'
import Header from './Header'

test('menampilkan judul aplikasi', () => {
  render(<Header />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
```

---

# 8. Continuous Integration (CI)

Alur CI berada pada file:

```bash
.github/workflows/ci.yml
```

Pipeline akan berjalan otomatis setiap kali terdapat:

- `push`
- `pull request`

## Urutan Proses CI

1. Setup environment 
2. Install dependencies
3. Linting
4. Menjalankan testing backend dan frontend
5. Docker build (Membangun image Docker hanya jika semua test di atas lulus (PASS))

---

# 9. Cara Mengecek Error di GitHub Actions

1. Buka repository GitHub
2. Pilih tab **Actions**
3. Klik workflow yang gagal
4. Pilih job yang mengalami error
5. Lihat log terminal pada bagian bawah

Perhatikan pesan error seperti:

- `AssertionError`
- `ModuleNotFoundError`
- `SyntaxError`
- `Traceback`

---

# 10. Troubleshooting

| Error | Penyebab Umum | Solusi |
|---|---|---|
| `ModuleNotFoundError` | Dependency belum terinstall | Jalankan `pip install -r requirements.txt` |
| `AssertionError: 400 != 201` | Request API tidak sesuai | Periksa payload dan validasi data |
| `Port 8000 already in use` | Port masih digunakan proses lain | Hentikan proses sebelumnya |
| `Cannot find element` | Selector frontend tidak ditemukan | Periksa komponen dan isi DOM |
| `CI failing` | Ada test atau build yang gagal | Periksa log GitHub Actions |

---

# 11. Panduan Membuat Test Baru

## Backend

Buat file test di:

```text
backend/tests/test_[nama_fitur].py
```

Contoh:

```text
backend/tests/test_items.py
```

## Frontend

Buat file test di:

```text
frontend/src/components/[Komponen].test.jsx
```

Contoh:

```text
frontend/src/components/Header.test.jsx
```

---

# 12. Checklist Sebelum Merge Pull Request

Pastikan seluruh poin berikut sudah terpenuhi:

- [ ] Testing backend berhasil dijalankan
- [ ] Testing frontend berhasil dijalankan
- [ ] Tidak ada error pada GitHub Actions