// Gateway URL — semua request melalui Nginx API Gateway (http://localhost di production)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ==================== TOKEN MANAGEMENT ====================
let authToken = null

export function setToken(token) { authToken = token }
export function getToken() { return authToken }
export function clearToken() { authToken = null }

function authHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra }
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`
  return headers
}

function authOnlyHeaders() {
  const headers = {}
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`
  return headers
}

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

async function handleResponse(response) {
  if (response.status === 401) { clearToken(); throw new Error("Sesi habis, silakan login kembali") }
  // Handle service unavailable (microservice down)
  if (response.status === 503 || response.status === 504) {
    throw new Error("Service temporarily unavailable. Please try again later.")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(extractErrorMessage(error, response.status))
  }
  if (response.status === 204) return null
  return response.json()
}

// Wrapper fetch dengan deteksi network/connection error
async function apiFetch(url, options = {}) {
  try {
    return await fetch(url, options)
  } catch (err) {
    // Network error atau service down total
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Service temporarily unavailable. Please check your connection.")
    }
    throw err
  }
}

// ==================== AUTH API ====================
export async function register(userData) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return handleResponse(res)
}

export async function login(email, password) {
  const formData = new URLSearchParams()
  formData.append("username", email)
  formData.append("password", password)
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  })
  const data = await handleResponse(res)
  setToken(data.access_token)
  return data
}

export async function verifyEmail(token) {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  return handleResponse(res)
}

export async function resendVerification(email) {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return handleResponse(res)
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return handleResponse(res)
}

export async function resetPassword(token, new_password) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  })
  return handleResponse(res)
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function updateMe(data) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`)
    const data = await res.json()
    return data.status === "healthy"
  } catch { return false }
}

export async function fetchPublicStats() {
  const res = await fetch(`${API_URL}/stats/public`)
  return handleResponse(res)
}

// ==================== CATEGORIES API ====================
export async function fetchCategories() {
  const res = await fetch(`${API_URL}/categories`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createCategory(data) {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function updateCategory(id, data) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE", headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

// ==================== ITEMS API ====================
export async function fetchItems(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.append("search", params.search)
  if (params.category_id) q.append("category_id", params.category_id)
  if (params.status) q.append("status", params.status)
  if (params.city) q.append("city", params.city)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/items?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchItemCities() {
  const res = await fetch(`${API_URL}/items/cities`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createItem(data) {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function updateItem(id, data) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function deleteItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE", headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

// ==================== ADMIN ITEMS ====================
export async function fetchMyItems(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.append("search", params.search)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/admin/items?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

// ==================== ADMIN PROFILE ====================
export async function fetchAdminProfile() {
  const res = await fetch(`${API_URL}/admin/profile`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createAdminProfile(data) {
  const res = await fetch(`${API_URL}/admin/profile`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function updateAdminProfile(data) {
  const res = await fetch(`${API_URL}/admin/profile`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// ==================== USER PROFILE ====================
export async function fetchProfile() {
  const res = await fetch(`${API_URL}/profile`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function updateProfile(data) {
  const res = await fetch(`${API_URL}/profile`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// ==================== RENTALS API ====================
export async function fetchMyRentals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/rentals/my?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchRental(id) {
  const res = await fetch(`${API_URL}/rentals/${id}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createRental(data) {
  const res = await fetch(`${API_URL}/rentals`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function fetchAdminRentals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 50)
  const res = await fetch(`${API_URL}/admin/rentals?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function updateRentalStatus(id, data) {
  const res = await fetch(`${API_URL}/rentals/${id}/status`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// Ambil info lokasi pickup untuk rental tertentu (setelah sedang_disewa)
export async function fetchRentalPickupInfo(rentalId) {
  const res = await fetch(`${API_URL}/rentals/${rentalId}/pickup`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

// Admin konfirmasi barang sudah diambil penyewa
export async function confirmPickup(rentalId) {
  const res = await fetch(`${API_URL}/rentals/${rentalId}/confirm-pickup`, {
    method: "PUT", headers: authHeaders(),
  })
  return handleResponse(res)
}

// User request pengembalian barang ke admin
export async function requestReturn(rentalId) {
  const res = await fetch(`${API_URL}/rentals/${rentalId}/request-return`, {
    method: "POST", headers: authHeaders(),
  })
  return handleResponse(res)
}

// ==================== ADMIN PAYMENT INFO (public) ====================
export async function fetchAdminPaymentInfo(adminId) {
  const res = await fetch(`${API_URL}/admins/${adminId}/payment-info`)
  return handleResponse(res)
}

// ==================== SHOP / TOKO (public) ====================
export async function fetchShop(adminId) {
  const res = await fetch(`${API_URL}/admins/${adminId}/shop`)
  return handleResponse(res)
}

export async function fetchShopItems(adminId, params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.append("search", params.search)
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 24)
  const res = await fetch(`${API_URL}/admins/${adminId}/items?${q}`)
  return handleResponse(res)
}

export async function fetchShopReviews(adminId, params = {}) {
  const q = new URLSearchParams()
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/admins/${adminId}/reviews?${q}`)
  return handleResponse(res)
}

