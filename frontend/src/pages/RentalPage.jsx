import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Button from "../components/ui/Button"
import Spinner from "../components/Spinner"
import { fetchItem, createRental } from "../services/api"

const formatPrice = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

export default function RentalPage({ addToast }) {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get("item")
  const navigate = useNavigate()
  const { user, isVerified } = useAuth()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ tanggal_mulai: "", tanggal_selesai: "", catatan: "" })

  useEffect(() => {
    if (!itemId) { navigate("/dashboard"); return }
    fetchItem(itemId).then(data => { setItem(data); setLoading(false) }).catch(() => navigate("/dashboard"))
  }, [itemId, navigate])

  const days = form.tanggal_mulai && form.tanggal_selesai
    ? Math.max(0, Math.ceil((new Date(form.tanggal_selesai) - new Date(form.tanggal_mulai)) / (1000 * 60 * 60 * 24)))
    : 0
  const totalPrice = item ? item.harga_per_hari * days : 0

  const today = new Date().toISOString().split("T")[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isVerified) {
      addToast?.("Anda harus verifikasi identitas terlebih dahulu untuk menyewa", "warning")
      navigate("/profile")
      return
    }
    if (days <= 0) { addToast?.("Tanggal selesai harus setelah tanggal mulai", "error"); return }
    setSubmitting(true)
    try {
      await createRental({
        item_id: parseInt(itemId),
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        catatan: form.catatan || undefined,
      })
      addToast?.("Permintaan sewa berhasil dikirim! 🎉", "success")
      navigate("/rentals/my")
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner center size="lg" />

  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=6366f1&color=fff&size=400&bold=true`

  return (
    <div className="page-container" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "24px" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.875rem", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          ← Kembali ke Katalog
        </button>
      </div>

      <h1 className="page-title">📋 Ajukan Sewa</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        {/* Item info */}
        <div className="card">
          <img
            src={item?.foto_url || imgFallback}
            alt={item?.nama}
            style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "10px", marginBottom: "16px" }}
            onError={e => { e.target.src = imgFallback }}
          />
          <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem" }}>{item?.nama}</h3>
          {item?.deskripsi && <p style={{ fontSize: "0.85rem", marginBottom: "12px" }}>{item?.deskripsi}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#6366f1" }}>{formatPrice(item?.harga_per_hari)}</div>
              <div style={{ fontSize: "0.75rem", color: "#475569" }}>per hari</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{item?.stok} unit</div>
              <div style={{ fontSize: "0.75rem", color: "#475569" }}>tersedia</div>
            </div>
          </div>
          {item?.category && (
            <div style={{ marginTop: "10px", padding: "6px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "8px", fontSize: "0.8rem", color: "#6366f1" }}>
              📂 {item.category.nama}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="card">
          {!isVerified && (
            <div style={{ marginBottom: "16px", padding: "12px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "10px", fontSize: "0.85rem", color: "#f59e0b" }}>
              ⚠️ Anda belum terverifikasi. <button onClick={() => navigate("/profile")} style={{ color: "#f59e0b", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Lengkapi profil & KTP</button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tanggal Mulai</label>
              <input id="rental-start" type="date" className="form-input" min={today} value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tanggal Selesai</label>
              <input id="rental-end" type="date" className="form-input" min={form.tanggal_mulai || today} value={form.tanggal_selesai} onChange={e => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Catatan (Opsional)</label>
              <textarea id="rental-note" className="form-textarea" placeholder="Permintaan khusus, kondisi barang, dll." value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} style={{ minHeight: "80px" }} />
            </div>

            {/* Summary */}
            {days > 0 && (
              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <span>Durasi</span><span>{days} hari</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <span>Harga/hari</span><span>{formatPrice(item?.harga_per_hari)}</span>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid rgba(99,102,241,0.2)", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700 }}>
                  <span style={{ color: "#f1f5f9" }}>Total</span>
                  <span style={{ color: "#6366f1" }}>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting} disabled={!isVerified}>
              🛒 Kirim Permintaan Sewa
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
