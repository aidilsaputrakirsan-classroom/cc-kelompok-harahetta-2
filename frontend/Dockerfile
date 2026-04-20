# ============================================================
# DOCKERFILE — Frontend React (Sewain App)
# Menggunakan 2 tahap (multi-stage build):
#   Tahap 1 → Compile source code React menjadi file statis
#   Tahap 2 → Sajikan file statis ke browser menggunakan Nginx
#
# Tujuan multi-stage: image akhir lebih kecil (~25MB) karena
# Node.js dan source code tidak ikut ke production.
# ============================================================


# ============================================================
# [TAHAP 1] BUILD
# Gunakan Node.js untuk menginstall dependency dan
# mengkompilasi kode React menjadi file HTML/CSS/JS statis.
# Tahap ini akan DIBUANG setelah selesai — tidak masuk image akhir.
# ============================================================
FROM node:20-alpine AS builder

# [1] Tentukan folder kerja di dalam container
WORKDIR /app

# [2] Copy file daftar dependency terlebih dahulu.
#     Trik ini mempercepat proses build ulang — jika kode
#     berubah tapi package.json tidak, Docker skip install ulang.
COPY package.json package-lock.json ./

# [3] Install semua dependency secara bersih (cocok untuk production)
RUN npm ci

# [4] Setelah dependency siap, baru copy seluruh source code
COPY . .

# [5] Tentukan URL backend — bisa diisi saat build dengan --build-arg.
#     Default: localhost:8000 (untuk development lokal)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# [6] Jalankan build → hasilnya tersimpan di folder /app/dist/
RUN npm run build


# ============================================================
# [TAHAP 2] PRODUCTION
# Gunakan Nginx sebagai web server untuk menyajikan file statis
# hasil build dari Tahap 1 ke browser pengguna.
# Hanya file yang diperlukan yang masuk ke image akhir.
# ============================================================
FROM nginx:alpine

# [7] Ambil hasil build (folder dist/) dari Tahap 1
#     dan letakkan di folder default Nginx untuk file web
COPY --from=builder /app/dist /usr/share/nginx/html

# [8] Ambil halaman error khusus dari Tahap 1
#     (ditampilkan saat terjadi error 404 atau 500)
COPY --from=builder /app/public/404.html /usr/share/nginx/html/404.html
COPY --from=builder /app/public/50x.html /usr/share/nginx/html/50x.html

# [9] Pasang konfigurasi Nginx agar React Router berfungsi.
#     Tanpa ini, refresh di halaman selain "/" akan muncul error 404
#     karena Nginx tidak tahu route tersebut — harus dikembalikan ke index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# [10] Beri tahu Docker bahwa container ini berjalan di port 80
EXPOSE 80

# [11] Cek otomatis setiap 30 detik apakah Nginx masih berjalan normal.
#      Jika gagal 3 kali berturut-turut, container dianggap tidak sehat.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# [12] Jalankan Nginx di foreground (bukan background).
#      Wajib foreground agar container tidak langsung berhenti setelah start.
CMD ["nginx", "-g", "daemon off;"]
