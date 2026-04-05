# 🐳 Perbandingan Ukuran Docker Base Image — Sewain 

> **Konteks:** Laporan ini disusun untuk menganalisis perbedaan ukuran pada beberapa varian Docker image Python 3.12 yang digunakan dalam pengembangan backend. Analisis ini bertujuan untuk memahami efisiensi penggunaan storage serta menentukan base image yang paling sesuai untuk kebutuhan project.

---

## 📝 Dokumentasi

![Hasil Docker Images](img/imgw5/ukuranimage.jpeg)

Perintah yang digunakan dalam proses dokumentasi antara lain:

```bash
docker pull python:3.12
docker pull python:3.12-slim
docker pull python:3.12-alpine

docker images

---

## 📊 Hasil Perbandingan

Berdasarkan hasil pengecekan pada terminal tim, berikut perbandingan ukuran beberapa varian base image Python 3.12:

| Repository / Tag    | Disk Usage       | Content Size |
|---------------------|------------------|--------------|
| python:3.12         | 1.62 GB          | 428 MB       |
| python:3.12-slim    | 179 MB           | 45.4 MB      |
| python:3.12-alpine  | 75 MB            | 18.7 MB      |

---

## 🔍 Analisis Perbandingan

Berdasarkan data di atas, terlihat bahwa varian `python:3.12` memiliki ukuran paling besar. Meskipun ukuran saat diunduh sebesar 428 MB, setelah diekstrak ukurannya meningkat menjadi 1.62 GB. Hal ini menunjukkan bahwa image tersebut mengandung banyak library dan tools tambahan.

Sementara itu, varian `python:3.12-slim` dan `python:3.12-alpine` lebih efisien, baik dari segi ukuran unduhan maupun penggunaan ruang penyimpanan. Varian slim memiliki ukuran yang lebih kecil dengan stabilitas yang tetap terjaga, sedangkan alpine merupakan varian dengan ukuran paling ringan.

Jika dibandingkan dengan image standar, penggunaan `python:3.12-slim` mampu menghemat ruang penyimpanan secara signifikan, yaitu sekitar 89%.

Selain itu, selisih antara content size dan disk usage menunjukkan adanya proses ekstraksi layer Docker yang cukup besar. Hal ini berarti semakin besar image, semakin besar pula penggunaan resource pada saat container dijalankan.

Ukuran yang lebih kecil tidak hanya menghemat storage, tetapi juga dapat meningkatkan efisiensi dalam proses deployment dan pengelolaan container.

Selain faktor ukuran, pemilihan base image juga berpengaruh terhadap kompatibilitas sistem. Varian alpine menggunakan sistem berbasis musl libc, sehingga beberapa library Python dapat mengalami kendala saat instalasi. Hal ini menjadi salah satu alasan mengapa varian slim lebih sering digunakan dalam pengembangan aplikasi.

---

## ⚙️ Analisis Efisiensi dan Dampak Cloud

Ukuran Docker image yang lebih kecil memberikan dampak langsung terhadap performa sistem, khususnya dalam lingkungan cloud. Image yang lebih ringan akan mempercepat proses *pull image* dari registry ke server, sehingga waktu deployment menjadi lebih singkat.

Selain itu, penggunaan storage pada layanan cloud juga menjadi lebih hemat. Hal ini penting terutama jika aplikasi di-deploy dalam jumlah container yang banyak atau menggunakan sistem autoscaling.

Dari sisi keamanan, image yang lebih kecil cenderung memiliki lebih sedikit komponen yang tidak diperlukan, sehingga dapat mengurangi potensi celah keamanan (*attack surface*).

---

## 🏆 Kesimpulan

Berdasarkan analisis yang dilakukan, penggunaan `python:3.12-slim` merupakan pilihan yang paling tepat. Meskipun varian alpine memiliki ukuran yang lebih kecil, varian slim lebih stabil dan kompatibel dengan berbagai library Python tanpa memerlukan konfigurasi tambahan yang kompleks.

Penggunaan image yang lebih kecil memberikan beberapa keuntungan, seperti mempercepat proses deployment, menghemat penggunaan penyimpanan di cloud, serta mengurangi risiko keamanan.
