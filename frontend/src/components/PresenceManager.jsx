/**
 * PresenceManager
 * Komponen tak terlihat yang menjaga koneksi WebSocket presence selama
 * user login. Server menggunakan koneksi ini untuk memberi tahu partner
 * chat bahwa user sedang online.
 *
 * Pasang sekali di App level (di dalam scope AuthProvider).
 */
import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { createPresenceSocket } from "../services/chat"

export default function PresenceManager() {
  const { isAuthenticated, token } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined
    const sock = createPresenceSocket()
    return () => sock.close()
  }, [isAuthenticated, token])

  return null
}
