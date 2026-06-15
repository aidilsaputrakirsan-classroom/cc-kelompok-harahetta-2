# Reflection Paper Analitis — Lead Frontend
**Mata Kuliah:** Komputasi Awan (Cloud Computing)  
**Nama:** Achmad Zaki Zaidan  
**NIM:** 10231002  
**Peran:** Lead Frontend  
**Proyek:** Sewain — Platform Sewa Barang Online  

---

## 1. Pendahuluan dan Tanggung Jawab
Dalam pengembangan platform **Sewain**, peran Frontend bertanggung jawab atas seluruh antarmuka pengguna (User Interface) yang menjadi titik kontak utama antara sistem dan pengguna akhir. Sebagai Lead Frontend, tanggung jawab utama saya meliputi:
*   Merancang dan mengimplementasikan **arsitektur aplikasi React SPA** (Single Page Application) menggunakan Vite sebagai build tool, React Router untuk navigasi, dan TailwindCSS untuk sistem desain yang konsisten di seluruh 22 halaman aplikasi.
*   Membangun **service layer dan state management** yang robust melalui React Context API (`AuthContext`, `ServiceStatusContext`, `ThemeContext`) dan custom hooks (`useServiceCall`, `useTour`) untuk mengelola autentikasi, status layanan microservices, dan pengalaman pengguna secara terpusat.
*   Mengintegrasikan **komunikasi real-time** via WebSocket untuk fitur live chat antara penyewa dan penyedia barang, termasuk mekanisme auto-reconnect dengan exponential backoff dan presence system untuk indikator online/offline.
*   Menghubungkan frontend dengan **60+ endpoint REST API** backend dan layanan eksternal (Midtrans Payment Gateway, Leaflet Maps, Gemini AI Chatbot) secara aman dan efisien.

Secara analitis, fokus saya bukan sekadar membuat UI yang fungsional, melainkan bagaimana antarmuka dapat bersifat *resilient* terhadap kegagalan layanan backend (graceful degradation), responsif di berbagai ukuran perangkat, dan memberikan umpan balik yang jelas kepada pengguna di setiap tahapan interaksi, mulai dari registrasi hingga penyelesaian transaksi pembayaran.

---

## 2. Analisis Keputusan Teknis dan Arsitektur

### A. Arsitektur Komponen dan Routing Berbasis Peran (Role-Based Layout)
Keputusan arsitektural yang fundamental dalam frontend **Sewain** adalah pemisahan layout berdasarkan peran pengguna. Aplikasi menggunakan tiga layout utama yang dipilih secara dinamis berdasarkan status autentikasi dan role user:

1.  **`PublicLayout`** — Untuk pengunjung yang belum login, menampilkan navbar publik dengan navigasi ke Beranda, Katalog, Status, Tentang, dan halaman Login.
2.  **`AdminLayout`** — Untuk Admin dan Super Admin yang sudah terautentikasi, menggunakan sidebar navigasi untuk akses cepat ke dashboard, manajemen barang, rental, pembayaran, dan panel administrasi.
3.  **`UserLayout`** — Untuk user reguler (penyewa) yang sudah login, menggunakan top navbar dengan menu kontekstual.

```jsx
// App.jsx — Route splitting berdasarkan role
<Route path="/*" element={
  !isAuthenticated
    ? <Navigate to="/login" replace />
    : isStaff
      ? <AdminLayout addToast={addToast} />
      : <UserAppLayout addToast={addToast} />
} />
```

Keputusan ini memastikan bahwa setiap peran mendapatkan navigasi dan akses fitur yang relevan tanpa memuat komponen yang tidak diperlukan. Route protection diimplementasikan melalui tiga komponen guard: `RequireAuth`, `RequireAdmin`, dan `RequireSuperAdmin`, masing-masing memvalidasi status autentikasi dan role sebelum merender konten halaman.

### B. Service Layer dengan Resiliensi terhadap Kegagalan Microservices
Salah satu kontribusi teknis terpenting adalah perancangan **service layer** yang mampu mendeteksi dan menangani kegagalan layanan backend. Saya mengimplementasikan tiga lapisan pertahanan:

