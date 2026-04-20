# ============================================================
# backend/Dockerfile — Sewain Backend (FastAPI)
#
# Menggunakan MULTI-STAGE BUILD dengan 2 tahap:
#   Stage 1 (builder) : install semua dependency Python ke venv
#   Stage 2 (runtime) : copy venv + kode → image production bersih
#
# Manfaat multi-stage build:
#   - Image final TIDAK membawa pip, cache, atau build tools
#   - Ukuran image lebih kecil & lebih aman di production
#   - Layer caching: install deps tidak diulang jika kode saja yang berubah
# ============================================================


# ============================================================
# STAGE 1: builder
# Tujuan: install dependency Python ke dalam virtual environment.
# Stage ini tidak masuk ke image final — hanya venv-nya yang dipakai.
# ============================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Buat virtual environment (venv) sebagai wadah instalasi deps
RUN python -m venv /app/venv

# Aktifkan venv: semua perintah pip/python setelah ini pakai venv
ENV PATH="/app/venv/bin:$PATH"

# --- LAYER CACHING: copy requirements.txt DULU sebelum kode ---
# Tujuan: jika hanya kode aplikasi yang berubah (bukan requirements.txt),
# Docker tidak perlu menjalankan pip install ulang → build lebih cepat.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
#               └─ --no-cache-dir: tidak simpan cache pip → image lebih kecil


# ============================================================
# STAGE 2: runtime (image production final)
# Tujuan: ambil venv dari stage 1, tambahkan kode aplikasi.
# Stage ini yang benar-benar dijalankan saat `docker compose up`.
# ============================================================
FROM python:3.12-slim

WORKDIR /app

# Ambil venv yang sudah terisi dependency dari stage builder.
# Instruksi --from=builder adalah kunci multi-stage build:
# kita ambil hanya yang dibutuhkan, sisanya (pip, cache) tidak ikut masuk.
COPY --from=builder /app/venv /app/venv

# Aktifkan venv di stage ini juga
ENV PATH="/app/venv/bin:$PATH"

# Install curl untuk kebutuhan HEALTHCHECK di bawah.
# rm -rf /var/lib/apt/lists/* → bersihkan cache apt agar image lebih kecil.
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy seluruh kode aplikasi.
# Diletakkan SETELAH install deps agar perubahan kode tidak
# membatalkan cache layer instalasi dependency di atas.
COPY . .

# Copy script yang menunggu DB siap sebelum uvicorn dijalankan
COPY scripts/wait-for-db.sh /app/scripts/wait-for-db.sh
RUN chmod +x /app/scripts/wait-for-db.sh

# Jalankan proses sebagai non-root user (best practice keamanan production).
# Agar jika container disusupi, attacker tidak punya akses root ke sistem.
RUN useradd -m appuser
USER appuser

# Dokumentasikan port yang diexpose container (informatif, tidak membuka port)
EXPOSE 8000

# Docker akan otomatis cek kesehatan container setiap 30 detik.
# Hasilnya (healthy/unhealthy) dipakai oleh docker-compose depends_on.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
#           └─ -f: curl return exit code 1 jika HTTP status bukan 2xx

# Entry point: jalankan wait-for-db.sh.
# Script ini polling ke PostgreSQL dulu, baru start uvicorn setelah DB siap.
CMD ["/app/scripts/wait-for-db.sh"]
