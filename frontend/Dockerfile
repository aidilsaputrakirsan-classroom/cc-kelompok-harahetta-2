# ============================================================
# Stage 1: Build — Compile React app menjadi static files
# ============================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files dulu (cache optimization)
# Layer ini hanya rebuild jika package.json / package-lock.json berubah
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy seluruh source code
COPY . .

# Build production bundle
# Output: /app/dist/
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================
# Stage 2: Production — Serve static files dengan Nginx
# ============================================================
FROM nginx:alpine

# Copy hasil build dari stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config untuk handle React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Healthcheck Nginx
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:80 || exit 1

# Nginx berjalan di foreground
CMD ["nginx", "-g", "daemon off;"]
