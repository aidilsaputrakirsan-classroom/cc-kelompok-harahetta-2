
# ─────────────────────────────────────────────
# BACKEND
# ─────────────────────────────────────────────
IMAGE_NAME     = sewain-backend
IMAGE_TAG      = v1
DOCKER_USER    = alif10231056
CONTAINER_NAME = sewain-backend
PORT           = 8000
ENV_FILE       = ./backend/.env

# ─────────────────────────────────────────────
# FRONTEND
# ─────────────────────────────────────────────
FE_IMAGE_NAME     = sewain-frontend
FE_IMAGE_TAG      = v2
FE_CONTAINER_NAME = sewain-frontend
FE_PORT           = 3000
VITE_API_URL      = http://localhost:8000

# ─────────────────────────────────────────────
# Build image dari Dockerfile
# ─────────────────────────────────────────────
build:
	@echo "🔨 Building Docker image $(IMAGE_NAME):$(IMAGE_TAG)..."
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) ./backend
	@echo "✅ Build selesai!"

# ─────────────────────────────────────────────
# Jalankan container di background
# ─────────────────────────────────────────────
run:
	@echo "🚀 Menjalankan container $(CONTAINER_NAME) di port $(PORT)..."
	docker run -d \
		-p $(PORT):8000 \
		--env-file $(ENV_FILE) \
		--name $(CONTAINER_NAME) \
		$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "✅ Container berjalan! Cek: http://localhost:$(PORT)/health"

# ─────────────────────────────────────────────
# Jalankan container di foreground (untuk debug)
# ─────────────────────────────────────────────
run-fg:
	docker run -p $(PORT):8000 --env-file $(ENV_FILE) $(IMAGE_NAME):$(IMAGE_TAG)

# ─────────────────────────────────────────────
# Tag dan push image ke Docker Hub
# ─────────────────────────────────────────────
push:
	@echo "🏷️  Tagging image ke $(DOCKER_USER)/$(IMAGE_NAME):$(IMAGE_TAG)..."
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(DOCKER_USER)/$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "📤 Pushing ke Docker Hub..."
	docker push $(DOCKER_USER)/$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "✅ Push selesai! Lihat: https://hub.docker.com/r/$(DOCKER_USER)/$(IMAGE_NAME)"

# ─────────────────────────────────────────────
# Stop dan hapus container yang berjalan
# ─────────────────────────────────────────────
stop:
	@echo "⏹️  Menghentikan container $(CONTAINER_NAME)..."
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Container dihentikan."

# ─────────────────────────────────────────────
# Stop container + hapus image lokal
# ─────────────────────────────────────────────
clean: stop
	@echo "🧹 Membersihkan image $(IMAGE_NAME):$(IMAGE_TAG)..."
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) 2>/dev/null || true
	@echo "✅ Bersih!"

# ─────────────────────────────────────────────
# Lihat log container (real-time)
# ─────────────────────────────────────────────
logs:
	docker logs -f $(CONTAINER_NAME)

# ─────────────────────────────────────────────
# Health check container
# ─────────────────────────────────────────────
health:
	@echo "🩺 Mengecek health container..."
	@curl -sf http://localhost:$(PORT)/health && echo " ✅ API Healthy!" || echo " ❌ API tidak merespons"

# ─────────────────────────────────────────────
# Masuk ke dalam container (shell interaktif)
# ─────────────────────────────────────────────
shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

# ─────────────────────────────────────────────
# Lihat status semua container Sewain
# ─────────────────────────────────────────────
ps:
	@echo "📋 Container Sewain yang berjalan:"
	docker ps --filter "name=$(CONTAINER_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ─────────────────────────────────────────────
# Rebuild + rerun (stop → clean → build → run)
# ─────────────────────────────────────────────
restart: stop build run

