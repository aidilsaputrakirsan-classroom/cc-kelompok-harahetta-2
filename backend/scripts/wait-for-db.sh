#!/usr/bin/env sh
# =============================================================================
# wait-for-db.sh
# Menunggu PostgreSQL siap sebelum menjalankan uvicorn.
# Usage: ./scripts/wait-for-db.sh
# =============================================================================

set -e

# ── Konfigurasi (ambil dari env, ada default fallback) ────────────────────────
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-appdb}"

MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY_INTERVAL="${DB_RETRY_INTERVAL:-2}"

# ── Warna untuk log ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { printf "${GREEN}[wait-for-db] INFO:${NC}  %s\n" "$*"; }
log_warn()  { printf "${YELLOW}[wait-for-db] WAIT:${NC}  %s\n" "$*"; }
log_error() { printf "${RED}[wait-for-db] ERROR:${NC} %s\n" "$*"; }

# ── Cek tool yang tersedia ────────────────────────────────────────────────────
check_pg_ready() {
    # Prioritas 1: pg_isready
    if command -v pg_isready > /dev/null 2>&1; then
        pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null
        return $?
    fi

    # Prioritas 2: psql
    if command -v psql > /dev/null 2>&1; then
        PGPASSWORD="${POSTGRES_PASSWORD:-}" \
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -c "SELECT 1" > /dev/null 2>&1
        return $?
    fi

    # Prioritas 3: nc (netcat)
    if command -v nc > /dev/null 2>&1; then
        nc -z "$DB_HOST" "$DB_PORT" > /dev/null 2>&1
        return $?
    fi

    # Prioritas 4: /dev/tcp bash built-in
    (echo > /dev/tcp/"$DB_HOST"/"$DB_PORT") > /dev/null 2>&1
    return $?
}

# ── Loop polling ──────────────────────────────────────────────────────────────
log_info "Menunggu PostgreSQL di ${DB_HOST}:${DB_PORT} ..."

attempt=1
while [ "$attempt" -le "$MAX_RETRIES" ]; do
    if check_pg_ready; then
        log_info "PostgreSQL SIAP setelah ${attempt} percobaan. ✓"
        break
    fi

    log_warn "Percobaan ${attempt}/${MAX_RETRIES} — DB belum siap, coba lagi dalam ${RETRY_INTERVAL}s ..."
    attempt=$((attempt + 1))
    sleep "$RETRY_INTERVAL"
done

if [ "$attempt" -gt "$MAX_RETRIES" ]; then
    log_error "PostgreSQL tidak siap setelah $((MAX_RETRIES * RETRY_INTERVAL)) detik. Abort!"
    exit 1
fi

# ── Jalankan uvicorn setelah DB siap ─────────────────────────────────────────
if [ "$#" -gt 0 ]; then
    log_info "Menjalankan: $*"
    exec "$@"
else
    log_info "Menjalankan uvicorn (default) ..."
    exec uvicorn main:app \
        --host 0.0.0.0 \
        --port "${APP_PORT:-8000}" \
        --workers "${UVICORN_WORKERS:-1}" \
        --log-level "${LOG_LEVEL:-info}"
fi
