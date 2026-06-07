#!/bin/bash
# =============================================================
# logs.sh — Log helper script untuk debugging microservices
# Kelompok Harahetta-2
#
# Usage:
#   ./scripts/logs.sh all             — Lihat log semua service real-time
#   ./scripts/logs.sh errors          — Filter hanya ERROR/CRITICAL logs
#   ./scripts/logs.sh trace <id>      — Trace satu request via correlation ID
#   ./scripts/logs.sh metrics         — Tampilkan metrics semua service
#   ./scripts/logs.sh status          — Cek health semua service
#   ./scripts/logs.sh export          — Export log ke file
# =============================================================

GATEWAY_URL="${GATEWAY_URL:-http://localhost}"
LOG_DIR="logs"
SERVICES="auth-service item-service rental-service payment-service chat-service chatbot-service"

case "$1" in
  all)
    echo "📋 Showing real-time logs dari semua services..."
    echo "   Tekan Ctrl+C untuk berhenti."
    echo ""
    docker compose logs -f $SERVICES
    ;;

  errors)
    echo "❌ Menampilkan ERROR dan CRITICAL logs..."
    echo ""
    docker compose logs $SERVICES 2>&1 | grep -E '"level":"(ERROR|CRITICAL|WARNING)"' | \
      python3 -c "
import sys, json
for line in sys.stdin:
    try:
        # Ambil JSON bagian setelah prefix docker compose
        parts = line.split('| ', 1)
        prefix = parts[0] if len(parts) > 1 else ''
        json_str = parts[-1].strip()
        data = json.loads(json_str)
        ts   = data.get('timestamp', '')[:19].replace('T', ' ')
        lvl  = data.get('level', '')
        svc  = data.get('service', '')
        msg  = data.get('message', '')
        cid  = data.get('correlation_id', '')
        sc   = data.get('status_code', '')
        print(f'[{ts}] [{lvl:<8}] [{svc:<20}] {msg}' + (f' | status={sc}' if sc else '') + (f' | cid={cid}' if cid else ''))
    except:
        print(line.rstrip())
" 2>/dev/null || \
    docker compose logs $SERVICES 2>&1 | grep -E 'ERROR|CRITICAL|WARNING'
    ;;

  trace)
    if [ -z "$2" ]; then
      echo "❌ Correlation ID diperlukan."
      echo "   Usage: ./scripts/logs.sh trace <correlation-id>"
      exit 1
    fi
    echo "🔗 Tracing request dengan correlation_id: $2"
    echo ""
    docker compose logs $SERVICES 2>&1 | grep "$2" | \
      python3 -c "
import sys, json
for line in sys.stdin:
    try:
        parts = line.split('| ', 1)
        json_str = parts[-1].strip()
        data = json.loads(json_str)
        ts   = data.get('timestamp', '')[:23].replace('T', ' ')
        svc  = data.get('service', '')
        msg  = data.get('message', '')
        sc   = data.get('status_code', '')
        ms   = data.get('duration_ms', '')
        print(f'[{ts}] [{svc:<20}] {msg}' + (f' | {sc}' if sc else '') + (f' | {ms}ms' if ms else ''))
    except:
        print(line.rstrip())
" 2>/dev/null || docker compose logs $SERVICES 2>&1 | grep "$2"
    ;;

  metrics)
    echo "📊 Mengambil metrics dari semua services..."
    echo ""
    for SVC_PATH in "auth/metrics" "items/metrics" "rentals/health" "chatbot/health"; do
      SVC_NAME=$(echo $SVC_PATH | cut -d'/' -f1)
      echo "─── $SVC_NAME ───────────────────────────"
      RESULT=$(curl -sf --max-time 3 "${GATEWAY_URL}/${SVC_PATH}" 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
      else
        echo "  ⚠️  Tidak dapat terhubung ke ${GATEWAY_URL}/${SVC_PATH}"
      fi
      echo ""
    done
    ;;

  status)
    echo "🩺 Status semua services..."
    echo ""
    SERVICES_HEALTH=(
      "Gateway:/health"
      "Auth:/auth/health"
      "Item:/items/health"
      "Rental:/rentals/health"
      "Payment:/payments/health"
      "Chat:/chat/health"
      "Chatbot:/chatbot/health"
    )
    ALL_OK=true
    for ENTRY in "${SERVICES_HEALTH[@]}"; do
      NAME=$(echo $ENTRY | cut -d':' -f1)
      PATH=$(echo $ENTRY | cut -d':' -f2)
      RESULT=$(curl -sf --max-time 3 "${GATEWAY_URL}${PATH}" 2>/dev/null)
      if [ $? -eq 0 ]; then
        STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "ok")
        if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "ok" ]; then
          echo "  ✅  $NAME — $STATUS"
        else
          echo "  ⚠️  $NAME — $STATUS"
          ALL_OK=false
        fi
      else
        echo "  ❌  $NAME — unreachable"
        ALL_OK=false
      fi
    done
    echo ""
    if $ALL_OK; then
      echo "🟢 Semua services healthy!"
    else
      echo "🔴 Ada service yang bermasalah — cek logs dengan: ./scripts/logs.sh errors"
    fi
    ;;

  export)
    mkdir -p "$LOG_DIR"
    FILENAME="${LOG_DIR}/sewain-logs-$(date +%Y%m%d-%H%M%S).log"
    echo "📁 Mengexport log ke: $FILENAME"
    docker compose logs --no-color $SERVICES > "$FILENAME" 2>&1
    SIZE=$(du -h "$FILENAME" | cut -f1)
    echo "✅ Export selesai! File: $FILENAME ($SIZE)"
    ;;

  *)
    echo ""
    echo "🛵 Sewain Log Helper"
    echo "===================="
    echo ""
    echo "Usage: ./scripts/logs.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  all              — Lihat log semua service real-time (Ctrl+C untuk berhenti)"
    echo "  errors           — Filter hanya ERROR/WARNING logs"
    echo "  trace <id>       — Trace satu request via Correlation ID"
    echo "  metrics          — Tampilkan metrics semua service (/metrics endpoint)"
    echo "  status           — Quick health check semua service"
    echo "  export           — Export semua log ke file di logs/"
    echo ""
    echo "Contoh:"
    echo "  ./scripts/logs.sh all"
    echo "  ./scripts/logs.sh errors"
    echo "  ./scripts/logs.sh trace a1b2c3d4"
    echo "  ./scripts/logs.sh metrics"
    echo "  ./scripts/logs.sh status"
    echo ""
    ;;
esac
