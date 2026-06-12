/**
 * ChatbotWidget.jsx
 * Floating AI chatbot widget — hanya menjawab seputar platform Sewain.
 * Menggunakan Gemini API melalui backend endpoint /chatbot.
 */
import { useState, useRef, useEffect } from "react"
import { sendChatMessage } from "../services/api"
import {
  MessageCircle, X, Send, Loader2, Bot, User, Trash2, ChevronDown,
} from "lucide-react"

// Format teks markdown sederhana (bold & newline)
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>")
}

const WELCOME_MESSAGE = {
  role: "model",
  content: "Halo! 👋 Saya **SewainBot**, asisten virtual platform Sewain.\n\nSaya siap membantu kamu dengan pertanyaan seputar penyewaan barang, pembayaran, status sewa, atau cara menggunakan platform ini.\n\nAda yang bisa saya bantu? 😊",
}

const QUICK_QUESTIONS = [
  "Bagaimana cara menyewa barang?",
  "Bagaimana alur pembayaran?",
  "Apa itu status 'sedang_disewa'?",
  "Bagaimana verifikasi KTP?",
]

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  // Fokus input saat widget dibuka
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setHasNew(false)
    }
  }, [open])

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput("")
    const userMsg = { role: "user", content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Siapkan history (kecuali pesan welcome)
    const history = messages
      .filter(m => m.role !== "system")
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await sendChatMessage(msg, history)
      setMessages(prev => [...prev, { role: "model", content: res.reply }])
      if (!open) setHasNew(true)
    } catch (err) {
      const errMsg = err?.message || "Terjadi kesalahan. Coba lagi beberapa saat ya."
      setMessages(prev => [...prev, {
        role: "model",
        content: `⚠️ ${errMsg}`,
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => setMessages([WELCOME_MESSAGE])

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Buka chatbot Sewain"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1b7e6a 0%, #0d5c4a 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(27,126,106,0.45)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open
          ? <ChevronDown size={24} color="white" />
          : <MessageCircle size={24} color="white" />
        }
        {/* Notif badge */}
        {hasNew && !open && (
          <span style={{
            position: "absolute", top: "6px", right: "6px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: "#ef4444", border: "2px solid white",
          }} />
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            zIndex: 9998,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(540px, calc(100vh - 120px))",
            borderRadius: "20px",
            background: "#ffffff",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1b7e6a 0%, #0d5c4a 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: "700", fontSize: "14px", margin: 0 }}>
                SewainBot
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", margin: 0 }}>
                Asisten AI Platform Sewain
              </p>
            </div>
            <button
              onClick={clearChat}
              title="Hapus percakapan"
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px",
                padding: "6px", cursor: "pointer", color: "white", display: "flex",
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px",
                padding: "6px", cursor: "pointer", color: "white", display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: "12px",
            background: "#f8fafc",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: "8px",
              }}>
                {/* Avatar */}
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: msg.role === "user" ? "#1b7e6a" : "white",
                  border: msg.role === "model" ? "1.5px solid #e2e8f0" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {msg.role === "user"
                    ? <User size={14} color="white" />
                    : <Bot size={14} color="#1b7e6a" />
                  }
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: "78%",
                  background: msg.isError ? "#fef2f2" : (msg.role === "user" ? "#1b7e6a" : "white"),
                  color: msg.isError ? "#dc2626" : (msg.role === "user" ? "white" : "#1e293b"),
                  padding: "8px 12px",
                  borderRadius: msg.role === "user"
                    ? "14px 4px 14px 14px"
                    : "4px 14px 14px 14px",
                  fontSize: "13px",
                  lineHeight: "1.55",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  border: msg.role === "model" ? "1px solid #f1f5f9" : "none",
                }}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {/* Loading bubble */}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "white", border: "1.5px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={14} color="#1b7e6a" />
                </div>
                <div style={{
                  background: "white", padding: "10px 14px", borderRadius: "4px 14px 14px 14px",
                  border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  display: "flex", gap: "4px", alignItems: "center",
                }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: "#94a3b8",
                      animation: `chatDot 1.2s ${d * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions — hanya saat baru mulai */}
          {messages.length <= 1 && (
            <div style={{
              padding: "8px 12px", background: "#f8fafc",
              borderTop: "1px solid #f1f5f9",
              display: "flex", flexWrap: "wrap", gap: "6px",
            }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)} style={{
                  fontSize: "11px", padding: "5px 10px",
                  borderRadius: "20px", border: "1px solid #d1fae5",
                  background: "#ecfdf5", color: "#065f46",
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "background 0.15s",
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            background: "white",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya sesuatu tentang Sewain..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1, border: "1.5px solid #e2e8f0", borderRadius: "12px",
                padding: "8px 12px", fontSize: "13px", resize: "none",
                outline: "none", fontFamily: "inherit", lineHeight: "1.5",
                maxHeight: "80px", overflowY: "auto", background: "#f8fafc",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#1b7e6a"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: "38px", height: "38px", borderRadius: "12px",
                background: input.trim() && !loading ? "#1b7e6a" : "#e2e8f0",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s",
              }}
            >
              {loading
                ? <Loader2 size={16} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
                : <Send size={16} color={input.trim() ? "white" : "#94a3b8"} />
              }
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
