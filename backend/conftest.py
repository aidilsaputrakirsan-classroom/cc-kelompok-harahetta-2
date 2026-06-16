"""
conftest.py — Root-level conftest untuk memastikan `backend/` ada di sys.path.
File ini diletakkan di backend/ (satu level di atas tests/).
Dengan adanya file ini, pytest otomatis menambahkan backend/ ke path,
sehingga `from database import ...` dan `from main import app` bisa resolved
baik saat menjalankan pytest maupun oleh IDE (Pylance/Pyright).
"""
