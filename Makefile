
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

.PHONY: build run run-fg push stop clean logs health shell ps restart help \
        fe-build fe-push fe-run fe-stop fe-restart push-all