// ==================== REVIEWS (item & rental) ====================
export async function fetchItemReviews(itemId, params = {}) {
  const q = new URLSearchParams()
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/items/${itemId}/reviews?${q}`)
  return handleResponse(res)
}

export async function fetchRentalReview(rentalId) {
  const res = await fetch(`${API_URL}/rentals/${rentalId}/review`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createRentalReview(rentalId, { rating, komentar }) {
  const res = await fetch(`${API_URL}/rentals/${rentalId}/review`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rating, komentar }),
  })
  return handleResponse(res)
}

export async function updateReview(reviewId, { rating, komentar }) {
  const body = {}
  if (rating !== undefined) body.rating = rating
  if (komentar !== undefined) body.komentar = komentar
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function deleteReview(reviewId) {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

// ==================== PAYMENTS API ====================
export async function fetchMyPayments(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 50)
  const res = await fetch(`${API_URL}/payments/my?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchPayment(paymentId) {
  const res = await fetch(`${API_URL}/payments/${paymentId}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function createPaymentForRental(rentalId, data = {}) {
  const res = await fetch(`${API_URL}/payments/rentals/${rentalId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rental_id: rentalId, metode_pembayaran: "transfer", ...data }),
  })
  return handleResponse(res)
}

export async function uploadPaymentProof(paymentId, { bukti_pembayaran, catatan }) {
  const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status: "completed", bukti_pembayaran, catatan: catatan || undefined }),
  })
  return handleResponse(res)
}

export async function fetchAdminPayments(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 50)
  const res = await fetch(`${API_URL}/admin/payments?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function confirmPayment(paymentId, statusVal) {
  const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status: statusVal }),
  })
  return handleResponse(res)
}

// ==================== MIDTRANS PAYMENT GATEWAY ====================
export async function chargeMidtransForRental(rentalId) {
  const res = await fetch(`${API_URL}/payments/rentals/${rentalId}/charge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  })
  return handleResponse(res)
}

export async function syncMidtransPayment(paymentId) {
  const res = await fetch(`${API_URL}/payments/${paymentId}/sync`, {
    method: "POST",
    headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

export async function fetchMidtransConfig() {
  const res = await fetch(`${API_URL}/payments/config/public`)
  return handleResponse(res)
}

// ==================== SUPER ADMIN ====================
export async function fetchPlatformStats() {
  const res = await fetch(`${API_URL}/superadmin/stats`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchAllUsers(params = {}) {
  const q = new URLSearchParams()
  if (params.role) q.append("role", params.role)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 50)
  const res = await fetch(`${API_URL}/superadmin/users?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_URL}/superadmin/users/${id}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function deleteUser(id) {
  const res = await fetch(`${API_URL}/superadmin/users/${id}`, {
    method: "DELETE", headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

export async function fetchPendingVerifications() {
  const res = await fetch(`${API_URL}/superadmin/verifications`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function verifyUser(userId, data) {
  const res = await fetch(`${API_URL}/superadmin/users/${userId}/verify`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function fetchAllRentals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 50)
  const res = await fetch(`${API_URL}/superadmin/rentals?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

// ==================== CHATBOT AI ====================
export async function sendChatMessage(message, history = []) {
  const res = await fetch(`${API_URL}/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  })
  return handleResponse(res)
}

// ==================== WALLET & WITHDRAWAL ====================
export async function fetchWallet() {
  const res = await fetch(`${API_URL}/admin/wallet`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchWalletTransactions(params = {}) {
  const q = new URLSearchParams()
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/admin/wallet/transactions?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function requestWithdrawal(data) {
  const res = await fetch(`${API_URL}/admin/wallet/withdraw`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function fetchMyWithdrawals(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.append("status", params.status)
  q.append("skip", params.skip ?? 0)
  q.append("limit", params.limit ?? 20)
  const res = await fetch(`${API_URL}/admin/wallet/withdrawals?${q}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}