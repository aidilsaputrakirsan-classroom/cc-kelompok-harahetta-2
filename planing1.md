# 🐳 Audit & Planning — Docker Setup Sewain

> **Proyek:** Sewain — Platform Sewa Barang Online  
> **Mata Kuliah:** Komputasi Awan — SI ITK  
> **Tanggal Audit:** 26 April 2026  
> **Referensi:** Modul 06 (Multi-Stage Build, Volumes & Networks) dan Modul 07 (Docker Compose)

---

## 📊 Ringkasan Status

| Komponen | Status | Catatan |
|----------|--------|---------|
| Backend Dockerfile (multi-stage) | ✅ Ada | Sudah 2-stage, venv, non-root user |
| Frontend Dockerfile (multi-stage) | ✅ Ada | node:20-alpine → nginx:alpine |
| `.dockerignore` backend | ✅ Ada | Lengkap |
| `.dockerignore` frontend | ✅ Ada | Lengkap |
| `nginx.conf` (production-ready) | ✅ Ada | Gzip, security headers, SPA fallback, caching |
| `docker-compose.yml` | ✅ Ada | 3 services, depends_on, healthcheck |
| Custom Network | ✅ Ada | `sewain-network` (baru ditambahkan) |
| Named Volume | ✅ Ada | `pgdata` untuk PostgreSQL |
| Healthcheck (DB) | ✅ Ada | `pg_isready` |
| Healthcheck (Backend) | ✅ Ada | `curl /health` di Dockerfile |
| Healthcheck (Frontend) | ✅ Ada | `curl localhost:80` di Dockerfile |
| `wait-for-db.sh` | ✅ Ada | Script startup backend |
| Makefile | ✅ Ada | Backend + frontend commands |
| `.env.docker` | ✅ Ada | Environment terpisah untuk Docker |
| Docker Hub push | ✅ Ada | `alif10231056/sewain-backend:v2`, `alif10231056/sewain-frontend:v2` |
| Custom error pages (404/50x) | ✅ Ada | Di frontend Dockerfile |
| `docs/docker-architecture.md` | ✅ Ada | Arsitektur Docker |
| `docs/image-comparison.md` | ✅ Ada | Perbandingan ukuran image |
| Image size Frontend < 50 MB | ✅ Lolos | ~26-27 MB (CONTENT SIZE) |
| Image size Backend < 150 MB | ✅ Lolos | ~76 MB (CONTENT SIZE, target modul: < 150 MB) |

---

## ⚠️ Kekurangan & Gap yang Ditemukan

### 1. 🔴 `container_name` Tidak Ada di docker-compose.yml

**Status:** KURANG  
**Modul 07 menyarankan:** Setiap service punya `container_name` eksplisit (contoh modul: `cloudapp-db`, `cloudapp-backend`, `cloudapp-frontend`).

**Docker-compose kamu saat ini:** Tidak ada `container_name`, sehingga Docker secara otomatis memberi nama berdasarkan folder (misal: `cc-kelompok-harahetta-2-backend-1`).

**Dampak:** Nama container jadi panjang dan tidak rapi saat `docker ps`.

---

### 2. 🔴 Healthcheck Backend di docker-compose.yml Tidak Ada

**Status:** KURANG  
**Penjelasan:** Backend punya healthcheck di **Dockerfile**, tapi TIDAK di **docker-compose.yml**. Modul 07 menunjukkan healthcheck di compose juga:

```yaml
# Yang ada di modul 07 tapi belum ada di compose kamu:
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

> [!NOTE]
> Healthcheck di Dockerfile dan di docker-compose.yml berbeda. Yang di compose bisa **override** Dockerfile dan lebih visible untuk reviewer.

---

### 3. 🟡 Frontend `depends_on` Tanpa `condition: service_healthy`

**Status:** BISA DITINGKATKAN  
**Saat ini:**
```yaml
frontend:
  depends_on:
    - backend    # ← hanya cek "started", bukan "healthy"
```

**Idealnya (sesuai best practice modul):**
```yaml
frontend:
  depends_on:
    backend:
      condition: service_healthy   # ← tunggu backend benar-benar ready
