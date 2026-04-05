import { useState, useEffect, useCallback } from "react"
import StatCard from "../components/StatCard"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import Spinner from "../components/Spinner"
import RentalCard from "../components/RentalCard"
import {
  fetchPlatformStats, fetchAllUsers, updateUser, deleteUser,
  fetchCategories, createCategory, deleteCategory,
  fetchPendingVerifications, verifyUser,
  fetchAllRentals,
} from "../services/api"

export default function SuperAdminPanel({ addToast }) {
  const [tab, setTab] = useState("stats")
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [verifications, setVerifications] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catForm, setCatForm] = useState({ nama: "", deskripsi: "" })
  const [savingCat, setSavingCat] = useState(false)

  // User filter
  const [userRoleFilter, setUserRoleFilter] = useState("")
  const [rentalStatusFilter, setRentalStatusFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, c, v] = await Promise.all([
        fetchPlatformStats(),
        fetchAllUsers({ role: userRoleFilter || undefined }),
        fetchCategories(),
        fetchPendingVerifications(),
      ])
      setStats(s)
      setUsers(u)
      setCategories(c)
      setVerifications(v.profiles || [])
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [userRoleFilter, addToast])

  const loadRentals = useCallback(async () => {
    try {
      const data = await fetchAllRentals({ status: rentalStatusFilter || undefined })
      setRentals(data.rentals)
    } catch {}
  }, [rentalStatusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === "rentals") loadRentals() }, [tab, loadRentals])

  const handleToggleActive = async (user) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      addToast?.(`User ${!user.is_active ? "diaktifkan" : "dinonaktifkan"} ✓`, "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm("Yakin hapus user ini? Tindakan tidak bisa dibatalkan.")) return
    try {
      await deleteUser(id)
      addToast?.("User dihapus ✓", "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleVerify = async (userId, status) => {
    try {
      await verifyUser(userId, { status })
      addToast?.(`Identitas ${status} ✓`, "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    setSavingCat(true)
    try {
      await createCategory(catForm)
      addToast?.("Kategori ditambahkan ✓", "success")
      setCatModalOpen(false)
      setCatForm({ nama: "", deskripsi: "" })
      load()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSavingCat(false) }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm("Yakin hapus kategori ini?")) return
    try {
      await deleteCategory(id)
      addToast?.("Kategori dihapus ✓", "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  if (loading && tab === "stats") return <Spinner center size="lg" />

  const TABS = [
    { id: "stats", label: "📊 Statistik" },
    { id: "users", label: `👥 Users (${users.length})` },
    { id: "categories", label: `📂 Kategori (${categories.length})` },
    { id: "verifications", label: `🔍 Verifikasi (${verifications.length})` },
    { id: "rentals", label: "💳 Transaksi" },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👑 Super Admin Panel</h1>
        <p className="page-subtitle">Kelola seluruh platform Sewain</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(15,23,42,0.6)", borderRadius: "14px", padding: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: tab === t.id ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
            color: tab === t.id ? "#fff" : "#64748b", fontSize: "0.825rem", fontWeight: 600, transition: "all 0.2s ease",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ====== STATS ====== */}
      {tab === "stats" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="grid-4" style={{ gap: "16px" }}>
            <StatCard icon="👥" label="Total User" value={stats.total_users || 0} color="#6366f1" />
            <StatCard icon="📦" label="Total Barang" value={stats.total_items || 0} color="#10b981" />
            <StatCard icon="📋" label="Total Sewa" value={stats.total_rentals || 0} color="#f59e0b" />
            <StatCard icon="🏪" label="Admin Aktif" value={stats.total_admins || 0} color="#3b82f6" />
          </div>
          <div className="grid-4" style={{ gap: "16px" }}>
            <StatCard icon="✅" label="Barang Tersedia" value={stats.items_available || 0} color="#10b981" />
            <StatCard icon="🔄" label="Sedang Disewa" value={stats.items_rented || 0} color="#f59e0b" />
            <StatCard icon="⏳" label="Sewa Pending" value={stats.rentals_pending || 0} color="#f59e0b" />
            <StatCard icon="🪪" label="KTP Menunggu" value={stats.users_pending_verification || 0} color="#a78bfa" />
          </div>
          {stats.revenue_total !== undefined && (
            <div>
              <StatCard
                icon="💰" label="Total Revenue Platform"
                value={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.revenue_total || 0)}
                color="#10b981"
              />
            </div>
          )}
        </div>
      )}

      {/* ====== USERS ====== */}
      {tab === "users" && (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {["", "user", "admin", "super_admin"].map(r => (
              <button key={r} onClick={() => setUserRoleFilter(r)} style={{
                padding: "6px 14px", borderRadius: "9999px", border: "none", cursor: "pointer",
                background: userRoleFilter === r ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(30,41,59,0.8)",
                color: userRoleFilter === r ? "#fff" : "#64748b", fontSize: "0.8rem", fontWeight: 600,
              }}>{r || "Semua"}</button>
            ))}
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Verifikasi</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: "#475569" }}>#{u.id}</td>
                    <td style={{ fontWeight: 600, color: "#e2e8f0" }}>{u.nama}</td>
                    <td style={{ fontSize: "0.82rem" }}>{u.email}</td>
                    <td><Badge status={u.role} size="xs" /></td>
                    <td><Badge status={String(u.is_active)} label={u.is_active ? "Aktif" : "Nonaktif"} size="xs" /></td>
                    <td><Badge status={u.is_verified ? "disetujui" : "menunggu"} label={u.is_verified ? "Verified" : "Unverified"} size="xs" /></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleToggleActive(u)} style={{
                          padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
                          background: u.is_active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          color: u.is_active ? "#ef4444" : "#10b981", fontSize: "0.75rem", fontWeight: 600,
                        }}>
                          {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} style={{
                          padding: "4px 8px", borderRadius: "6px", border: "none", cursor: "pointer",
                          background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.75rem",
                        }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ====== CATEGORIES ====== */}
      {tab === "categories" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <Button variant="primary" onClick={() => setCatModalOpen(true)}>➕ Tambah Kategori</Button>
          </div>
          <div className="grid-3" style={{ gap: "16px" }}>
            {categories.map(c => (
              <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>📂 {c.nama}</div>
                    {c.deskripsi && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>{c.deskripsi}</div>}
                  </div>
                  <button onClick={() => handleDeleteCategory(c.id)} style={{
                    background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444",
                    borderRadius: "8px", width: 32, height: 32, cursor: "pointer", fontSize: "0.9rem",
                  }}>🗑</button>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                  ID: {c.id} · {new Date(c.created_at).toLocaleDateString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ====== VERIFICATIONS ====== */}
      {tab === "verifications" && (
        verifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3>Tidak ada yang menunggu verifikasi</h3>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {verifications.map(p => (
              <div key={p.id} className="card" style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#e2e8f0" }}>User #{p.user_id}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                    {p.alamat && `📍 ${p.alamat}`}
                    {p.nama_orang_tua && ` · 👨‍👩‍👦 ${p.nama_orang_tua}`}
                  </div>
                  <Badge status={p.status_verifikasi} style={{ marginTop: "6px" }} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    {p.foto_ktp && <a href={p.foto_ktp} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#6366f1" }}>🪪 Lihat KTP</a>}
                    {p.foto_selfie_ktp && <a href={p.foto_selfie_ktp} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#6366f1" }}>🤳 Lihat Selfie</a>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <Button variant="success" size="sm" onClick={() => handleVerify(p.user_id, "disetujui")}>✓ Setujui</Button>
                  <Button variant="danger" size="sm" onClick={() => handleVerify(p.user_id, "ditolak")}>✕ Tolak</Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ====== RENTALS ====== */}
      {tab === "rentals" && (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {["", "pending", "disetujui", "sedang_disewa", "selesai", "ditolak"].map(s => (
              <button key={s} onClick={() => setRentalStatusFilter(s)} style={{
                padding: "6px 14px", borderRadius: "9999px", border: "none", cursor: "pointer",
                background: rentalStatusFilter === s ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(30,41,59,0.8)",
                color: rentalStatusFilter === s ? "#fff" : "#64748b", fontSize: "0.8rem", fontWeight: 600,
              }}>{s || "Semua"}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rentals.map(r => <RentalCard key={r.id} rental={r} isAdmin={false} />)}
          </div>
        </>
      )}

      {/* Add Category Modal */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title="Tambah Kategori Baru" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCatModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={savingCat} onClick={handleAddCategory}>Tambah</Button>
          </>
        }
      >
        <form onSubmit={handleAddCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nama Kategori *</label>
            <input id="cat-name" className="form-input" placeholder="Elektronik" value={catForm.nama} onChange={e => setCatForm(p => ({ ...p, nama: e.target.value }))} required minLength={2} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Deskripsi</label>
            <textarea id="cat-desc" className="form-textarea" placeholder="Deskripsi kategori..." value={catForm.deskripsi} onChange={e => setCatForm(p => ({ ...p, deskripsi: e.target.value }))} style={{ minHeight: "80px" }} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