1.  **`ServiceUnavailableError` (Custom Error Class):** Error class khusus yang dilempar ketika API mengembalikan status HTTP 503/504 atau terjadi network error. Error ini membawa metadata (`statusCode`, `serviceName`) agar komponen UI dapat menampilkan pesan yang kontekstual:
    ```javascript
    // api.js — Custom error dengan metadata service
    export class ServiceUnavailableError extends Error {
      constructor(message, { statusCode = 503, serviceName = "unknown" } = {}) {
        super(message)
        this.name = "ServiceUnavailableError"
        this.statusCode = statusCode
        this.serviceName = serviceName
        this.isServiceUnavailable = true
      }
    }
    ```

2.  **`ServiceStatusContext` (Global Service Registry):** React Context yang menyimpan status semua microservices secara global. Ketika satu layanan terdeteksi down, seluruh aplikasi dapat merespons — misalnya menampilkan banner peringatan di bagian atas halaman tanpa menghancurkan sesi pengguna:
    ```javascript
    // ServiceStatusContext.jsx — Global store status service
    const [downServices, setDownServices] = useState(new Set())
    const markServiceDown = (serviceName) => { /* tambah ke Set */ }
    const markServiceUp = (serviceName) => { /* hapus dari Set */ }
    ```

3.  **`useServiceCall` (Custom Hook):** Hook yang membungkus setiap panggilan API dan secara otomatis mendeteksi `ServiceUnavailableError`, menandai service yang bermasalah ke context global, dan menyediakan mekanisme retry bawaan. Komponen yang menggunakan hook ini tidak perlu menulis logika deteksi error berulang:
    ```javascript
    const { data, loading, error, isUnavailable, execute, retry } = useServiceCall(fetchItems, "items")
    // Jika isUnavailable === true → tampilkan <ServiceUnavailableError onRetry={retry} />
    ```

Pendekatan ini memastikan bahwa ketika salah satu microservice mengalami downtime, pengguna tetap dapat mengakses bagian aplikasi lain yang tidak bergantung pada service tersebut — prinsip *partial availability* yang esensial dalam arsitektur cloud terdistribusi.

### C. Integrasi Pembayaran Midtrans (Snap.js)
Integrasi frontend dengan Midtrans Payment Gateway memerlukan penanganan khusus karena Snap.js adalah library eksternal yang dimuat via `<script>` tag di `index.html`. Saya merancang helper module `midtrans.js` yang menangani:

*   **Dynamic Client Key Loading:** Client key tidak di-hardcode, melainkan diambil secara dinamis dari environment variable atau endpoint backend `/payments/config/public`. Ini memungkinkan rotasi key tanpa rebuild aplikasi:
    ```javascript
    async function getClientKey() {
      const fromEnv = import.meta.env?.VITE_MIDTRANS_CLIENT_KEY
      if (fromEnv && !fromEnv.includes("REPLACE_ME")) return fromEnv
      const cfg = await fetchMidtransConfig()
      return cfg?.client_key || ""
    }
    ```

*   **Readiness Polling:** Fungsi `ensureSnapReady()` menunggu hingga `window.snap` tersedia (maksimum 5 detik) sebelum membuka popup pembayaran, mencegah race condition antara pemuatan script dan eksekusi kode.

### D. Komunikasi Real-Time via WebSocket
Fitur live chat antara penyewa dan penyedia barang diimplementasikan menggunakan WebSocket dengan arsitektur yang robust:

*   **Auto-Reconnect dengan Exponential Backoff:** Jika koneksi WebSocket terputus (misalnya karena ketidakstabilan jaringan atau restart server), client secara otomatis mencoba menyambung kembali dengan jeda waktu yang meningkat secara eksponensial (1s, 2s, 4s, ..., maks 15s). Ini mencegah server dibanjiri koneksi ulang secara bersamaan:
    ```javascript
    const scheduleReconnect = () => {
      retry += 1
      const delay = Math.min(1000 * 2 ** Math.min(retry, 5), 15000)
      reconnectTimer = setTimeout(connect, delay)
    }
    ```

*   **Ping Keepalive (25 detik):** Untuk mencegah reverse proxy (Nginx) memutuskan koneksi WebSocket yang dianggap idle, client mengirim pesan `{"type":"ping"}` setiap 25 detik.

*   **Presence Socket:** Selain chat socket per-room, saya mengimplementasikan **presence WebSocket** global yang berjalan selama user terautentikasi (`PresenceManager` component). Socket ini memberitahu server bahwa user sedang online, sehingga indikator kehadiran dapat ditampilkan kepada admin/penyedia barang secara real-time.

