#!/bin/bash

# ============================================================
# docker-run.sh — Helper script untuk menjalankan semua
# container Sewain secara manual
#
# Usage:
#   ./scripts/docker-run.sh start    → Jalankan semua container
#   ./scripts/docker-run.sh stop     → Stop & hapus semua container
#   ./scripts/docker-run.sh status   → Lihat status container
#   ./scripts/docker-run.sh logs [container]  → Lihat logs
#
# CATATAN: Minggu 7 kita akan pakai Docker Compose yang lebih elegan
# ============================================================

ACTION=${1:-start}

case $ACTION in
  start)
    echo "🚀 Starting Sewain containers..."
    echo ""

    # Buat network jika belum ada
    docker network create cloudnet 2>/dev/null && echo "✅ Network cloudnet created" || echo "ℹ️  Network cloudnet already exists"
    echo ""

    # ── Database ──────────────────────────────────────────
    echo "📦 Starting database (PostgreSQL)..."
    docker run -d \
      --name db \
      --network cloudnet \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=setiawan \
      -e POSTGRES_DB=data_sewain \
      -p 15432:5432 \
      -v sewain-pgdata:/var/lib/postgresql/data \
      postgres:16-alpine

    echo "⏳ Waiting for database to be ready..."
    sleep 5

    # ── Backend ───────────────────────────────────────────
    echo "🐍 Starting backend (FastAPI)..."
    docker run -d \
      --name backend \
      --network cloudnet \
      --env-file backend/.env.docker \
      -p 8000:8000 \
      sewain-backend:v2

    # ── Frontend ──────────────────────────────────────────
    echo "⚛️  Starting frontend (React + Nginx)..."
    docker run -d \
      --name frontend \
      --network cloudnet \
      -p 3000:80 \
      sewain-frontend:v1

    echo ""
    echo "✅ Sewain is running!"
    echo "   Frontend  : http://localhost:3000"
    echo "   Backend   : http://localhost:8000"
    echo "   API Docs  : http://localhost:8000/docs"
    echo "   Database  : localhost:15432"
    echo ""
    echo "   Run './scripts/docker-run.sh status' untuk cek container"
    ;;

  stop)
    echo "🛑 Stopping Sewain containers..."
    docker stop frontend backend db 2>/dev/null
    docker rm frontend backend db 2>/dev/null
    echo "✅ All containers stopped and removed."
    echo "ℹ️  Volume sewain-pgdata masih ada (data tidak hilang)."
    ;;

  status)
    echo "📊 Sewain Container Status:"
    echo ""
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" \
      --filter name=frontend \
      --filter name=backend \
      --filter name=db
    ;;

  logs)
    CONTAINER=${2:-backend}
    echo "📋 Logs for '$CONTAINER':"
    docker logs -f $CONTAINER
    ;;

  restart)
    echo "🔄 Restarting Sewain containers..."
    docker restart frontend backend db
    echo "✅ All containers restarted."
    ;;

  *)
    echo "Usage: ./scripts/docker-run.sh [start|stop|status|logs [container]|restart]"
    echo ""
    echo "Commands:"
    echo "  start          → Jalankan semua container (db, backend, frontend)"
    echo "  stop           → Stop & hapus semua container"
    echo "  status         → Lihat status semua container"
    echo "  logs [name]    → Lihat logs container (default: backend)"
    echo "  restart        → Restart semua container"
    ;;
esac
