/**
 * ChatPage — Sewain
 * List room di kiri, thread di kanan. Realtime via WebSocket dengan
 * fallback REST. Bisa dibuka via /chat (list) dan /chat/:roomId (thread).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  createChatSocket,
  fetchChatMessages,
  fetchChatPresence,
  fetchChatRoom,
  fetchMyChatRooms,
  markRoomRead,
  sendChatMessage as apiSendMessage,
} from "../services/chat"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Loader2, MessageCircle, Send, Package, User as UserIcon, Store,
} from "lucide-react"

function formatTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("id-ID", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
}

function PartnerAvatar({ name, role, size = 40, online = null, src = null }) {
  const initial = (name || "?")[0].toUpperCase()
  const Icon = role === "admin" || role === "super_admin" ? Store : UserIcon
  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name || "avatar"}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
          aria-hidden
        >
          {name ? initial : <Icon className="w-4 h-4" />}
        </div>
      )}
      {online !== null && (
        <span
          aria-label={online ? "Online" : "Offline"}
          title={online ? "Online sekarang" : "Sedang offline"}
          className={`absolute bottom-0 right-0 rounded-full border-2 border-card ${
            online ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
          style={{
            width: Math.max(10, size * 0.28),
            height: Math.max(10, size * 0.28),
          }}
        />
      )}
    </div>
  )
}

function RoomCard({ room, active, onSelect }) {
  const isMineLast = room.last_message_preview && room.unread_count === 0
  return (
    <button
      onClick={() => onSelect(room.id)}
      className={`w-full text-left p-3 rounded-2xl transition-colors flex gap-3 items-start ${
        active ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"
      }`}
    >
      <PartnerAvatar
        name={room.partner_nama}
        role={room.partner_role}
        size={42}
        online={!!room.partner_online}
        src={room.partner_avatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate">{room.partner_nama || "Pengguna"}</p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatTime(room.last_message_at || room.created_at)}
          </span>
        </div>
        {room.item_nama && (
          <p className="text-[11px] text-primary/80 truncate inline-flex items-center gap-1 mt-0.5">
            <Package className="w-3 h-3" /> {room.item_nama}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-xs truncate ${isMineLast ? "text-muted-foreground" : "text-foreground"}`}>
            {room.last_message_preview || "Belum ada pesan"}
          </p>
          {room.unread_count > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center flex-shrink-0">
              {room.unread_count > 99 ? "99+" : room.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isMine }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm border ${
          isMine
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md border-primary/40"
            : "bg-card text-foreground rounded-2xl rounded-bl-md border-border"
        }`}
      >
        <p>{msg.body}</p>
        <p className={`text-[10px] mt-1 text-right ${isMine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </motion.div>
  )
}

export default function ChatPage({ addToast }) {
  const navigate = useNavigate()
  const { roomId: roomIdParam } = useParams()
  const { user } = useAuth()
  const viewerId = user?.id

  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState("")

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const activeRoomId = useMemo(() => {
    const v = Number(roomIdParam)
    return Number.isFinite(v) && v > 0 ? v : null
  }, [roomIdParam])

  // Load list room
  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchMyChatRooms()
      setRooms(data?.rooms || [])
    } catch (err) {
      if (err.message.includes("Sesi habis")) { addToast?.("Sesi habis, silakan login kembali", "warning"); navigate("/login"); return }
      addToast?.(err.message || "Gagal memuat daftar chat", "error")
    } finally {
      setLoadingRooms(false)
    }
  }, [navigate, addToast])

  useEffect(() => { loadRooms() }, [loadRooms])

  // Saat roomId berubah → tutup socket lama, ambil thread, buka socket baru.
  useEffect(() => {
    socketRef.current?.close()
    socketRef.current = null
    setMessages([])
    setActiveRoom(null)

    if (!activeRoomId) return

    let cancelled = false

    ;(async () => {
      setLoadingMessages(true)
      try {
        const [room, list] = await Promise.all([
          fetchChatRoom(activeRoomId),
          fetchChatMessages(activeRoomId, { limit: 200 }),
        ])
        if (cancelled) return
        setActiveRoom(room)
        setMessages(list?.messages || [])
        // Mark as read di server + update lokal
        markRoomRead(activeRoomId).catch(() => {})
        setRooms((prev) => prev.map((r) => (r.id === activeRoomId ? { ...r, unread_count: 0 } : r)))
      } catch (err) {
        if (cancelled) return
        if (err.message.includes("Sesi habis")) { addToast?.("Sesi habis, silakan login kembali", "warning"); navigate("/login"); return }
        addToast?.(err.message || "Gagal memuat chat", "error")
        navigate("/chat")
        return
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }

      // Buka WebSocket
      const sock = createChatSocket(activeRoomId, {
        onMessage: (evt) => {
          if (evt?.type === "presence" && evt.data) {
            const { user_id: uid, online } = evt.data
            setRooms((prev) => prev.map((r) =>
              r.partner_id === uid ? { ...r, partner_online: !!online } : r
            ))
            setActiveRoom((prev) =>
              prev && prev.partner_id === uid ? { ...prev, partner_online: !!online } : prev
            )
            return
          }
          if (evt?.type !== "message" || !evt.data) return
          setMessages((prev) => {
            // Anti-duplicate berdasarkan id
            if (prev.some((m) => m.id === evt.data.id)) return prev
            return [...prev, evt.data]
          })
          // Update preview di list
          setRooms((prev) => prev.map((r) =>
            r.id === activeRoomId
              ? {
                  ...r,
                  last_message_preview: evt.data.body?.slice(0, 80),
                  last_message_at: evt.data.created_at,
                  unread_count: evt.data.sender_id === viewerId ? r.unread_count : 0,
                }
              : r
          ))
          // Auto-mark read kalau pesan dari partner
          if (evt.data.sender_id !== viewerId) {
            markRoomRead(activeRoomId).catch(() => {})
          }
        },
      })
      socketRef.current = sock
    })()

    return () => {
      cancelled = true
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [activeRoomId, addToast, navigate, viewerId])

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, activeRoomId])

  // Polling pesan baru tiap 5 detik (fallback saat WS tidak tersedia di production)
  useEffect(() => {
    if (!activeRoomId) return
    const poll = async () => {
      try {
        const list = await fetchChatMessages(activeRoomId, { limit: 200 })
        const msgs = list?.messages || []
        setMessages((prev) => {
          // Merge: tambah pesan baru yang belum ada di state
          const existingIds = new Set(prev.map((m) => m.id))
          const newOnes = msgs.filter((m) => !existingIds.has(m.id))
          if (newOnes.length === 0) return prev
          return [...prev, ...newOnes]
        })
      } catch { /* ignore */ }
    }
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [activeRoomId])

  // Polling fallback ringan: refresh room list tiap 30 detik
  useEffect(() => {
    const t = setInterval(() => { loadRooms() }, 30000)
    return () => clearInterval(t)
  }, [loadRooms])

  // Polling presence partner: refresh status online tiap 25 detik.
  // Penting saat user belum buka thread (jadi belum ada WS aktif).
  useEffect(() => {
    let alive = true
    const apply = (onlineIds) => {
      if (!alive) return
      const set = new Set((onlineIds || []).map(Number))
      setRooms((prev) => prev.map((r) => ({ ...r, partner_online: set.has(r.partner_id) })))
      setActiveRoom((prev) => prev ? { ...prev, partner_online: set.has(prev.partner_id) } : prev)
    }
    const load = async () => {
      try {
        const data = await fetchChatPresence()
        apply(data?.online || [])
      } catch { /* ignore */ }
    }
    load()
    const t = setInterval(load, 25000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const handleSelect = (id) => navigate(`/chat/${id}`)

  const handleSend = async () => {
    const body = input.trim()
    if (!body || sending || !activeRoomId) return
    setSending(true)
    setInput("")
    // Coba via socket dulu — kalau gagal, fallback REST
    const okSocket = socketRef.current?.send(body)
    if (!okSocket) {
      try {
        const saved = await apiSendMessage(activeRoomId, body)
        setMessages((prev) => prev.some((m) => m.id === saved.id) ? prev : [...prev, saved])
      } catch (err) {
        if (err.message.includes("Sesi habis")) { addToast?.("Sesi habis, silakan login kembali", "warning"); navigate("/login"); return }
        addToast?.(err.message || "Gagal mengirim pesan", "error")
        setInput(body) // restore
      }
    }
    setSending(false)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  )

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4">
      <div className="rounded-3xl border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[calc(100vh-180px)]">
        {/* ── List room ── */}
        <aside
          className={`border-r border-border bg-background/50 flex flex-col ${
            activeRoomId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm tracking-tight">Pesan</h2>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {rooms.length} chat
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
                Belum ada percakapan.<br />
                Buka detail barang dan klik <strong>Tanya admin</strong>.
              </div>
            ) : (
              rooms.map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  active={r.id === activeRoomId}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Thread ── */}
        <section className={`flex-col ${activeRoomId ? "flex" : "hidden md:flex"}`}>
          {!activeRoomId ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="font-semibold tracking-tight">Pilih percakapan</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pilih kontak di kiri untuk mulai mengobrol.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header thread */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="md:hidden p-1.5 rounded-full hover:bg-muted"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <PartnerAvatar
                  name={activeRoom?.partner_nama}
                  role={activeRoom?.partner_role}
                  size={36}
                  online={!!activeRoom?.partner_online}
                  src={activeRoom?.partner_avatar}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">
                    {activeRoom?.partner_nama || "Pengguna"}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeRoom?.partner_online ? "bg-emerald-500" : "bg-muted-foreground/40"
                        }`}
                      />
                      {activeRoom?.partner_online ? "Online sekarang" : "Offline"}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="capitalize">
                      {activeRoom?.partner_role === "admin" || activeRoom?.partner_role === "super_admin"
                        ? "Penyedia"
                        : "Penyewa"}
                    </span>
                    {activeRoom?.item_nama && (
                      <Link
                        to={`/items/${activeRoom.item_id}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" /> {activeRoom.item_nama}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    Belum ada pesan. Sapa lebih dulu — jangan sungkan.
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {sortedMessages.map((m) => (
                      <MessageBubble key={m.id} msg={m} isMine={m.sender_id === viewerId} />
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-background p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Tulis pesan..."
                    disabled={sending}
                    className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="rounded-2xl bg-primary text-primary-foreground p-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Kirim"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
