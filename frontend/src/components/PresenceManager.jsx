/**
 * PresenceManager
 * Komponen tak terlihat yang mengirim heartbeat REST tiap 30 detik
 * selama user login. Server menggunakan heartbeat ini untuk menentukan
 * status online tanpa bergantung WebSocket (yang mungkin diblokir
 * reverse proxy di production).
 */
import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { chatHeartbeat } from "../services/chat"

export default function PresenceManager() {
  const { isAuthenticated, token } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined

    // Kirim heartbeat segera saat mount
    chatHeartbeat().catch(() => {})

    // Lalu tiap 30 detik
    const t = setInterval(() => {
      chatHeartbeat().catch(() => {})
    }, 30000)

    return () => clearInterval(t)
  }, [isAuthenticated, token])

  return null
}