# ─────────────────────────────────────────────
# Tampilkan semua perintah yang tersedia
# ─────────────────────────────────────────────
help:
	@echo ""
	@echo "🛵 Sewain Docker Commands"
	@echo "=========================="
	@echo ""
	@echo "📦 Backend Commands:"
	@echo "  make build     → Build Docker image dari Dockerfile"
	@echo "  make run       → Jalankan container di background"
	@echo "  make run-fg    → Jalankan container di foreground (debug)"
	@echo "  make push      → Push image ke Docker Hub"
	@echo "  make stop      → Stop dan hapus container"
	@echo "  make clean     → Stop container + hapus image lokal"
	@echo "  make logs      → Lihat log container real-time"
	@echo "  make health    → Cek status health API"
	@echo "  make shell     → Masuk ke shell container"
	@echo "  make ps        → Lihat status container"
	@echo "  make restart   → Rebuild + rerun dari awal"
	@echo ""
	@echo "🎨 Frontend Commands:"
	@echo "  make fe-build  → Build frontend image"
	@echo "  make fe-push   → Push frontend image ke Docker Hub"
	@echo "  make fe-run    → Jalankan frontend container"
	@echo "  make fe-stop   → Stop frontend container"
	@echo "  make fe-restart → Rebuild + rerun frontend"
	@echo ""
	@echo "🐳 Docker Compose Commands:"
	@echo "  make compose-up      → Jalankan semua services (detached)"
	@echo "  make compose-down    → Stop semua services"
	@echo "  make compose-build   → Rebuild + jalankan semua services"
	@echo "  make compose-logs    → Lihat log realtime semua services"
	@echo "  make compose-ps      → Status semua services"
	@echo "  make compose-restart → Restart semua services"
	@echo "  make compose-clean   → Hapus containers, networks, volumes"
	@echo ""
	@echo "🔥 Development Mode (Hot-Reload):"
	@echo "  make dev        → Jalankan semua services mode dev (hot-reload)"
	@echo "  make dev-build  → Rebuild + jalankan mode dev"
	@echo "  make dev-down   → Stop semua dev services"
	@echo "  make dev-logs   → Lihat log realtime dev services"
	@echo "  make dev-ps     → Status dev services"
	@echo ""
	@echo "📤 Push Commands:"
	@echo "  make push-all  → Push backend + frontend ke Docker Hub"
	@echo ""
	@echo "🔧 Workflow / CI Commands:"
	@echo "  make lint      → Jalankan linter (flake8 + eslint)"
	@echo "  make test      → Jalankan test suite (placeholder)"
	@echo "  make pr-check  → Build Docker + test (cek sebelum PR)"
	@echo ""

# ─────────────────────────────────────────────
# FRONTEND: Build image v2
# ─────────────────────────────────────────────
fe-build:
	@echo "🔨 Building frontend image $(FE_IMAGE_NAME):$(FE_IMAGE_TAG)..."
	docker build \
		--build-arg VITE_API_URL=$(VITE_API_URL) \
		-t $(FE_IMAGE_NAME):$(FE_IMAGE_TAG) \
		./frontend
	@echo "✅ Frontend build selesai!"

# ─────────────────────────────────────────────
# FRONTEND: Push image v2 ke Docker Hub
# ─────────────────────────────────────────────
fe-push: fe-build
	@echo "🏷️  Tagging image ke $(DOCKER_USER)/$(FE_IMAGE_NAME):$(FE_IMAGE_TAG)..."
	docker tag $(FE_IMAGE_NAME):$(FE_IMAGE_TAG) $(DOCKER_USER)/$(FE_IMAGE_NAME):$(FE_IMAGE_TAG)
	@echo "📤 Pushing ke Docker Hub..."
	docker push $(DOCKER_USER)/$(FE_IMAGE_NAME):$(FE_IMAGE_TAG)
	@echo "✅ Push selesai! Lihat: https://hub.docker.com/r/$(DOCKER_USER)/$(FE_IMAGE_NAME)"

# ─────────────────────────────────────────────
# FRONTEND: Jalankan container
# ─────────────────────────────────────────────
fe-run:
	@echo "🚀 Menjalankan frontend container di port $(FE_PORT)..."
	docker run -d \
		--name $(FE_CONTAINER_NAME) \
		--network cloudnet \
		-p $(FE_PORT):80 \
		$(FE_IMAGE_NAME):$(FE_IMAGE_TAG)
	@echo "✅ Frontend berjalan! Cek: http://localhost:$(FE_PORT)"

