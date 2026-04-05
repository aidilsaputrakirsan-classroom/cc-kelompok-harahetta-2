import { useEffect } from "react"
import { createPortal } from "react-dom"

export default function Modal({ isOpen, onClose, title, children, size = "md", footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose?.() }
    if (isOpen) window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidths = { sm: "400px", md: "560px", lg: "740px", xl: "900px" }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        border: "1px solid rgba(148,163,184,0.15)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: maxWidths[size],
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        animation: "scaleIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 18px",
          borderBottom: "1px solid rgba(148,163,184,0.1)",
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(51,65,85,0.8)", border: "1px solid rgba(148,163,184,0.15)",
              color: "#94a3b8", width: 32, height: 32, borderRadius: "8px",
              cursor: "pointer", fontSize: "1rem", display: "flex",
              alignItems: "center", justifyContent: "center", transition: "all 150ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f1f5f9"; e.currentTarget.style.background = "rgba(71,85,105,0.8)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(51,65,85,0.8)" }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: "16px 24px 20px",
            borderTop: "1px solid rgba(148,163,184,0.1)",
            display: "flex", gap: "10px", justifyContent: "flex-end",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
