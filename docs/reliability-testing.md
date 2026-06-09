# RELIABILITY TESTING

Dokumen ini menjelaskan strategi dan skenario pengujian **ketahanan (reliability)** sistem microservices Sewain: bagaimana sistem berperilaku saat salah satu service gagal, lambat, atau pulih kembali. Tujuannya memastikan kegagalan satu service **tidak menjatuhkan seluruh sistem** (mencegah *cascading failure*).

## 1. Ringkasan Mekanisme Ketahanan

Setiap service yang bergantung pada Auth Service (Item, Rental, Payment, Chat) memanggilnya lewat `auth_client.py` yang dilengkapi tiga lapis pertahanan:

| Mekanisme | Implementasi | Parameter |
| --------- | ------------ | --------- |
| **Retry + Exponential Backoff** | `auth_client._call_auth_service()` | `MAX_RETRIES=3`, delay `0.5s → 1s → 2s`, `TIMEOUT_SECONDS=5.0` |
| **Circuit Breaker** | `circuit_breaker.CircuitBreaker` | `failure_threshold=5`, `cooldown_seconds=30` |
| **Graceful Degradation** | `auth_client.verify_token_optional()` | Mode terbatas saat Auth down / circuit OPEN |

**Aturan retry** (hanya error transient yang di-retry):

| Kondisi | Retry? | Alasan |
| ------- | ------ | ------ |
| `ConnectError` (service down) | Ya | Service mungkin sedang restart |
| `TimeoutException` | Ya | Network mungkin sementara lambat |
| HTTP 500 / 502 / 503 / 504 | Ya | Error server sementara |
| HTTP 401 Unauthorized | **Tidak** | Token salah — retry tidak memperbaiki |
| HTTP 400 Bad Request | **Tidak** | Data salah — pasti gagal lagi |

**State circuit breaker:**

| State | Perilaku | Dampak ke User |
| ----- | -------- | -------------- |
| `CLOSED` (normal) | Semua request diteruskan ke Auth Service | Normal |
| `OPEN` (tripped) | Request langsung ditolak tanpa memanggil Auth (fail fast → 503) | Error cepat (<100ms), bukan timeout 5s |
| `HALF_OPEN` (testing) | 1 request diizinkan untuk menguji pemulihan | Satu request "probe" |

Transisi: `CLOSED → OPEN` (setelah 5 kegagalan) → `HALF_OPEN` (setelah cooldown 30s) → `CLOSED` (jika probe sukses) atau kembali `OPEN` (jika probe gagal).

---

## 2. Prasyarat Pengujian

```bash
# Jalankan seluruh stack microservices
docker compose up -d

# Pastikan semua container running / healthy
docker compose ps
```

Endpoint dasar untuk verifikasi:

```bash
curl -s http://localhost/health              # Gateway
curl -s http://localhost/auth/health         # Auth Service
curl -s http://localhost/items/health        # Item Service (+ status circuit breaker)
```

---


## 3. Detail Skenario Pengujian

### Skenario 1: Kegagalan Servis Sementara (*Retry Logic*)

**Tujuan** : Pengujian ini bertujuan untuk memastikan bahwa *Item Service* melakukan percobaan ulang (*retry*) ketika *Auth Service* tidak dapat diakses.

**Cara Reproduce**

```bash
# Matikan Auth Service
docker compose stop auth-service

# Kirim request ke endpoint yang butuh auth
curl -i -X GET http://localhost/items -H "Authorization: Bearer dummy-token-123"

# Amati log retry di Item Service
docker compose logs item-service --tail=30
```

**Expected behavior**

- Setelah 3 percobaan (jeda 0.5s, 1s, 2s ≈ total ±3.5s), response `503` dengan pesan `"Auth Service unavailable. Please try again later."`
- Log Item Service menampilkan:
  ```
  Cannot connect to Auth Service (attempt 1/3)
  Retrying in 0.5s...
  Cannot connect to Auth Service (attempt 2/3)
  Retrying in 1.0s...
  Cannot connect to Auth Service (attempt 3/3)
  Auth Service unreachable after 3 attempts
  ```

**Hasil Pengujian**

✅ **PASSED**

---

### Skenario 2: Circuit Breaker Aktif (*Fast-Fail*)

**Tujuan** : Membuktikan setelah 5 kegagalan beruntun, circuit breaker pindah ke `OPEN` dan menolak request secara instan tanpa menunggu timeout.

**Cara Reproduce**

