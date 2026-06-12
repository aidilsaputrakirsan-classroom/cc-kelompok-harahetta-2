/**
 * PresenceManager
 * Komponen tak terlihat yang:
 * 1. Membuka WebSocket /ws/presence agar server tahu user ONLINE secara realtime
 *    sejak pertama login, walau belum membuka halaman chat.
 * 2. Mengirim heartbeat REST tiap 30 detik sebagai fallback jika WS terblokir
 *    oleh reverse proxy di production.
 * 3. Menutup WS secara eksplisit saat tab ditutup / browser ditutup
 *    sehingga server langsung tahu user OFFLINE tanpa menunggu TCP timeout.
 *
 * Dengan kombinasi ini, partner akan melihat status online INSTAN saat user login,
 * dan status offline INSTAN saat user logout/tutup browser.
 */
import { useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { chatHeartbeat, createPresenceSocket } from "../services/chat"

export default function PresenceManager() {
  const { isAuthenticated, token } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Pastikan socket ditutup saat logout
      socketRef.current?.close()
      socketRef.current = null
      return undefined
    }

    // 1. Buka WebSocket presence (realtime — utama)
    socketRef.current = createPresenceSocket({
      onStatus: (s) => {
        // Saat WS reconnect, kirim heartbeat juga agar sinkron
        if (s === "open") chatHeartbeat().catch(() => {})
      },
    })

    // 2. Heartbeat REST tiap 30 detik (fallback jika WS tidak stabil)
    chatHeartbeat().catch(() => {})
    const t = setInterval(() => {
      chatHeartbeat().catch(() => {})
    }, 30000)

    // 3. Tutup WS secara eksplisit saat user tutup tab/browser.
    //    'pagehide' lebih andal dari 'beforeunload' di mobile/browser modern.
    //    Ini memastikan server langsung tau offline tanpa tunggu TCP timeout.
    const handlePageHide = () => {
      socketRef.current?.close()
    }

    // visibilitychange: saat tab disembunyikan (buka tab lain),
    // kita biarkan WS tetap hidup — hanya putus saat benar-benar pergi (pagehide).
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      clearInterval(t)
      window.removeEventListener("pagehide", handlePageHide)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [isAuthenticated, token])

  return null
}
