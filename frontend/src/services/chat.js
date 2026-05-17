// ============================================================
// Chat User <-> Admin — REST + WebSocket helpers
// ============================================================
import { getToken } from "./api"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

function authOnlyHeaders() {
  const headers = {}
  const t = getToken()
  if (t) headers["Authorization"] = `Bearer ${t}`
  return headers
}

function authJsonHeaders() {
  return { "Content-Type": "application/json", ...authOnlyHeaders() }
}

async function handleResponse(response) {
  if (response.status === 401) throw new Error("UNAUTHORIZED")
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const detail = err?.detail
    let msg = `Request gagal (${response.status})`
    if (typeof detail === "string") msg = detail
    else if (Array.isArray(detail)) msg = detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
    else if (detail && typeof detail === "object") msg = detail.message || JSON.stringify(detail)
    throw new Error(msg)
  }
  if (response.status === 204) return null
  return response.json()
}

// ────────────────────────────────────────────────────────────
// REST
// ────────────────────────────────────────────────────────────

export async function openChatRoomForItem(itemId) {
  const res = await fetch(`${API_URL}/chat/rooms`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ item_id: itemId }),
  })
  return handleResponse(res)
}

export async function fetchMyChatRooms() {
  const res = await fetch(`${API_URL}/chat/rooms`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchChatRoom(roomId) {
  const res = await fetch(`${API_URL}/chat/rooms/${roomId}`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

export async function fetchChatMessages(roomId, { skip = 0, limit = 100 } = {}) {
  const q = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages?${q}`, {
    headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

export async function sendChatMessage(roomId, body) {
  const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ body }),
  })
  return handleResponse(res)
}

export async function markRoomRead(roomId) {
  const res = await fetch(`${API_URL}/chat/rooms/${roomId}/read`, {
    method: "POST",
    headers: authOnlyHeaders(),
  })
  return handleResponse(res)
}

export async function fetchChatUnreadCount() {
  const res = await fetch(`${API_URL}/chat/unread-count`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}

// ────────────────────────────────────────────────────────────
// WebSocket — auto reconnect + ping keepalive
// ────────────────────────────────────────────────────────────

function buildWsUrl(roomId) {
  const explicit = import.meta.env.VITE_WS_URL
  let base
  if (explicit) {
    base = explicit
  } else {
    // Derive dari VITE_API_URL: http -> ws, https -> wss.
    const u = new URL(API_URL, window.location.origin)
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
    base = u.toString().replace(/\/$/, "")
  }
  const token = getToken()
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ""
  return `${base.replace(/\/$/, "")}/chat/ws/rooms/${roomId}${tokenParam}`
}

/**
 * Buat koneksi WebSocket untuk sebuah room dengan auto-reconnect.
 *
 * @param {number} roomId
 * @param {object} handlers — { onOpen, onMessage, onClose, onError, onStatus }
 * @returns {{ send: (body: string) => boolean, close: () => void, status: () => string }}
 */
export function createChatSocket(roomId, handlers = {}) {
  let ws = null
  let closedByUser = false
  let retry = 0
  let pingTimer = null
  let reconnectTimer = null
  let status = "connecting"

  const setStatus = (s) => {
    if (status === s) return
    status = s
    handlers.onStatus?.(s)
  }

  const clearTimers = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  }

  const connect = () => {
    if (closedByUser) return
    setStatus(retry === 0 ? "connecting" : "reconnecting")
    try {
      ws = new WebSocket(buildWsUrl(roomId))
    } catch (e) {
      handlers.onError?.(e)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      retry = 0
      setStatus("open")
      handlers.onOpen?.()
      // Ping setiap 25 detik agar koneksi tidak diputus reverse proxy.
      pingTimer = setInterval(() => {
        try { ws?.send(JSON.stringify({ type: "ping" })) } catch { /* ignore */ }
      }, 25000)
    }

    ws.onmessage = (event) => {
      let data = null
      try { data = JSON.parse(event.data) } catch { return }
      if (!data || typeof data !== "object") return
      handlers.onMessage?.(data)
    }

    ws.onerror = (e) => handlers.onError?.(e)

    ws.onclose = (event) => {
      clearTimers()
      setStatus("closed")
      handlers.onClose?.(event)
      if (closedByUser) return
      // Jangan reconnect untuk penutupan auth/akses (4401, 4403, 4404).
      if (event.code === 4401 || event.code === 4403 || event.code === 4404) return
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    retry += 1
    const delay = Math.min(1000 * 2 ** Math.min(retry, 5), 15000)
    reconnectTimer = setTimeout(connect, delay)
  }

  connect()

  return {
    send(body) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false
      try {
        ws.send(JSON.stringify({ type: "message", body }))
        return true
      } catch {
        return false
      }
    },
    close() {
      closedByUser = true
      clearTimers()
      try { ws?.close(1000, "client closing") } catch { /* ignore */ }
    },
    status: () => status,
  }
}


export async function fetchChatPresence() {
  const res = await fetch(`${API_URL}/chat/presence`, { headers: authOnlyHeaders() })
  return handleResponse(res)
}


function buildPresenceWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL
  let base
  if (explicit) {
    base = explicit
  } else {
    const u = new URL(API_URL, window.location.origin)
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
    base = u.toString().replace(/\/$/, "")
  }
  const token = getToken()
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ""
  return `${base.replace(/\/$/, "")}/chat/ws/presence${tokenParam}`
}

/**
 * Buka koneksi WebSocket presence-only dengan auto-reconnect.
 * Cocok dipasang sekali saat user login agar server tahu ia online
 * walau tidak sedang membuka halaman /chat.
 *
 * @param {object} handlers — { onPresence(evt), onStatus(s) }
 * @returns {{ close: () => void }}
 */
export function createPresenceSocket(handlers = {}) {
  let ws = null
  let closedByUser = false
  let retry = 0
  let pingTimer = null
  let reconnectTimer = null

  const clearTimers = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  }

  const connect = () => {
    if (closedByUser) return
    handlers.onStatus?.(retry === 0 ? "connecting" : "reconnecting")
    try {
      ws = new WebSocket(buildPresenceWsUrl())
    } catch (e) {
      handlers.onStatus?.("error")
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      retry = 0
      handlers.onStatus?.("open")
      pingTimer = setInterval(() => {
        try { ws?.send(JSON.stringify({ type: "ping" })) } catch { /* ignore */ }
      }, 25000)
    }

    ws.onmessage = (event) => {
      let data = null
      try { data = JSON.parse(event.data) } catch { return }
      if (!data || typeof data !== "object") return
      if (data.type === "presence") handlers.onPresence?.(data)
    }

    ws.onclose = (event) => {
      clearTimers()
      handlers.onStatus?.("closed")
      if (closedByUser) return
      if (event.code === 4401 || event.code === 4403) return
      scheduleReconnect()
    }

    ws.onerror = () => { /* let onclose handle it */ }
  }

  const scheduleReconnect = () => {
    retry += 1
    const delay = Math.min(1000 * 2 ** Math.min(retry, 5), 15000)
    reconnectTimer = setTimeout(connect, delay)
  }

  connect()

  return {
    close() {
      closedByUser = true
      clearTimers()
      try { ws?.close(1000, "client closing") } catch { /* ignore */ }
    },
  }
}
