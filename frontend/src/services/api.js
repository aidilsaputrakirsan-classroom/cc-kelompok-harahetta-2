const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ==================== TOKEN MANAGEMENT ====================

let authToken = null

export function setToken(token) {
  authToken = token
}

export function getToken() {
  return authToken
}

export function clearToken() {
  authToken = null
}

function authHeaders() {
  const headers = {}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

// Helper: extract error message from various formats
function extractErrorMessage(error, statusCode) {
  if (!error) return `Request gagal (${statusCode})`
  
  // Handle string detail
  if (typeof error.detail === 'string') {
    return error.detail
  }
  
  // Handle array of validation errors (FastAPI format)
  if (Array.isArray(error.detail)) {
    return error.detail
      .map(e => e.msg || e.message || JSON.stringify(e))
      .join(', ')
  }
  
  // Handle object detail
  if (typeof error.detail === 'object') {
    return error.detail.message || error.detail.msg || JSON.stringify(error.detail)
  }
  
  // Handle message field
  if (error.message) return error.message
  
  return `Request gagal (${statusCode})`
}

// Helper: handle response errors
async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    throw new Error("UNAUTHORIZED")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(extractErrorMessage(error, response.status))
  }
  // 204 No Content
  if (response.status === 204) return null
  return response.json()
}

// ==================== AUTH API ====================

export async function register(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return handleResponse(response)
}

export async function login(email, password) {
  // Backend uses OAuth2PasswordRequestForm which requires form-urlencoded
  const formData = new URLSearchParams()
  formData.append("username", email)  // OAuth2 uses "username" field
  formData.append("password", password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  })
  const data = await handleResponse(response)
  setToken(data.access_token)
  return data
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== ITEMS API ====================

export async function fetchItems(search = "", skip = 0, limit = 20) {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("skip", skip)
  params.append("limit", limit)

  const response = await fetch(`${API_URL}/items?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createItem(itemData) {
  const response = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function updateItem(id, itemData) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}