# ─────────────────────────────────────────────
# FRONTEND: Stop container
# ─────────────────────────────────────────────
fe-stop:
	@echo "⏹️  Menghentikan frontend container..."
	docker stop $(FE_CONTAINER_NAME) 2>/dev/null || true
	docker rm $(FE_CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Frontend container dihentikan."

# ─────────────────────────────────────────────
# FRONTEND: Rebuild + rerun
# ─────────────────────────────────────────────
fe-restart: fe-stop fe-build fe-run

# ─────────────────────────────────────────────
# Push semua image (backend + frontend) ke Hub
# ─────────────────────────────────────────────
push-all: push fe-push
	@echo ""
	@echo "🎉 Semua image sudah di-push ke Docker Hub!"
	@echo "   Backend  : https://hub.docker.com/r/$(DOCKER_USER)/$(IMAGE_NAME)"
	@echo "   Frontend : https://hub.docker.com/r/$(DOCKER_USER)/$(FE_IMAGE_NAME)"

# ─────────────────────────────────────────────
# DOCKER COMPOSE COMMANDS
# ─────────────────────────────────────────────
compose-up:
	@echo "🚀 Menjalankan semua services dengan Docker Compose..."
	docker compose up -d
	@echo "✅ Services berjalan! Cek status: make compose-ps"

compose-down:
	@echo "⏹️  Menghentikan semua services..."
	docker compose down
	@echo "✅ Semua services dihentikan."

compose-build:
	@echo "🔨 Rebuild dan jalankan semua services..."
	docker compose up --build -d
	@echo "✅ Rebuild selesai dan services berjalan!"

compose-logs:
	@echo "📋 Menampilkan log real-time dari semua services..."
	docker compose logs -f

compose-ps:
	@echo "📊 Status semua services:"
	docker compose ps

compose-restart:
	@echo "🔄 Restart semua services..."
	docker compose restart
	@echo "✅ Services direstart!"

compose-clean:
	@echo "🧹 Menghapus containers, networks, dan volumes..."
	docker compose down -v
	@echo "✅ Semua data dibersihkan!"

up: compose-up
down: compose-down
status: compose-ps

prod:
	@echo "🚀 Menjalankan services dengan Docker Compose Production Overrides..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ Services berjalan di environment production!"

# ─────────────────────────────────────────────
# DEVELOPMENT MODE (Hot-Reload)
# Menggunakan docker-compose.dev.yml override
# ─────────────────────────────────────────────
dev:
	@echo "🔥 Menjalankan semua services dalam mode development (hot-reload)..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Development services berjalan!"
	@echo "   🌐 Frontend (Vite HMR) : http://localhost:5173"
	@echo "   🔐 Auth Service        : http://localhost:8001"
	@echo "   📦 Item Service        : http://localhost:8002"
	@echo "   🏠 Rental Service      : http://localhost:8003"
	@echo "   💳 Payment Service     : http://localhost:8004"
	@echo "   💬 Chat Service        : http://localhost:8005"
	@echo "   🤖 Chatbot Service     : http://localhost:8006"
	@echo "   🔀 Gateway (Nginx)     : http://localhost:80"
	@echo ""
	@echo "   Perubahan kode di services/ akan langsung reload tanpa rebuild!"

dev-build:
	@echo "🔨 Rebuild development images dan jalankan services..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
	@echo "✅ Development rebuild selesai!"

dev-down:
	@echo "⏹️  Menghentikan semua development services..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "✅ Development services dihentikan."

dev-logs:
	@echo "📋 Menampilkan log real-time development services..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-ps:
	@echo "📊 Status development services:"
	docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# ─────────────────────────────────────────────
# LINT: Jalankan linter untuk backend (flake8) dan frontend (eslint)
# ─────────────────────────────────────────────
lint:
	@echo "🔍 Menjalankan linter..."
	@echo "--- Backend (flake8) ---"
	cd backend && pip install flake8 --quiet && flake8 . --max-line-length=120 --exclude=__pycache__,.env || true
	@echo "--- Frontend (eslint) ---"
	cd frontend && npm install --silent && npx eslint src/ --ext .js,.jsx || true
	@echo "✅ Lint selesai!"

# ─────────────────────────────────────────────
# TEST: Placeholder untuk test runner
# ─────────────────────────────────────────────
test:
	@echo "🧪 Menjalankan test..."
	@echo "⚠️  [PLACEHOLDER] Test suite belum dikonfigurasi."
	@echo "   Backend : tambahkan pytest di backend/tests/"
	@echo "   Frontend: tambahkan vitest/jest di frontend/src/__tests__/"
	@echo "✅ Test step selesai (placeholder)."

# ─────────────────────────────────────────────
# PR-CHECK: Build semua Docker image + jalankan test
# Digunakan sebelum membuat Pull Request
# ─────────────────────────────────────────────
pr-check: build fe-build test
	@echo ""
	@echo "🔎 PR Check selesai!"
	@echo "   ✅ Backend image   : $(IMAGE_NAME):$(IMAGE_TAG)"
	@echo "   ✅ Frontend image  : $(FE_IMAGE_NAME):$(FE_IMAGE_TAG)"
	@echo "   ✅ Test            : passed (placeholder)"
	@echo ""
	@echo "🚀 Aman untuk di-push dan buat Pull Request!"

.PHONY: build run run-fg push stop clean logs health shell ps restart help \
        fe-build fe-push fe-run fe-stop fe-restart push-all \
        compose-up compose-down compose-build compose-logs compose-ps compose-restart compose-clean \
        dev dev-build dev-down dev-logs dev-ps \
        lint test pr-check \
        up down status prod