```bash
# Pastikan Auth Service masih mati (lanjutan Skenario 2)
# Kirim 6 request (failure_threshold = 5)
for i in $(seq 1 6); do
  echo "--- Request $i ---"
  curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" \
    http://localhost/items -H "Authorization: Bearer dummy-token-123"
done

# Cek state circuit breaker
curl -s http://localhost/items/health | python3 -m json.tool

# Ukur kecepatan fail-fast
time curl -s -o /dev/null http://localhost/items -H "Authorization: Bearer dummy-token-123"
```

**Expected behavior**

- Request 1–5: lambat (menunggu retry+timeout), tiap kali `record_failure()` dipanggil.
- Setelah kegagalan ke-5: `state: CLOSED → OPEN`.
- Request ke-6 dan berikutnya: **fail fast** `503 "Auth Service circuit breaker OPEN. Try again later."` dalam <100ms (tidak ada timeout 5s).
- Endpoint `/health` menunjukkan status **degraded** dengan *Circuit Breaker* berstatus **OPEN**.

**Hasil Pengujian**

✅ **PASSED**

---

### Skenario 3: Pemulihan Otomatis Circuit Breaker

**Tujuan** : Membuktikan sistem otomatis pulih setelah Auth Service hidup kembali (tanpa restart manual service lain).

**Cara Reproduce**

```bash
# Hidupkan kembali Auth Service
docker compose start auth-service

# Tunggu melewati cooldown circuit breaker (30 detik)
sleep 35

# Request kembali — circuit akan masuk HALF_OPEN lalu CLOSED jika sukses
TOKEN=$(curl -s -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -i -X GET http://localhost/items -H "Authorization: Bearer $TOKEN"

# Periksa status kesehatan sistem melalui endpoint `/health`.
curl -s http://localhost/items/health | python3 -m json.tool
```

**Expected behavior**

- Setelah cooldown 30s, request pertama memicu `OPEN → HALF_OPEN`.
- Jika request berhasil diproses, status berubah kembali menjadi **CLOSED**.
- Sistem kembali beroperasi secara normal dan status kesehatan berubah menjadi **healthy**.
- Log: `Test berhasil! State: HALF_OPEN → CLOSED`.

**Hasil Pengujian**

✅ **PASSED**


---

### Skenario 4: Graceful Degradation

**Tujuan** : Pengujian ini bertujuan untuk memastikan bahwa sebagian fungsi sistem tetap dapat digunakan ketika *Auth Service* mengalami gangguan.

**Cara Reproduce**

```bash
docker compose stop auth-service

# Endpoint publik (tidak butuh auth) — harus tetap jalan
curl -i -X GET http://localhost/items            # katalog publik
curl -i -X GET http://localhost/categories

# Endpoint yang butuh auth (create/update/delete) — harus ditolak
curl -i -X POST http://localhost/items \
  -H "Authorization: Bearer dummy-token-123" \
  -H "Content-Type: application/json" \
  -d '{"nama":"Tenda","harga_sewa":50000}'
```

**Expected behavior**

- Endpoint publik tetap dapat diakses dengan status **200 OK**.
- Endpoint privat ditolak dengan status **503 Service Unavailable**.
- Pengguna tetap dapat mengakses fitur yang tidak bergantung pada layanan autentikasi.

**Hasil Pengujian**

✅ **PASSED**

## 4. Format Health Check

`GET /items/health` mengembalikan status dependency untuk observability:

```json
{
  "status": "healthy",
  "service": "item-service",
  "version": "...",
  "dependencies": {
    "auth-service": {
      "name": "auth-service",
      "state": "CLOSED",
      "failure_count": 0,
      "failure_threshold": 5,
      "total_rejected": 0,
      "cooldown_seconds": 30
    }
  }
}
```

Interpretasi:
- `status: "healthy"` → circuit breaker `CLOSED`.
- `status: "degraded"` → circuit breaker `OPEN`/`HALF_OPEN` (Auth bermasalah, tetapi service tetap hidup).

---

## 5. Conclusion

Berdasarkan pengujian yang dilakukan, sistem microservices Sewain berhasil memenuhi aspek reliability. Mekanisme Retry, Circuit Breaker, dan Graceful Degradation bekerja sesuai harapan dalam menangani gangguan pada Auth Service, mencegah cascading failure, serta mendukung pemulihan layanan secara otomatis. Seluruh skenario pengujian dinyatakan PASSED, sehingga sistem dinilai memiliki ketahanan yang baik terhadap kegagalan layanan.