# Docker Cheatsheet — Proyek SEWAIN (Kelompok Harahetta-2)

> Referensi cepat Docker commands yang sering dipakai selama pengembangan proyek SEWAIN.
> Semua contoh menggunakan nama image/container dari proyek ini.

---

## Daftar Isi

1. [Informasi Image Proyek](#informasi-image-proyek)
2. [docker build](#1-docker-build)
3. [docker run](#2-docker-run)
4. [docker ps](#3-docker-ps)
5. [docker logs](#4-docker-logs)
6. [docker exec](#5-docker-exec)
7. [docker stop](#6-docker-stop)
8. [docker rm](#7-docker-rm)
9. [docker push](#8-docker-push)
10. [docker pull](#9-docker-pull)
11. [Perintah Tambahan yang Berguna](#10-perintah-tambahan-yang-berguna)
12. [Workflow Lengkap](#workflow-lengkap)

---

## Informasi Image Proyek

| Service  | Dockerfile           | Base Image         | Port | Deskripsi                        |
|----------|----------------------|--------------------|------|----------------------------------|
| Backend  | `backend/Dockerfile` | python:3.12-slim   | 8000 | FastAPI + Uvicorn (multi-stage)  |
| Frontend | `frontend/Dockerfile`| node:20-alpine → nginx:alpine | 80 | React (Vite build) + Nginx |

---

## 1. `docker build`

Membuat Docker image dari Dockerfile.

### Sintaks

```bash
docker build -t <nama-image>:<tag> <path-ke-context>
```

### Contoh Proyek SEWAIN

**Build backend image:**

```bash
docker build -t sewain-backend:latest ./backend
```

**Build frontend image (dengan build argument untuk API URL):**

```bash
docker build -t sewain-frontend:latest --build-arg VITE_API_URL=http://localhost:8000 ./frontend
```

**Build frontend untuk production (API URL server):**

```bash
docker build -t sewain-frontend:prod --build-arg VITE_API_URL=https://api.sewain.example.com ./frontend
```

**Build tanpa cache (jika ingin rebuild dari awal):**

```bash
docker build --no-cache -t sewain-backend:latest ./backend
```

### Opsi Penting

| Flag | Fungsi | Contoh |
|------|--------|--------|
| `-t` | Memberi nama & tag pada image | `-t sewain-backend:v1.0` |
| `--build-arg` | Set build-time variable | `--build-arg VITE_API_URL=http://...` |
| `--no-cache` | Build ulang tanpa cache layer | `--no-cache` |
| `-f` | Tentukan Dockerfile tertentu | `-f Dockerfile.prod` |

---

## 2. `docker run`

Menjalankan container baru dari image.

### Sintaks

```bash
docker run [OPTIONS] <image> [COMMAND]
```

### Contoh Proyek SEWAIN

**Jalankan backend:**

```bash
docker run -d \
  --name sewain-backend \
  -p 8000:8000 \
  --env-file ./backend/.env \
  sewain-backend:latest
```

**Jalankan frontend:**

```bash
docker run -d \
  --name sewain-frontend \
  -p 3000:80 \
  sewain-frontend:latest
```

**Jalankan PostgreSQL untuk development:**

```bash
docker run -d \
  --name sewain-db \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=sewain_db \
  -v sewain-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Jalankan backend dalam mode interaktif (debugging):**

```bash
docker run -it --rm \
  --name sewain-backend-debug \
  -p 8000:8000 \
  --env-file ./backend/.env \
  sewain-backend:latest \
  bash
```

### Opsi Penting

| Flag | Fungsi | Contoh |
|------|--------|--------|
| `-d` | Jalankan di background (detached) | `-d` |
| `-it` | Mode interaktif + TTY | `-it` |
| `--rm` | Hapus container otomatis saat berhenti | `--rm` |
| `--name` | Beri nama container | `--name sewain-backend` |
| `-p` | Port mapping (host:container) | `-p 8000:8000` |
| `-e` | Set environment variable | `-e POSTGRES_DB=sewain_db` |
| `--env-file` | Load env vars dari file | `--env-file .env` |
| `-v` | Mount volume | `-v sewain-pgdata:/var/lib/postgresql/data` |
| `--network` | Hubungkan ke network | `--network sewain-net` |

---

## 3. `docker ps`

Menampilkan daftar container yang sedang berjalan.

### Sintaks

```bash
docker ps [OPTIONS]
```

### Contoh Proyek SEWAIN

**Lihat semua container yang running:**

```bash
docker ps
```

**Lihat semua container (termasuk yang berhenti):**

```bash
docker ps -a
```

**Filter container proyek SEWAIN saja:**

```bash
docker ps --filter "name=sewain"
```

**Tampilkan hanya ID container:**

```bash
docker ps -q
```

**Format output custom (ringkas):**

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Contoh Output

```
CONTAINER ID   IMAGE                    STATUS          PORTS                    NAMES
a1b2c3d4e5f6   sewain-backend:latest    Up 5 minutes    0.0.0.0:8000->8000/tcp   sewain-backend
f6e5d4c3b2a1   sewain-frontend:latest   Up 5 minutes    0.0.0.0:3000->80/tcp     sewain-frontend
1a2b3c4d5e6f   postgres:16-alpine       Up 10 minutes   0.0.0.0:5432->5432/tcp   sewain-db
```

---

## 4. `docker logs`

Melihat log output dari container.

### Sintaks

```bash
docker logs [OPTIONS] <container>
```

### Contoh Proyek SEWAIN

**Lihat log backend:**

```bash
docker logs sewain-backend
```

**Lihat log secara real-time (follow/stream):**

```bash
docker logs -f sewain-backend
```

**Lihat 50 baris log terakhir:**

```bash
docker logs --tail 50 sewain-backend
```

**Lihat log dengan timestamp:**

```bash
docker logs -t sewain-backend
```

**Lihat log sejak 5 menit terakhir:**

```bash
docker logs --since 5m sewain-backend
```

**Kombinasi: follow + tail + timestamp:**

```bash
docker logs -f --tail 100 -t sewain-backend
```

### Tips Debug

| Skenario | Command |
|----------|---------|
| Backend error 500 | `docker logs --tail 50 sewain-backend` |
| Cek apakah Nginx sudah serve frontend | `docker logs sewain-frontend` |
| Monitor DB query real-time | `docker logs -f sewain-db` |
| Cek startup error | `docker logs sewain-backend 2>&1 \| head -20` |

---

## 5. `docker exec`

Menjalankan perintah di dalam container yang sedang berjalan.

### Sintaks

```bash
docker exec [OPTIONS] <container> <command>
```

### Contoh Proyek SEWAIN

**Masuk ke shell container backend:**

```bash
docker exec -it sewain-backend bash
```

**Masuk ke shell container frontend (Alpine, pakai sh):**

```bash
docker exec -it sewain-frontend sh
```

**Cek health endpoint dari dalam container backend:**

```bash
docker exec sewain-backend curl -f http://localhost:8000/health
```

**Masuk ke PostgreSQL CLI di dalam container DB:**

```bash
docker exec -it sewain-db psql -U postgres -d sewain_db
```

**Jalankan query SQL langsung:**

```bash
docker exec sewain-db psql -U postgres -d sewain_db -c "SELECT COUNT(*) FROM users;"
```

**Cek Nginx config di container frontend:**

```bash
docker exec sewain-frontend cat /etc/nginx/conf.d/default.conf
```

**Lihat proses yang berjalan dalam container:**

```bash
docker exec sewain-backend ps aux
```

---

## 6. `docker stop`

Menghentikan container yang sedang berjalan (graceful shutdown).

### Sintaks

```bash
docker stop [OPTIONS] <container> [<container>...]
```

### Contoh Proyek SEWAIN

**Stop satu container:**

```bash
docker stop sewain-backend
```

**Stop beberapa container sekaligus:**

```bash
docker stop sewain-backend sewain-frontend sewain-db
```

**Stop dengan timeout custom (default 10 detik):**

```bash
docker stop -t 30 sewain-backend
```

**Stop semua container yang running:**

```bash
docker stop $(docker ps -q)
```

**Stop semua container proyek SEWAIN:**

```bash
docker stop $(docker ps -q --filter "name=sewain")
```

---

## 7. `docker rm`

Menghapus container (harus dalam keadaan berhenti).

### Sintaks

```bash
docker rm [OPTIONS] <container> [<container>...]
```

### Contoh Proyek SEWAIN

**Hapus satu container:**

```bash
docker rm sewain-backend
```

**Stop lalu hapus (force remove):**

```bash
docker rm -f sewain-backend
```

**Hapus semua container proyek SEWAIN:**

```bash
docker rm -f sewain-backend sewain-frontend sewain-db
```

**Hapus semua container yang sudah berhenti:**

```bash
docker container prune
```

**Hapus image yang tidak terpakai:**

```bash
docker image prune
```

**Bersihkan semua resource Docker yang tidak terpakai (images, containers, networks, cache):**

```bash
docker system prune -a
```

> **Hati-hati:** `docker system prune -a` akan menghapus SEMUA image yang tidak sedang dipakai container.

---

## 8. `docker push`

Mengupload image ke Docker registry (Docker Hub, GCR, dll).

### Sintaks

```bash
docker push <registry>/<image>:<tag>
```

### Contoh Proyek SEWAIN

**1. Login ke Docker Hub:**

```bash
docker login
```

**2. Tag image dengan nama registry:**

```bash
docker tag sewain-backend:latest username/sewain-backend:latest
docker tag sewain-frontend:latest username/sewain-frontend:latest
```

**3. Push ke Docker Hub:**

```bash
docker push username/sewain-backend:latest
docker push username/sewain-frontend:latest
```

**Push dengan version tag:**

```bash
docker tag sewain-backend:latest username/sewain-backend:v1.0
docker push username/sewain-backend:v1.0
```

### Push ke Google Container Registry (GCR)

```bash
docker tag sewain-backend:latest gcr.io/PROJECT_ID/sewain-backend:latest
docker push gcr.io/PROJECT_ID/sewain-backend:latest
```

### Push ke GitHub Container Registry (GHCR)

```bash
docker tag sewain-backend:latest ghcr.io/aidilsaputrakirsan/sewain-backend:latest
docker push ghcr.io/aidilsaputrakirsan/sewain-backend:latest
```

---

## 9. `docker pull`

Mendownload image dari registry.

### Sintaks

```bash
docker pull <image>:<tag>
```

### Contoh Proyek SEWAIN

**Pull image proyek dari Docker Hub:**

```bash
docker pull username/sewain-backend:latest
docker pull username/sewain-frontend:latest
```

**Pull base image yang dipakai di Dockerfile:**

```bash
docker pull python:3.12-slim
docker pull node:20-alpine
docker pull nginx:alpine
docker pull postgres:16-alpine
```

**Pull versi spesifik:**

```bash
docker pull username/sewain-backend:v1.0
```

---

## 10. Perintah Tambahan yang Berguna

### Inspeksi & Info

```bash
# Lihat detail lengkap container (env vars, network, mounts, dll)
docker inspect sewain-backend

# Lihat penggunaan resource (CPU, memory) secara live
docker stats

# Lihat resource proyek SEWAIN saja
docker stats sewain-backend sewain-frontend sewain-db

# Lihat daftar semua image lokal
docker images

# Lihat daftar volume
docker volume ls

# Lihat daftar network
docker network ls
```

### Network

```bash
# Buat network khusus agar container bisa komunikasi via nama
docker network create sewain-net

# Jalankan container dalam network yang sama
docker run -d --name sewain-db --network sewain-net postgres:16-alpine
docker run -d --name sewain-backend --network sewain-net sewain-backend:latest

# Di dalam sewain-net, backend bisa akses DB via: postgresql://postgres:pass@sewain-db:5432/sewain_db
```

### Volume

```bash
# Buat named volume untuk data PostgreSQL
docker volume create sewain-pgdata

# Lihat detail volume
docker volume inspect sewain-pgdata

# Hapus volume
docker volume rm sewain-pgdata
```

### Copy File

```bash
# Copy file dari container ke host
docker cp sewain-backend:/app/logs/error.log ./error.log

# Copy file dari host ke container
docker cp ./seed-data.sql sewain-db:/tmp/seed-data.sql

# Lalu jalankan seed dari dalam container
docker exec sewain-db psql -U postgres -d sewain_db -f /tmp/seed-data.sql
```

---

## Workflow Lengkap

### Development: Build → Run → Debug → Cleanup

```bash
# 1. Build semua image
docker build -t sewain-backend:latest ./backend
docker build -t sewain-frontend:latest --build-arg VITE_API_URL=http://localhost:8000 ./frontend

# 2. Buat network
docker network create sewain-net

# 3. Jalankan PostgreSQL
docker run -d \
  --name sewain-db \
  --network sewain-net \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=sewain_db \
  -v sewain-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# 4. Jalankan backend
docker run -d \
  --name sewain-backend \
  --network sewain-net \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:password123@sewain-db:5432/sewain_db \
  -e SECRET_KEY=dev-secret-key-32-chars-minimum!! \
  -e ALGORITHM=HS256 \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=60 \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  sewain-backend:latest

# 5. Jalankan frontend
docker run -d \
  --name sewain-frontend \
  --network sewain-net \
  -p 3000:80 \
  sewain-frontend:latest

# 6. Verifikasi semua berjalan
docker ps --filter "name=sewain"

# 7. Cek health
docker exec sewain-backend curl -f http://localhost:8000/health

# 8. Lihat log jika ada masalah
docker logs sewain-backend
docker logs sewain-frontend

# 9. Cleanup saat selesai
docker stop sewain-backend sewain-frontend sewain-db
docker rm sewain-backend sewain-frontend sewain-db
docker network rm sewain-net
```

### Production: Build → Tag → Push → Pull → Run

```bash
# 1. Build untuk production
docker build -t sewain-backend:v1.0 ./backend
docker build -t sewain-frontend:v1.0 \
  --build-arg VITE_API_URL=https://api.sewain.example.com \
  ./frontend

# 2. Tag untuk registry
docker tag sewain-backend:v1.0 username/sewain-backend:v1.0
docker tag sewain-frontend:v1.0 username/sewain-frontend:v1.0

# 3. Push ke registry
docker push username/sewain-backend:v1.0
docker push username/sewain-frontend:v1.0

# --- Di server production ---

# 4. Pull dari registry
docker pull username/sewain-backend:v1.0
docker pull username/sewain-frontend:v1.0

# 5. Run di server
docker run -d --name sewain-backend -p 8000:8000 --env-file .env username/sewain-backend:v1.0
docker run -d --name sewain-frontend -p 80:80 username/sewain-frontend:v1.0
```

---

## Quick Reference Card

| Apa yang mau dilakukan? | Command |
|-------------------------|---------|
| Build image backend | `docker build -t sewain-backend:latest ./backend` |
| Build image frontend | `docker build -t sewain-frontend:latest --build-arg VITE_API_URL=http://localhost:8000 ./frontend` |
| Jalankan container | `docker run -d --name sewain-backend -p 8000:8000 sewain-backend:latest` |
| Lihat container running | `docker ps` |
| Lihat semua container | `docker ps -a` |
| Lihat log | `docker logs -f sewain-backend` |
| Masuk ke shell container | `docker exec -it sewain-backend bash` |
| Stop container | `docker stop sewain-backend` |
| Hapus container | `docker rm sewain-backend` |
| Hapus image | `docker rmi sewain-backend:latest` |
| Push ke registry | `docker push username/sewain-backend:latest` |
| Pull dari registry | `docker pull username/sewain-backend:latest` |
| Bersihkan semua | `docker system prune -a` |