```

---

### 4. 🟡 Volume Tidak Diberi `name` Eksplisit

**Status:** BISA DITINGKATKAN  
**Saat ini:**
```yaml
volumes:
  pgdata:
```

**Modul 07 menyarankan:**
```yaml
volumes:
  pgdata:
    name: sewain-pgdata   # ← lebih jelas di `docker volume ls`
```

---

### 5. 🟡 Network Tidak Diberi `name` Eksplisit

**Status:** SUDAH DIPERBAIKI (✅)  
Network `sewain-network` sudah punya nama, tapi belum ada `name:` field.

**Saat ini:**
```yaml
networks:
  sewain-network:
    driver: bridge
```

**Lebih baik:**
```yaml
networks:
  sewain-network:
    name: sewain-network
    driver: bridge
```

---

### 6. 🟡 Makefile Belum Punya Compose Commands

**Status:** BISA DITINGKATKAN  
**Saat ini:** Makefile hanya punya commands untuk `docker run` individual (Modul 05-06 style). Belum ada shortcut untuk `docker compose`.

**Modul 07 menyarankan tambah:**
```makefile
# Compose commands
compose-up:
	docker compose up -d

compose-down:
	docker compose down

compose-build:
	docker compose up --build -d

compose-logs:
	docker compose logs -f

compose-ps:
	docker compose ps
```

---

### 7. 🟡 `docs/uts-demo-script.md` — Perlu Review

**Status:** SUDAH ADA, tapi perlu dicek apakah isinya sesuai format modul 07.

---

## 📋 Planning Perbaikan

### Prioritas Tinggi (Langsung Kerjakan)

| # | Task | File | Estimasi |
|---|------|------|----------|
| 1 | Tambah `container_name` di semua service | `docker-compose.yml` | 2 menit |
| 2 | Tambah healthcheck backend di compose | `docker-compose.yml` | 3 menit |
| 3 | Ubah frontend `depends_on` ke `service_healthy` | `docker-compose.yml` | 2 menit |
| 4 | Tambah `name:` eksplisit di volume dan network | `docker-compose.yml` | 1 menit |

### Prioritas Sedang (Nice to Have)

| # | Task | File | Estimasi |
|---|------|------|----------|
| 5 | Tambah Compose commands di Makefile | `Makefile` | 5 menit |
| 6 | Review `docs/uts-demo-script.md` | `docs/uts-demo-script.md` | 5 menit |

---

## ✅ Yang Sudah Bagus (Tidak Perlu Diubah)

Hal-hal berikut sudah sesuai atau bahkan melebihi standar modul:

- ✅ Multi-stage build backend (2-stage, venv, non-root user `appuser`)
- ✅ Multi-stage build frontend (node:20-alpine → nginx:alpine)
- ✅ `nginx.conf` production-ready (gzip, security headers, SPA fallback, asset caching, deny hidden files)
- ✅ Custom error pages (404.html, 50x.html)
- ✅ `wait-for-db.sh` startup script
- ✅ `.dockerignore` lengkap di backend dan frontend
- ✅ Database healthcheck `pg_isready` + `depends_on: service_healthy`
- ✅ `restart: unless-stopped` di semua service
- ✅ Named volume `pgdata` untuk data persistence
- ✅ Custom network `sewain-network` (bridge)
- ✅ Environment variables terstruktur (`.env.docker`)
- ✅ Image di Docker Hub (`alif10231056/sewain-backend:v2`, `alif10231056/sewain-frontend:v2`)
- ✅ Dokumentasi lengkap (README, docker-architecture, image-comparison, setup-guide, uts-demo-script)

---

> [!IMPORTANT]
> **Kesimpulan:** Secara keseluruhan setup Docker kamu sudah **sangat lengkap** dan melebihi standar minimum modul. Kekurangan utama yang perlu diperbaiki hanya di `docker-compose.yml`: tambah `container_name`, healthcheck backend di compose, dan perbaiki `depends_on` frontend. Semua perbaikan bisa diselesaikan dalam **~10 menit**.
