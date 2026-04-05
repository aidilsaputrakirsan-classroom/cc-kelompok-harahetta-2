const STATUS_MAP = {
  // Item status
  available: { label: "Tersedia", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  rented: { label: "Disewa", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  unavailable: { label: "Tidak Tersedia", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  // Rental status
  pending: { label: "Menunggu", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  disetujui: { label: "Disetujui", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  sedang_disewa: { label: "Sedang Disewa", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  selesai: { label: "Selesai", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  ditolak: { label: "Ditolak", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  // Verification
  menunggu: { label: "Menunggu", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  // Role
  super_admin: { label: "Super Admin", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  admin: { label: "Admin", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  user: { label: "User", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  // Boolean
  true: { label: "Aktif", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  false: { label: "Nonaktif", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
}

export default function Badge({ status, label, color, bg, size = "sm" }) {
  const map = STATUS_MAP[String(status)] || {}
  const finalLabel = label || map.label || String(status)
  const finalColor = color || map.color || "#94a3b8"
  const finalBg = bg || map.bg || "rgba(148,163,184,0.15)"

  const fontSize = size === "xs" ? "0.7rem" : size === "sm" ? "0.75rem" : "0.85rem"
  const padding = size === "xs" ? "2px 6px" : size === "sm" ? "3px 8px" : "5px 12px"

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding,
      borderRadius: "9999px",
      background: finalBg,
      color: finalColor,
      fontSize,
      fontWeight: 600,
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
      border: `1px solid ${finalColor}25`,
    }}>
      <span style={{
        width: size === "xs" ? 5 : 6,
        height: size === "xs" ? 5 : 6,
        borderRadius: "50%",
        background: finalColor,
        flexShrink: 0,
      }} />
      {finalLabel}
    </span>
  )
}
