# Laporan Pengujian Lingkungan Produksi (Milestone 2)

Berikut adalah tabel perbandingan status fitur antara lingkungan lokal (*Development*) dan lingkungan cloud (*Production*):

| ID | Skenario Uji (Smoke Test) | Dev (Local) | Prod (Railway) | Status | Catatan / Error Log |
|---|---|---|---|---|---|
| 1 | Akses URL Frontend | ✅ Pass | ✅ Pass | **PASSED** | Halaman termuat < 2 detik, tidak ada blank page. |
| 2 | Akses Backend `/health` | ✅ Pass | ✅ Pass | **PASSED** | Mengembalikan status `"healthy"` & database `"connected"`. |
| 3 | Registrasi Akun Baru | ✅ Pass | ✅ Pass | **PASSED** | Berhasil membuat user baru |
| 4 | Login Pengguna | ✅ Pass | ✅ Pass | **PASSED** | Berhasil login |
| 5 | Tambah Item Baru (Create) | ✅ Pass | ✅ Pass | **PASSED** | Item "lensa kamera" berhasil disimpan. |
| 6 | Lihat Daftar Item (Read) | ✅ Pass | ✅ Pass | **PASSED** | Data langsung muncul di dashboard |
| 7 | Ubah Data Item (Update) | ✅ Pass | ✅ Pass | **PASSED** | Mengubah harga item berhasil diperbarui secara *real-time*. |
| 8 | Hapus Item (Delete) | ✅ Pass | ✅ Pass | **PASSED** | Item berhasil dihapus atau dinonaktifkan dan hilang dari tabel dashboard. |
| 9 | Cari Item (Search) | ✅ Pass | ✅ Pass | **PASSED** | Item yang dicari berhasil tampil di dashboard. |