*   **Smart Close Codes:** Koneksi WebSocket tidak di-reconnect jika server menutup dengan kode 4401 (unauthorized), 4403 (forbidden), atau 4404 (not found) — ini menghindari retry loop yang sia-sia untuk error yang bersifat permanen.

---

## 3. Tantangan Teknis, Analisis Masalah, dan Solusi

### Masalah 1: Race Condition pada Autentikasi saat Service Down
**Gejala:** Ketika auth service mengalami downtime sementara, `AuthContext` gagal memverifikasi token yang tersimpan di `localStorage` melalui endpoint `/auth/me`. Perilaku awal: user langsung di-logout dan token dihapus, meskipun token sebenarnya masih valid — server hanya sedang tidak dapat dijangkau.

**Analisis:** `AuthContext` tidak membedakan antara "token tidak valid" (HTTP 401) dan "server tidak dapat dijangkau" (HTTP 503/network error). Keduanya menghasilkan error yang sama di `catch` block, sehingga logika fallback selalu menghapus sesi pengguna.

**Solusi:** Saya menerapkan **differential error handling** di `AuthContext` yang membedakan dua kasus:
```javascript
// AuthContext.jsx — Graceful degradation saat service down
getMe()
  .then((me) => {
    setUser(me)
    markServiceUp("auth")
  })
  .catch((err) => {
    if (isServiceUnavailableError(err)) {
      // Auth service down — JANGAN logout, gunakan cached user
      markServiceDown("auth")
    } else {
      // Token expired/invalid — barulah logout
      clearToken()
      setUser(null)
      localStorage.removeItem("sewain_token")
    }
  })
```
Dengan pendekatan ini, sesi pengguna tetap bertahan menggunakan data cache di `localStorage` saat server tidak tersedia. Banner peringatan (`AuthDownBanner`) ditampilkan untuk menginformasikan kondisi layanan, lengkap dengan tombol retry yang memanggil `checkAuthHealth()` untuk mengecek pemulihan service.

### Masalah 2: Inkonsistensi Format Response API dan Error Handling
**Gejala:** Berbagai endpoint backend mengembalikan format error yang tidak seragam — ada yang mengembalikan `{ detail: "string" }`, ada yang `{ detail: [{ msg: "..." }] }` (validasi Pydantic), dan ada juga `{ detail: { message: "..." } }`. Hal ini menyebabkan pesan error yang ditampilkan ke pengguna sering kali berupa `[object Object]` atau JSON mentah yang tidak informatif.

**Analisis:** FastAPI menggunakan format error yang berbeda tergantung sumber error: validasi Pydantic (array of objects), HTTPException manual (string), dan error middleware (nested object). Frontend harus mengakomodasi semua format ini.

**Solusi:** Saya membangun fungsi `extractErrorMessage()` yang secara rekursif menangani ketiga format response error:
```javascript
function extractErrorMessage(error, statusCode) {
  if (!error) return `Request gagal (${statusCode})`
  if (typeof error.detail === "string") return error.detail
  if (Array.isArray(error.detail))
    return error.detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ")
  if (typeof error.detail === "object")
    return error.detail.message || error.detail.msg || JSON.stringify(error.detail)
  if (error.message) return error.message
  return `Request gagal (${statusCode})`
}
```
Fungsi ini digunakan secara terpusat di `handleResponse()`, sehingga seluruh 60+ endpoint API menghasilkan pesan error yang konsisten dan human-readable di sisi pengguna.

### Masalah 3: Integrasi Midtrans Snap.js — Script Loading dan CSP Conflict
**Gejala:** Popup pembayaran Midtrans sesekali tidak muncul saat pengguna mengklik tombol "Bayar Sekarang". Console browser menampilkan error `window.snap is undefined` meskipun script tag Snap.js sudah ada di `index.html`.

**Analisis:** Dua faktor penyebab:
1.  **Timing Issue:** Kode pembayaran dieksekusi sebelum script Snap.js selesai dimuat, terutama pada koneksi lambat atau saat pertama kali mengunjungi halaman payment.
2.  **Client Key Belum Diset:** Atribut `data-client-key` pada script tag masih kosong karena nilai client key didapat secara asinkron dari backend config endpoint.

