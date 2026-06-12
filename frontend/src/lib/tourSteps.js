/**
 * tourSteps.js — Definisi langkah tour untuk setiap halaman Sewain
 * Setiap step: { element: '#id', popover: { title, description, side, align } }
 */

/* ─── LandingPage ─────────────────────────────────────────── */
export const landingSteps = [
  {
    popover: {
      title: "🌿 Selamat datang di Sewain!",
      description:
        "Sewain adalah marketplace sewa barang #1. Panduan singkat ini akan menunjukkan cara menggunakan platform kami. Klik <strong>Lanjut</strong> untuk mulai.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#landing-search-bar",
    popover: {
      title: "🔍 Cari barang",
      description:
        "Ketik nama barang yang ingin kamu sewa di sini — misal 'kamera', 'tenda', atau 'drone'. Tekan Enter atau klik <strong>Cari</strong>.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#landing-features",
    popover: {
      title: "✅ Kenapa Sewain?",
      description:
        "Setiap mitra diverifikasi KTP, pembayaran aman via Midtrans, lokasi pickup di peta interaktif, dan ada chatbot 24/7 siap membantu.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#landing-categories",
    popover: {
      title: "📦 Kategori populer",
      description:
        "Telusuri barang berdasarkan kategori: Elektronik, Outdoor, Event, dan lainnya. Klik salah satu untuk langsung ke katalog.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#landing-how-it-works",
    popover: {
      title: "4 langkah, beres!",
      description:
        "Verifikasi akun → Pilih barang → Bayar & ambil → Nikmati & kembalikan. Prosesnya cepat, aman, dan transparan.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#landing-cta",
    popover: {
      title: "🚀 Siap mulai?",
      description:
        "Buat akun gratis sekarang atau langsung jelajahi katalog. Sewa pertamamu menanti!",
      side: "top",
      align: "center",
    },
  },
]

/* ─── CatalogPage ─────────────────────────────────────────── */
export const catalogSteps = [
  {
    popover: {
      title: "📋 Katalog Sewain",
      description:
        "Temukan ribuan barang siap sewa dari mitra terpercaya. Panduan ini akan membantu kamu menjelajahi katalog.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#catalog-search-form",
    popover: {
      title: "🔍 Cari barang",
      description:
        "Ketik nama barang yang kamu cari dan tekan Cari. Pencarian bersifat real-time dan mencakup nama serta deskripsi barang.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#catalog-filter-sidebar",
    popover: {
      title: "⚙️ Filter & sortir",
      description:
        "Saring barang berdasarkan kategori, kota, urutan harga, atau range harga. Filter aktif ditampilkan sebagai chip di atas grid.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#catalog-results-count",
    popover: {
      title: "📊 Jumlah hasil",
      description:
        "Di sini kamu bisa melihat berapa banyak barang yang sesuai dengan kriteria pencarian dan filter yang aktif.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#catalog-items-grid",
    popover: {
      title: "🛍️ Kartu barang",
      description:
        "Klik gambar atau nama untuk melihat detail lengkap barang. Klik tombol <strong>Sewa</strong> untuk langsung membuat pengajuan sewa.",
      side: "top",
      align: "center",
    },
  },
]

/* ─── UserDashboard ───────────────────────────────────────── */
export const dashboardSteps = [
  {
    popover: {
      title: "👋 Dashboard kamu",
      description:
        "Ini adalah pusat kontrol aktivitas sewamu. Pantau semua transaksi, bayar, dan lihat lokasi pickup dari sini.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#dashboard-metrics-grid",
    popover: {
      title: "📊 Ringkasan aktivitas",
      description:
        "Empat kartu ini menampilkan total pengeluaran, sewa aktif, transaksi menunggu konfirmasi, dan sewa yang sudah selesai.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#dashboard-cta-banner",
    popover: {
      title: "🔖 Status verifikasi",
      description:
        "Pastikan akunmu sudah terverifikasi KTP agar bisa menyewa barang. Klik tombol di sini untuk melengkapi profil jika belum.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#dashboard-rental-section",
    popover: {
      title: "📋 Sewa saya",
      description:
        "Semua transaksi penyewaanmu ada di sini. Gunakan tab filter (Semua, Menunggu, Berlangsung, dll.) untuk menyaring daftar.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#dashboard-rental-tabs",
    popover: {
      title: "🗂️ Filter status",
      description:
        "Klik tab untuk menyaring transaksi berdasarkan statusnya: Menunggu bayar, Disetujui, Berlangsung, Selesai, atau Ditolak.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#dashboard-new-rental-btn",
    popover: {
      title: "➕ Sewa barang baru",
      description:
        "Klik tombol ini untuk langsung pergi ke katalog dan memilih barang yang ingin kamu sewa berikutnya.",
      side: "left",
      align: "start",
    },
  },
]

/* ─── RentalPage ──────────────────────────────────────────── */
export const rentalSteps = [
  {
    popover: {
      title: "📝 Formulir pengajuan sewa",
      description:
        "Halaman ini adalah tempat kamu mengisi detail penyewaan sebelum melakukan pembayaran. Ikuti panduan berikut.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#rental-item-preview",
    popover: {
      title: "📦 Detail barang",
      description:
        "Pastikan barang yang dipilih sudah benar. Kamu bisa melihat nama, harga per hari, dan stok tersedia di sini.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#rental-date-start",
    popover: {
      title: "📅 Tanggal mulai",
      description:
        "Pilih tanggal kamu mulai menyewa barang. Tanggal tidak bisa dipilih sebelum hari ini.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#rental-date-end",
    popover: {
      title: "📅 Tanggal selesai",
      description:
        "Pilih tanggal pengembalian barang. Minimal 1 hari setelah tanggal mulai.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#rental-price-summary",
    popover: {
      title: "💰 Ringkasan harga",
      description:
        "Total harga akan otomatis dihitung berdasarkan jumlah hari × harga per hari. Periksa sebelum lanjut.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#rental-submit-btn",
    popover: {
      title: "✅ Ajukan sewa",
      description:
        "Klik tombol ini untuk mengirim pengajuan sewa. Kamu akan diarahkan ke halaman pembayaran setelah admin menyetujui.",
      side: "top",
      align: "center",
    },
  },
]

/* ─── ProfilePage ─────────────────────────────────────────── */
export const profileSteps = [
  {
    popover: {
      title: "👤 Profil kamu",
      description:
        "Halaman ini menampilkan data pribadi dan status verifikasi akunmu. Kamu perlu melengkapi data di sini untuk bisa menyewa.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#profile-avatar-section",
    popover: {
      title: "🖼️ Foto profil",
      description:
        "Kamu bisa mengunggah foto profil di sini. Foto membantu mitra mengenali identitasmu saat pickup barang.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#profile-info-section",
    popover: {
      title: "✏️ Data pribadi",
      description:
        "Perbarui nama, nomor telepon, dan email di sini. Pastikan data selalu up-to-date.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "#profile-verification-section",
    popover: {
      title: "🪪 Verifikasi KTP",
      description:
        "Unggah foto KTP dan selfie untuk verifikasi identitas. Ini wajib dilakukan agar kamu bisa menyewa barang di Sewain.",
      side: "top",
      align: "center",
    },
  },
]

/* ─── ItemDetailPage ──────────────────────────────────────── */
export const itemDetailSteps = [
  {
    popover: {
      title: "🔎 Detail barang",
      description:
        "Halaman ini menampilkan semua informasi barang yang ingin kamu sewa. Yuk pelajari fiturnya!",
      side: "over",
      align: "center",
    },
  },
  {
    element: "#item-detail-gallery",
    popover: {
      title: "📸 Foto barang",
      description:
        "Geser foto untuk melihat barang dari berbagai sudut. Pastikan kondisi barang sesuai kebutuhanmu.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#item-detail-info",
    popover: {
      title: "📋 Informasi barang",
      description:
        "Cek nama, deskripsi, kategori, stok tersedia, dan harga per hari. Semua informasi penting ada di sini.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "#item-detail-shop",
    popover: {
      title: "🏪 Info penyedia",
      description:
        "Lihat profil mitra penyedia: nama usaha, kota, dan rating. Kamu bisa klik untuk melihat semua barang dari mitra ini.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#item-detail-rent-btn",
    popover: {
      title: "🛒 Sewa sekarang",
      description:
        "Klik tombol ini untuk memulai proses penyewaan. Kamu akan diminta login jika belum masuk.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#item-detail-reviews",
    popover: {
      title: "⭐ Ulasan penyewa",
      description:
        "Baca ulasan dari penyewa sebelumnya untuk membantu memutuskan apakah barang ini cocok untukmu.",
      side: "top",
      align: "center",
    },
  },
]
