#!/bin/bash
# =============================================================
# deploy-shared.sh — Copy shared modules ke semua services
# Kelompok Harahetta-2
#
# Usage:
#   bash scripts/deploy-shared.sh
#
# Jalankan setelah mengubah file di services/shared/
# =============================================================

set -e

SHARED_DIR="services/shared"
SERVICES=(
  "services/auth-service"
  "services/item-service"
  "services/rental-service"
  "services/payment-service"
  "services/chat-service"
  "services/chatbot-service"
)

echo "📦 Deploying shared modules ke semua services..."
echo ""

for SERVICE in "${SERVICES[@]}"; do
  if [ -d "$SERVICE" ]; then
    echo "  → $SERVICE"
    cp "$SHARED_DIR/logging_config.py"    "$SERVICE/logging_config.py"
    cp "$SHARED_DIR/logging_middleware.py" "$SERVICE/logging_middleware.py"
    cp "$SHARED_DIR/metrics.py"           "$SERVICE/metrics.py"
  else
    echo "  ⚠️  Skipping $SERVICE (direktori tidak ditemukan)"
  fi
done

echo ""
echo "✅ Shared modules berhasil di-deploy!"
echo ""
echo "File yang di-copy:"
echo "  - logging_config.py    (JSON structured logging)"
echo "  - logging_middleware.py (request logging + timing)"
echo "  - metrics.py           (in-memory metrics collector)"
echo ""
echo "💡 Jangan lupa rebuild services: make compose-build"
