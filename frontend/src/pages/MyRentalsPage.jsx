import { useState, useEffect, useCallback } from "react"
import RentalCard from "../components/RentalCard"
import Spinner from "../components/Spinner"
import Button from "../components/ui/Button"
import { fetchMyRentals } from "../services/api"

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "⏳ Menunggu" },
  { value: "disetujui", label: "✅ Disetujui" },
  { value: "sedang_disewa", label: "🔄 Berlangsung" },
  { value: "selesai", label: "✓ Selesai" },
  { value: "ditolak", label: "✕ Ditolak" },
]

export default function MyRentalsPage({ addToast }) {
  const [rentals, setRentals] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const LIMIT = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMyRentals({ status: statusFilter || undefined, skip: page * LIMIT, limit: LIMIT })
      setRentals(data.rentals)
      setTotal(data.total)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, addToast])

  useEffect(() => { load() }, [load])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📋 Riwayat Sewa Saya</h1>
        <p className="page-subtitle">Pantau semua transaksi penyewaan Anda</p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(0) }} style={{
            padding: "7px 16px", borderRadius: "9999px",
            background: statusFilter === f.value ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(30,41,59,0.8)",
            border: statusFilter === f.value ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(148,163,184,0.12)",
            color: statusFilter === f.value ? "#fff" : "#64748b",
            fontSize: "0.825rem", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: statusFilter === f.value ? "0 4px 14px rgba(99,102,241,0.3)" : "none",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner center size="lg" />
      ) : rentals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Belum ada transaksi sewa</h3>
          <p>{statusFilter ? `Tidak ada sewa dengan status "${statusFilter}"` : "Mulai sewa barang dari katalog!"}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rentals.map(r => <RentalCard key={r.id} rental={r} isAdmin={false} />)}
          </div>

          {total > LIMIT && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Sebelumnya</Button>
              <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Hal. {page + 1} / {Math.ceil(total / LIMIT)}</span>
              <Button variant="secondary" size="sm" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Selanjutnya →</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