**Solusi:** Saya mengimplementasikan **polling readiness check** dengan timeout pada fungsi `ensureSnapReady()`:
```javascript
export async function ensureSnapReady() {
  const clientKey = await getClientKey()
  const script = document.getElementById("midtrans-snap-script")
  if (script && clientKey) {
    script.setAttribute("data-client-key", clientKey)
  }
  // Polling sampai window.snap tersedia (maks 5 detik)
  const maxWait = 5000
  const start = Date.now()
  while (typeof window.snap === "undefined") {
    if (Date.now() - start > maxWait) {
      throw new Error("Snap.js Midtrans tidak berhasil dimuat.")
    }
    await new Promise(r => setTimeout(r, 100))
  }
}
```
Fungsi ini dipanggil sebelum setiap `snap.pay()`, memastikan baik script maupun client key sudah siap. Jika gagal dalam 5 detik, error dilempar dan ditangani oleh `ErrorBoundary` untuk menampilkan pesan yang informatif kepada pengguna.

---

## 4. Refleksi Pembelajaran dan Kolaborasi

Proyek **Sewain** memberikan pemahaman praktis yang mendalam mengenai prinsip-prinsip rekayasa frontend modern yang sebelumnya hanya saya pelajari secara teoritis:
*   **Component Architecture & Reusability:** Saya belajar merancang 21+ komponen reusable (dari `ItemCard`, `ReviewForm`, `ConfirmDialog`, hingga `ServiceUnavailableError`) yang masing-masing memiliki tanggung jawab tunggal (*Single Responsibility Principle*). Dengan pemisahan komponen yang ketat, perubahan di satu fitur tidak menimbulkan efek samping di fitur lain.
*   **State Management Pattern:** Penggunaan React Context API untuk state global (autentikasi, tema, status service) dikombinasikan dengan local state di tingkat komponen mengajarkan pentingnya memilih *scope* state yang tepat. State yang terlalu global menyebabkan re-render berlebihan, sementara state yang terlalu lokal menyulitkan komunikasi antar-komponen.
*   **Resilient Frontend Engineering:** Membangun mekanisme graceful degradation saat backend service down merupakan pembelajaran paling berharga. Di lingkungan cloud dengan arsitektur microservices, frontend tidak boleh berasumsi bahwa semua service selalu tersedia. Pattern `ServiceUnavailableError` → `useServiceCall` → `ServiceStatusContext` → `AuthDownBanner` membentuk chain of resilience yang menjaga UX tetap koheren meskipun infrastruktur mengalami gangguan parsial.
*   **Third-Party Integration:** Mengintegrasikan Midtrans Snap.js, Leaflet Maps, Driver.js (guided tour), dan Framer Motion (animasi) mengajarkan pentingnya abstraksi wrapper untuk library eksternal. Dengan membungkus setiap library dalam helper module (`midtrans.js`, `tour.js`, `tourSteps.js`), pembaruan atau penggantian library di masa depan dapat dilakukan tanpa menyentuh komponen UI.

**Kolaborasi Tim:**  
Sebagai Lead Frontend, saya belajar bahwa antarmuka pengguna yang baik merupakan hasil dari komunikasi intensif dengan seluruh anggota tim. Koordinasi dengan Lead Backend (Djaky) mengenai format response API, pagination pattern (`skip` & `limit`), dan error handling contract memastikan integrasi berjalan lancar tanpa asumsi yang salah. Bersama Lead DevOps (Alif), saya berkolaborasi dalam konfigurasi environment variable (`.env.production`) untuk API URL injection, pengaturan Nginx sebagai reverse proxy untuk SPA routing (agar React Router berfungsi di production), serta optimasi build frontend di pipeline CI/CD — di mana proses `npm run build` dijalankan di runner GitHub Actions alih-alih di server produksi untuk menghemat sumber daya VPS. Dengan Lead QA & Docs (Riqqah), kami menyepakati skenario pengujian komponen menggunakan Vitest dan React Testing Library agar setiap komponen kritis memiliki unit test yang memadai.

---

## 5. Kesimpulan
Melalui perancangan arsitektur frontend berbasis komponen yang modular, implementasi service layer yang resilient terhadap kegagalan microservices, integrasi pembayaran dan komunikasi real-time, serta sistem routing berbasis peran yang aman, platform **Sewain** memiliki antarmuka pengguna yang tidak hanya fungsional tetapi juga robust dalam menghadapi ketidakpastian lingkungan cloud terdistribusi. Pengalaman ini membuktikan bahwa frontend modern bukan sekadar lapisan presentasi, melainkan komponen kritis yang harus dirancang dengan prinsip *resilience*, *observability*, dan *security* yang setara dengan backend dan infrastruktur.
