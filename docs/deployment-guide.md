# Deployment Guide

## Overview

Aplikasi di-deploy otomatis via GitHub Actions CD pipeline ke DeployCCC.
Setelah deploy berhasil, pipeline menjalankan health check ke endpoint `/api/health`.
Jika health check gagal, workflow gagal dan alert muncul di GitHub Actions.

---

## Health Check

Pipeline melakukan health check otomatis setelah deploy:

| Parameter | Nilai |
|-----------|-------|
| Endpoint | `https://<domain>/api/health` |
| Max retry | 5 kali |
| Interval retry | 10 detik |
| Timeout per request | 15 detik |
| Kriteria sukses | HTTP 200 |

Jika setelah 5 percobaan backend tidak merespons HTTP 200, workflow **gagal** dan muncul alert di GitHub Actions summary.

---

## Rollback Manual

Jika deploy gagal atau health check tidak pass, ikuti langkah berikut:

### Opsi 1: Rollback via Re-deploy (Recommended)

Cara paling aman — trigger ulang CD dari commit yang stabil:

1. Buka **GitHub Actions** → **CD — Deploy ke DeployCCC**
2. Klik **"Run workflow"** (tombol manual dispatch)
3. Pilih branch yang terakhir stabil (biasanya `main` sebelum push terakhir)
4. Centang **`force_full_rebuild`** jika perlu rebuild frontend juga
5. Tunggu deploy selesai dan health check pass

### Opsi 2: Rollback via SSH

```bash
# 1. SSH ke server (credential ada di GitHub Actions summary)
ssh <username>@deploycc-server
# Masukkan password dari summary

# 2. Masuk ke direktori app
cd ~/app

# 3. Lihat history commit
git log --oneline -10

# 4. Checkout ke commit stabil sebelumnya
git checkout <commit-hash-stabil>

# 5. Install ulang dependencies (jika requirements berubah)
cd backend
pip install -r requirements.txt

# 6. Restart service
svc-restart

# 7. Verifikasi
svc-status
curl localhost:<port>/health
```

### Opsi 3: Rollback via Git Revert (untuk push ke main)

```bash
# Di local machine
git revert HEAD
git push origin main

# CD pipeline akan otomatis trigger dan deploy versi reverted
```

---

## Troubleshooting

### Health Check Gagal

| Gejala | Kemungkinan Penyebab | Solusi |
|--------|---------------------|--------|
| HTTP 000 (timeout) | Server belum start / crash | SSH → `svc-logs` cek error |
| HTTP 500 | Database connection error | SSH → `editenv` cek DB credentials |
| HTTP 502/503 | Nginx/proxy belum ready | Tunggu 1-2 menit, coba lagi |
| HTTP 524 | Cloudflare timeout | Re-run workflow |

### Deploy Gagal (HTTP 524)

Error 524 = Cloudflare timeout. Penyebab umum:
- Server DeployCCC sedang sibuk
- Upload ZIP terlalu lama

**Solusi:** Re-run workflow. Biasanya berhasil di percobaan kedua.

### Common SSH Commands

```bash
svc-status          # Lihat status service
svc-logs            # Tail log systemd (live)
svc-applog          # Tail application log
svc-restart         # Restart backend service
editenv             # Edit backend/.env
```

---

## Deployment Flow

```
Push ke main
    │
    ▼
CI Pipeline (test + lint)
    │ (success)
    ▼
CD Pipeline
    ├── Detect changes
    ├── Build frontend (jika berubah)
    ├── Build ZIP package
    ├── Deploy ke DeployCCC
    ├── ✅ Health Check (/api/health)
    │       ├── Pass → Deploy sukses
    │       └── Fail → Workflow gagal (alert)
    └── Summary
```

---

## Kontak

| Role | Tanggung Jawab |
|------|---------------|
| DevOps Lead | Akses server, rollback, pipeline |
| Admin DeployCCC | Infrastruktur, database, DNS |
