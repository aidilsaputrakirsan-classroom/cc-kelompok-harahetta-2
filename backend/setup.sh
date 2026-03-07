#!/bin/bash
# ==============================================================
# setup.sh — Script setup untuk Cloud App API Backend
# ==============================================================
# Penggunaan:
#   chmod +x setup.sh   (beri izin eksekusi, hanya pertama kali)
#   ./setup.sh           (jalankan script)
# ==============================================================

set -e  # Berhenti jika ada error

echo "=============================================="
echo "  Cloud App API — Setup Script"
echo "=============================================="
echo ""

# --- 1. Cek Python ---
echo "[1/4] Mengecek Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Python tidak ditemukan! Install Python 3.8+ terlebih dahulu."
    exit 1
fi
echo "✅ Python ditemukan: $($PYTHON_CMD --version)"
echo ""

# --- 2. Buat virtual environment (opsional tapi direkomendasikan) ---
echo "[2/4] Membuat virtual environment..."
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "✅ Virtual environment dibuat."
else
    echo "ℹ️  Virtual environment sudah ada, skip."
fi

# Aktifkan virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
echo "✅ Virtual environment diaktifkan."
echo ""

# --- 3. Install dependencies ---
echo "[3/4] Menginstall dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo "✅ Semua dependencies terinstall."
echo ""

# --- 4. Setup file .env ---
echo "[4/4] Mengecek file .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ File .env dibuat dari .env.example."
    echo "⚠️  PENTING: Edit file .env dan ganti 'yourpassword' dengan password PostgreSQL Anda!"
else
    echo "ℹ️  File .env sudah ada, skip."
fi
echo ""

# --- Selesai ---
echo "=============================================="
echo "  ✅ Setup selesai!"
echo "=============================================="
echo ""
echo "Langkah selanjutnya:"
echo "  1. Pastikan PostgreSQL berjalan"
echo "  2. Edit file .env (ganti password database)"
echo "  3. Buat database: CREATE DATABASE cloudapp;"
echo "  4. Jalankan server: uvicorn main:app --reload --port 8000"
echo "  5. Buka Swagger UI: http://localhost:8000/docs"
echo ""
