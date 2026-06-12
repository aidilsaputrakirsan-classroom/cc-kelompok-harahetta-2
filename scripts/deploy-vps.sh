#!/usr/bin/env bash
# =============================================================
# deploy-vps.sh — Script deploy Sewain Monolith (Tanpa Docker)
#
# Dipanggil oleh GitHub Actions cd-vps.yml via SSH.
# Jalankan manual di VPS:
#   bash scripts/deploy-vps.sh
# =============================================================

set -euo pipefail

# ─── Konfigurasi ─────────────────────────────────────────────
APP_DIR="/home/ubuntu/app"
BRANCH="${BRANCH:-main}"
SKIP_MIGRATE="${SKIP_MIGRATE:-false}"
LOG_FILE="$APP_DIR/logs/deploy.log"

# ─── Warna output ────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
header()  { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

# Logging ke file
mkdir -p "$APP_DIR/logs"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================================"
echo "  DEPLOY MONOLITH DIMULAI: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Branch: $BRANCH | Skip migrate: $SKIP_MIGRATE"
echo "============================================================"

# Pastikan berada di folder aplikasi
cd "$APP_DIR"
success "Working dir: $(pwd)"

# ─── STEP 1: Git pull ────────────────────────────────────────
header "STEP 1 — Git Pull"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
success "Berhasil pull branch '$BRANCH' @ $COMMIT_SHA"
info "Commit: $COMMIT_MSG"

# ─── STEP 2: Setup/Update Python dependencies ────────────────
header "STEP 2 — Backend Dependencies"
if [ ! -d "backend/venv" ]; then
  info "Membuat python virtual environment..."
  python3 -m venv backend/venv
fi

# Aktifkan venv & install dependencies
source backend/venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
deactivate
success "Python dependencies terinstall"

# ─── STEP 3: Database Migrations (jika ada) ──────────────────
header "STEP 3 — Database Migration"
if [ "$SKIP_MIGRATE" = "true" ]; then
  warn "Database migration di-skip sesuai parameter."
else
  # Menjalankan startup script bawaan main.py untuk auto-create table & migrations
  info "Menjalankan database schemas check..."
  source backend/venv/bin/activate
  # Kita trigger main.py singkat untuk verifikasi koneksi dan ensure database schemas
  python -c "
import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from database import engine
from models import Base
print('Menghubungkan ke DB dan memastikan table terbuat...')
Base.metadata.create_all(bind=engine)
print('DB Check selesai.')
"
  deactivate
  success "Database terverifikasi"
fi

# ─── STEP 4: Build Frontend (React) ──────────────────────────
header "STEP 4 — Build Frontend (React)"
cd frontend

# Install package & build
npm install
npm run build
cd "$APP_DIR"
success "Frontend built successfully"

# ─── STEP 5: Restart Service Backend ────────────────────────
header "STEP 5 — Restart Backend Service"
info "Mengulang service sewain-backend via systemctl..."
sudo systemctl restart sewain-backend
success "Backend restart berhasil"

# ─── STEP 6: Reload Nginx (jika config berubah) ─────────────
header "STEP 6 — Reload Nginx"
sudo systemctl reload nginx || sudo systemctl restart nginx
success "Nginx reloaded"

# ─── SELESAI ─────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  DEPLOY SELESAI: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Commit: $COMMIT_SHA — $COMMIT_MSG"
echo "============================================================"
echo ""
