# Git Workflow Guide

## Deskripsi
Dokumen ini menjelaskan standar Git workflow yang digunakan oleh tim dalam mengembangkan aplikasi. Tujuannya adalah agar proses pengembangan berjalan rapi, terstruktur, dan mudah dikelola.

---

## 1. Branch Naming

Penamaan branch menggunakan format: `tipe/deskripsi-singkat`

Semua ditulis dengan huruf kecil dan menggunakan tanda hubung (-).

| Jenis Branch | Kegunaan | Contoh |
|-------------|---------|--------|
| feature/    | Untuk menambahkan fitur baru | feature/login-page |
| fix/        | Untuk perbaikan bug | fix/api-error |
| docs/       | Untuk dokumentasi | docs/update-readme |
| chore/      | Untuk konfigurasi atau maintenance | chore/update-dependencies |
| refactor/   | Untuk perbaikan struktur kode tanpa mengubah fungsi | refactor/cleanup-code |

---

## 2. Commit Convention

Commit menggunakan format Conventional Commits: `tipe: deskripsi singkat`

Contoh:
- feat: add login feature
- fix: resolve token error
- docs: update git workflow guide
- chore: update dependencies

Tujuan:
- Mempermudah membaca history
- Mempermudah tracking perubahan
- Menjaga konsistensi tim

---

## 3. Pull Request Process

Berikut alur kerja menggunakan GitHub Flow yang WAJIB diikuti oleh setiap anggota tim:

### a. Update branch main
Pastikan menggunakan versi terbaru:
- pull origin dari repository sebelum mulai bekerja

### b. Buat branch baru
- Branch dibuat dari `main`
- Gunakan naming convention yang sesuai

Contoh: `- docs/git-workflow-guide`

### c. Kerjakan perubahan
- Tambahkan atau ubah file sesuai tugas
- Pastikan kode atau dokumentasi sesuai standar

### d. Commit perubahan
- Gunakan commit message sesuai convention
- Lakukan commit secara jelas dan terstruktur

### e. Push ke repository
- Upload branch ke GitHub

### f. Buat Pull Request (PR)
- Isi judul sesuai commit
- Tambahkan deskripsi yang menjelaskan perubahan
- Assign diri sendiri sebagai assignee
- Tambahkan minimal 1 reviewer

### g. Setelah Rull Request (PR) 
- Lakukan code review
- Perbaiki jika ada feedback
- Setelah disetujui → lakukan **Squash and Merge**
- Hapus branch setelah merge

---

## 4. Code Review Guidelines

Dalam melakukan code review, perhatikan hal berikut:

### Fungsionalitas
- Apakah fitur berjalan dengan baik?
- Apakah output sudah sesuai?

### Readability
- Apakah kode mudah dibaca?
- Apakah penamaan variabel jelas?

### Best Practices
- Apakah mengikuti standar coding?
- Apakah struktur kode sudah rapi?

### Error Handling
- Apakah sudah menangani error dengan baik?
- Apakah ada kemungkinan bug?

### Security
- Tidak ada hardcoded password atau API key
- Menggunakan environment variable jika diperlukan

---

## 5. Jenis Review Comment

Reviewer diharapkan memberikan minimal 3 jenis komentar:

- **Praise** → Apresiasi bagian yang sudah baik  
- **Suggestion** → Saran perbaikan  
- **Question** → Pertanyaan untuk klarifikasi  

**Note:** Dilarang "LGTM"

---

## 6. CODEOWNERS

File CODEOWNERS digunakan untuk menentukan reviewer otomatis berdasarkan file yang diubah.

Contoh pembagian:
- /backend → Lead Backend
- /frontend → Lead Frontend
- docker-compose.yml → Lead DevOps
- /docs → Lead QA & Docs

Tujuan:
- Memastikan setiap bagian direview oleh orang yang tepat
- Mempercepat proses review

---

## 7. Aturan Tambahan

- Tidak diperbolehkan push langsung ke branch `main`
- Semua perubahan harus melalui Pull Request
- Minimal 1 approval sebelum merge
- Gunakan **Squash and Merge** untuk menjaga history tetap rapi