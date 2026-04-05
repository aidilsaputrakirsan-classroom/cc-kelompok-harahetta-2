import Badge from "./ui/Badge"
import Button from "./ui/Button"

const formatPrice = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
const formatDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

const STATUS_LABELS = {
  pending: "Menunggu Persetujuan",
  disetujui: "Disetujui, Belum Mulai",
  sedang_disewa: "Sedang Berjalan",
  selesai: "Selesai",
  ditolak: "Ditolak",
}

export default function RentalCard({ rental, onUpdateStatus, isAdmin }) {
  const item = rental.item
  const imgFallback = item ? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=6366f1&color=fff&size=200&bold=true` : ""

  return (
    <div style={{
      background: "rgba(30,41,59,0.8)",
      border: "1px solid rgba(148,163,184,0.1)",
      borderRadius: "16px",
      padding: "20px",
      backdropFilter: "blur(12px)",
      display: "flex",
      gap: "16px",
      alignItems: "flex-start",
      transition: "all 0.25s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)" }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)"; e.currentTarget.style.boxShadow = "none" }}
    >
      {/* Item image */}
      {item && (
        <img
          src={item.foto_url || imgFallback}
          alt={item.nama}
          style={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(148,163,184,0.15)" }}
          onError={e => { e.target.src = imgFallback }}
        />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9" }}>
              {item?.nama || `Item #${rental.item_id}`}
            </div>
            {isAdmin && rental.user && (
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                Penyewa: <span style={{ color: "#94a3b8" }}>{rental.user.nama}</span>
              </div>
            )}
          </div>
          <Badge status={rental.status} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", marginTop: "12px" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mulai</div>
            <div style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>{formatDate(rental.tanggal_mulai)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Selesai</div>
            <div style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>{formatDate(rental.tanggal_selesai)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#6366f1" }}>{formatPrice(rental.total_harga)}</div>
          </div>
        </div>

        {rental.catatan && (
          <div style={{
            marginTop: "10px", padding: "8px 12px",
            background: "rgba(15,23,42,0.5)", borderRadius: "8px",
            fontSize: "0.8rem", color: "#64748b", fontStyle: "italic",
          }}>
            "{rental.catatan}"
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && rental.status === "pending" && (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Button variant="success" size="sm" onClick={() => onUpdateStatus?.(rental.id, "disetujui")}>
              ✓ Setujui
            </Button>
            <Button variant="danger" size="sm" onClick={() => onUpdateStatus?.(rental.id, "ditolak")}>
              ✕ Tolak
            </Button>
          </div>
        )}
        {isAdmin && rental.status === "disetujui" && (
          <div style={{ marginTop: "12px" }}>
            <Button variant="primary" size="sm" onClick={() => onUpdateStatus?.(rental.id, "sedang_disewa")}>
              ▶ Mulai Sewa
            </Button>
          </div>
        )}
        {isAdmin && rental.status === "sedang_disewa" && (
          <div style={{ marginTop: "12px" }}>
            <Button variant="secondary" size="sm" onClick={() => onUpdateStatus?.(rental.id, "selesai")}>
              ✓ Tandai Selesai
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
