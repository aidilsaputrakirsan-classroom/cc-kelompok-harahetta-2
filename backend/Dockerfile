# # ============================================================
# # Stage: Production Image
# # ============================================================

# # 1. Base image — Python 3.12 slim (debian minimal, ~50MB)
# FROM python:3.12-slim

# # 2. Set working directory di dalam container
# WORKDIR /app

# # 3. Copy HANYA requirements.txt dulu (cache optimization)
# #    Layer ini hanya rebuild jika requirements.txt berubah
# COPY requirements.txt .

# # 4. Install Python dependencies + curl untuk healthcheck
# #    --no-cache-dir: jangan simpan pip cache (hemat space)
# RUN pip install --no-cache-dir -r requirements.txt

# # 5. Install curl untuk HEALTHCHECK & bersihkan apt cache
# RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# # 6. Copy seluruh kode aplikasi
# #    Layer ini rebuild setiap kali kode berubah
# COPY . .

# # 7. Buat non-root user untuk keamanan (best practice production)
# RUN useradd -m appuser
# USER appuser

# # 8. Dokumentasikan port yang digunakan
# EXPOSE 8000

# # 9. Healthcheck — Docker akan monitor status container secara otomatis
# #    --interval=30s : cek setiap 30 detik
# #    --timeout=10s  : timeout jika tidak respond dalam 10 detik
# #    --retries=3    : tandai unhealthy setelah 3x gagal
# HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
#     CMD curl -f http://localhost:8000/health || exit 1

# # 10. Command untuk menjalankan aplikasi
# #     --host 0.0.0.0: agar bisa diakses dari luar container
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# ============================================================
# Stage 1: Builder — install deps ke venv
# ============================================================
FROM python:3.12-slim AS builder

WORKDIR /app

RUN python -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ============================================================
# Stage 2: Production Image
# ============================================================

# 1. Base image — Python 3.12 slim (debian minimal, ~50MB)
FROM python:3.12-slim

# 2. Set working directory di dalam container
WORKDIR /app

# 3. Copy venv dari Stage 1 (TIDAK perlu pip install lagi!)
#    Ini inti dari multi-stage build — deps sudah ada di venv builder
COPY --from=builder /app/venv /app/venv

# 4. Set PATH agar Python & pip dari venv digunakan
ENV PATH="/app/venv/bin:$PATH"

# 5. Install curl untuk HEALTHCHECK & bersihkan apt cache
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 7. Copy seluruh kode aplikasi
#    Layer ini rebuild setiap kali kode berubah
COPY . .

# 8. Copy wait-for-db script & set permission
COPY scripts/wait-for-db.sh /app/scripts/wait-for-db.sh
RUN chmod +x /app/scripts/wait-for-db.sh

# 9. Buat non-root user untuk keamanan (best practice production)
RUN useradd -m appuser
USER appuser

# 10. Dokumentasikan port yang digunakan
EXPOSE 8000

# 11. Healthcheck — Docker akan monitor status container secara otomatis
#    --interval=30s : cek setiap 30 detik
#    --timeout=10s  : timeout jika tidak respond dalam 10 detik
#    --retries=3    : tandai unhealthy setelah 3x gagal
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 12. Jalankan wait-for-db.sh, otomatis start uvicorn setelah DB siap
CMD ["/app/scripts/wait-for-db.sh"]