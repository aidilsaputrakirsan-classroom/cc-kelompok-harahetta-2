# 🐳 Perbandingan Ukuran Docker Base Image — Sewain Backend

> **Konteks:** Pemilihan base image Python yang tepat sangat mempengaruhi ukuran image Docker,  
> keamanan, dan kecepatan pull/push ke registry.

---

## 📊 Hasil Perbandingan

| Base Image | Ukuran Image | Keterangan |
|------------|-------------|------------|
| `python:3.12` | ~1.02 GB | Full Debian — semua tools tersedia |
| `python:3.12-slim` | ~130 MB | Debian minimal — pilihan seimbang ✅ |
| `python:3.12-alpine` | ~65 MB | Alpine Linux — paling kecil, tapi berisiko |

> ⚠️ Ukuran di atas adalah ukuran **base image** sebelum install dependencies.  
> Setelah `pip install -r requirements.txt`, ukuran final image Sewain dengan `slim` ≈ **~190 MB**.

---

## 🔍 Detail Perbandingan

### `python:3.12` (Full Debian)
- **Ukuran:** ~1.02 GB
- **OS:** Debian Bookworm (full)
- ✅ Semua library C tersedia (gcc, build-essential, etc.)
- ✅ Tidak ada masalah kompilasi package
- ❌ Sangat besar — lambat di-pull, boros storage
- ❌ Tidak cocok untuk production
- **Use case:** Development lokal sementara

---

### `python:3.12-slim` (Debian Minimal) ← **DIPAKAI DI SEWAIN**
- **Ukuran:** ~130 MB
- **OS:** Debian minimal (hanya runtime essentials)
- ✅ Jauh lebih kecil dari full image
- ✅ Masih bisa install package via `apt-get`
- ✅ Kompatibel dengan `psycopg2-binary` dan semua deps Sewain
- ✅ Aman dan stabil untuk production
- ❌ Lebih besar dari Alpine
- **Use case:** ✅ **Production backend FastAPI** — pilihan terbaik untuk Sewain

---

### `python:3.12-alpine` (Alpine Linux)
- **Ukuran:** ~65 MB
- **OS:** Alpine Linux (musl libc)
- ✅ Paling kecil dari ketiganya
- ✅ Security-focused (attack surface minimal)
- ❌ `psycopg2-binary` **tidak kompatibel** dengan musl libc Alpine
- ❌ Harus pakai `psycopg2` (build from source) → butuh `gcc`, `musl-dev`, dll.
- ❌ Build time jauh lebih lama
- ❌ Banyak edge case saat install Python package dengan C extension
- **Use case:** Hanya untuk app Python murni tanpa C extension

---

## 🏆 Kesimpulan

**Pilihan untuk Sewain: `python:3.12-slim`** ✅

```
Base image dipilih: python:3.12-slim
Alasan:
  1. Ukuran optimal (~130MB base, ~190MB final)
  2. Kompatibel penuh dengan psycopg2-binary (PostgreSQL driver)
  3. Bisa install curl via apt-get untuk HEALTHCHECK
  4. Stabil dan teruji untuk production FastAPI apps
  5. Layer caching efisien (requirements.txt di-copy dulu)
```

---

## 📑 Cara Melihat Ukuran Image Sendiri

```bash
# Lihat semua image lokal beserta ukurannya
docker images

# Filter spesifik image Sewain
docker images | grep sewain

# Inspect detail image
docker inspect sewain-backend:v1 --format='{{.Size}}' | awk '{printf "%.2f MB\n", $1/1024/1024}'
```

---

