import { useEffect, useState } from "react"

function Toast({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(id), 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [id, onRemove])

  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" }
  const colors = {
    success: { border: "#10b981", icon: "#10b981", bg: "rgba(16,185,129,0.12)" },
    error: { border: "#ef4444", icon: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    warning: { border: "#f59e0b", icon: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    info: { border: "#6366f1", icon: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  }
  const c = colors[type] || colors.info

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "14px 16px",
      background: `rgba(30,41,59,0.95)`,
      borderLeft: `3px solid ${c.border}`,
      borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      backdropFilter: "blur(12px)",
      border: `1px solid rgba(148,163,184,0.12)`,
      borderLeftColor: c.border,
      maxWidth: "360px",
      transform: visible ? "translateX(0)" : "translateX(120%)",
      opacity: visible ? 1 : 0,
      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      cursor: "pointer",
    }} onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300) }}>
      <span style={{
        width: 28, height: 28, borderRadius: "50%", background: c.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.icon, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
      }}>{icons[type]}</span>
      <span style={{ fontSize: "0.875rem", color: "#e2e8f0", lineHeight: 1.5, paddingTop: "2px" }}>
        {message}
      </span>
    </div>
  )
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 9999,
      display: "flex", flexDirection: "column", gap: "10px",
      alignItems: "flex-end", pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <Toast {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
