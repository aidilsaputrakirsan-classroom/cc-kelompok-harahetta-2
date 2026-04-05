

IMAGE_NAME   = sewain-backend
IMAGE_TAG    = v1
DOCKER_USER  = alif10231056
CONTAINER_NAME = sewain-backend
PORT         = 8000
ENV_FILE     = ./backend/.env

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

.PHONY: build run run-fg push stop clean logs health shell ps restart help
