# UI & API INTEGRATION TESTING

Berikut adalah hasil pengujian integrasi antara Frontend (React) dan Backend (FastAPI) berdasarkan 10 skenario pengujian utama pada platform Sewain:

1. **Status API**  
   Langkah uji: Membuka dashboard dan memastikan sidebar serta konten termuat (API terhubung).  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Status API](img/uitest/1.png)

2. **Sync Data**  
   Langkah uji: Memastikan item "kamera sony" dari database muncul otomatis di Katalog.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Sync Data](img/uitest/2.png)

3. **Create Item (Form)**  
   Langkah uji: Menekan tombol "+ Tambah Barang Baru" dan memastikan modal form muncul.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Create Item](img/uitest/3.png)

4. **Upload & Preview**  
   Langkah uji: Mengisi data barang lengkap serta mengunggah foto barang.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Upload Preview](img/uitest/4.png)

5. **Read (Post-Create)**  
   Langkah uji: Memastikan item yang baru ditambah muncul di "Daftar Barang Saya" pada Admin Panel.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Read Post Create](img/uitest/5.png)

6. **Edit Mode**  
   Langkah uji: Klik tombol icon ✏️ (Edit) dan memastikan form terisi data lama secara otomatis.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Edit Mode](img/uitest/6.png)

7. **Update Data**  
   Langkah uji: Mengubah informasi barang (harga/stok) dan menyimpan perubahan ke database.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Update Data](img/uitest/7.png)

8. **Search Feature**  
   Langkah uji: Mencari barang spesifik menggunakan Search Bar pada menu Katalog.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Search Feature](img/uitest/8.png)

9. **Delete Action**  
   Langkah uji: Menekan icon 🗑️ (Hapus) dan melakukan konfirmasi penghapusan data.  
   Status: 🟢 PASS  

   **Bukti Screenshot Pengujian**  
   ![Delete Action](img/uitest/9.png)

10. **Empty State**  
    Langkah uji: Memastikan tampilan UI merespon dengan benar saat seluruh data barang dihapus.  
    Status: 🟢 PASS  

    **Bukti Screenshot Pengujian**  
    ![Empty State](img/uitest/10.png)