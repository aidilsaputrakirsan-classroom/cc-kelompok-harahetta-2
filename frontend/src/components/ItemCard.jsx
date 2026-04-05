import { useState } from "react"
import Badge from "./ui/Badge"
import Button from "./ui/Button"

const formatPrice = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

export default function ItemCard({ item, onEdit, onDelete, onRent, deletingId, role }) {
  const [hovered, setHovered] = useState(false)
  const isDeleting = deletingId === item.id
  const isAdmin = role === "admin" || role === "super_admin"
  const isUser = role === "user"

  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=6366f1&color=fff&size=300&bold=true`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(51,65,85,0.85)" : "rgba(30,41,59,0.8)",
        border: hovered ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(148,163,184,0.1)",
        borderRadius: "16px",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.2)" : "0 2px 12px rgba(0,0,0,0.3)",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
        <img
          src={item.foto_url || imgFallback}
          alt={item.nama}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
          onError={e => { e.target.src = imgFallback }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "80px",
          background: "linear-gradient(to top, rgba(15,23,42,0.95), transparent)",
        }} />
        {/* Status badge */}
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          <Badge status={item.status} />
        </div>
        {/* Category */}
        {item.category && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <span style={{
              background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)",
              color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600,
              padding: "3px 8px", borderRadius: "9999px",
              border: "1px solid rgba(148,163,184,0.15)",
            }}>{item.category.nama}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h3 style={{ fontSize: "0.975rem", fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>
            {item.nama}
          </h3>
          {item.deskripsi && (
            <p style={{
              fontSize: "0.8rem", color: "#64748b", marginTop: "4px",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", lineHeight: 1.5,
            }}>{item.deskripsi}</p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: "1.1rem", fontWeight: 800,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {formatPrice(item.harga_per_hari)}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#475569" }}>per hari</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{item.stok}</div>
            <div style={{ fontSize: "0.72rem", color: "#475569" }}>stok</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "4px" }}>
          {isUser && item.status === "available" && item.stok > 0 && (
            <Button variant="primary" size="sm" fullWidth onClick={() => onRent?.(item)}>
              🛒 Sewa Sekarang
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" fullWidth onClick={() => onEdit?.(item)}>
                ✏️ Edit
              </Button>
              <Button
                variant="danger" size="sm"
                loading={isDeleting}
                disabled={isDeleting}
                onClick={() => onDelete?.(item.id)}
                style={{ flexShrink: 0 }}
              >
                🗑️
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}