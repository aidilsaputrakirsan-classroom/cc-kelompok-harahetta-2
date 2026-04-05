import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import Spinner from "../components/Spinner"
import { fetchProfile, updateProfile } from "../services/api"

export default function ProfilePage({ addToast }) {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nama_orang_tua: "", alamat: "", latitude: "", longitude: "",
    foto_ktp: "", foto_selfie_ktp: "",
  })

  useEffect(() => {
    fetchProfile()
      .then(p => {
        setProfile(p)
        setForm({
          nama_orang_tua: p.nama_orang_tua || "",
          alamat: p.alamat || "",
          latitude: p.latitude || "",
          longitude: p.longitude || "",
          foto_ktp: p.foto_ktp || "",
          foto_selfie_ktp: p.foto_selfie_ktp || "",
        })
      })
      .catch(() => addToast?.("Gagal memuat profil", "error"))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude)
      else delete payload.latitude
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude)
      else delete payload.longitude
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      const updated = await updateProfile(payload)
      setProfile(updated)
      await refreshUser()
      addToast?.("Profil berhasil disimpan! ✓", "success")
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner center size="lg" />

  const verifStatus = profile?.status_verifikasi || "menunggu"

  return (
    <div className="page-container" style={{ maxWidth: "720px" }}>
      <div className="page-header">
        <h1 className="page-title">👤 Profil & Verifikasi</h1>
        <p className="page-subtitle">Lengkapi data diri dan upload KTP untuk mulai menyewa</p>
      </div>

      {/* User info card */}
      <div className="card" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem", fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {user?.nama?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{user?.nama}</h3>
          <p style={{ margin: "4px 0 8px", fontSize: "0.875rem", color: "#475569" }}>{user?.email}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Badge status={user?.role} />
            <Badge status={verifStatus} />
          </div>
        </div>
      </div>

      {/* Verif status banner */}
      {verifStatus === "menunggu" && form.foto_ktp && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px" }}>
          <div style={{ fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>⏳ Menunggu Verifikasi Admin</div>
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>KTP Anda sedang direview oleh admin. Proses biasanya 1×24 jam.</div>
        </div>
      )}
      {verifStatus === "disetujui" && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px" }}>
          <div style={{ fontWeight: 600, color: "#10b981", marginBottom: "4px" }}>✅ Identitas Terverifikasi</div>
          <div style={{ fontSize: "0.85rem", color: "#064e3b" }}>Anda dapat menyewa barang di platform.</div>
        </div>
      )}
      {verifStatus === "ditolak" && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px" }}>
          <div style={{ fontWeight: 600, color: "#ef4444", marginBottom: "4px" }}>❌ Verifikasi Ditolak</div>
          <div style={{ fontSize: "0.85rem", color: "#7f1d1d" }}>Upload ulang foto KTP yang lebih jelas.</div>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>📝 Data Diri</h3>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="grid-2" style={{ gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nama Orang Tua</label>
              <input id="profile-parent" name="nama_orang_tua" className="form-input" placeholder="Nama ayah/ibu" value={form.nama_orang_tua} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Alamat</label>
              <input id="profile-address" name="alamat" className="form-input" placeholder="Alamat lengkap" value={form.alamat} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2" style={{ gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Latitude (GPS)</label>
              <input id="profile-lat" name="latitude" type="number" step="any" className="form-input" placeholder="-1.2654" value={form.latitude} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Longitude (GPS)</label>
              <input id="profile-lon" name="longitude" type="number" step="any" className="form-input" placeholder="116.8312" value={form.longitude} onChange={handleChange} />
            </div>
          </div>

          <hr className="divider" />
          <h4 style={{ margin: 0, color: "#94a3b8" }}>🪪 Verifikasi KTP</h4>
          <p style={{ margin: "-8px 0 0", fontSize: "0.83rem" }}>
            Upload URL foto KTP dan selfie dengan KTP. Diperlukan untuk mengajukan sewa.
          </p>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">URL Foto KTP</label>
            <input id="profile-ktp" name="foto_ktp" type="url" className="form-input" placeholder="https://..." value={form.foto_ktp} onChange={handleChange} />
          </div>
          {form.foto_ktp && (
            <img src={form.foto_ktp} alt="Foto KTP" onError={e => e.target.style.display = "none"} style={{ maxHeight: "140px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.15)" }} />
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">URL Selfie dengan KTP</label>
            <input id="profile-selfie" name="foto_selfie_ktp" type="url" className="form-input" placeholder="https://..." value={form.foto_selfie_ktp} onChange={handleChange} />
          </div>
          {form.foto_selfie_ktp && (
            <img src={form.foto_selfie_ktp} alt="Selfie KTP" onError={e => e.target.style.display = "none"} style={{ maxHeight: "140px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.15)" }} />
          )}

          <Button type="submit" variant="primary" size="lg" loading={saving} style={{ marginTop: "8px" }}>
            💾 Simpan Perubahan
          </Button>
        </form>
      </div>
    </div>
  )
}
