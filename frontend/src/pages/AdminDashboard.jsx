import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import ItemCard from "../components/ItemCard"
import RentalCard from "../components/RentalCard"
import Modal from "../components/ui/Modal"
import Button from "../components/ui/Button"
import ImageUpload from "../components/ui/ImageUpload"
import Spinner from "../components/Spinner"
import Badge from "../components/ui/Badge"
import {
  fetchMyItems, createItem, updateItem, deleteItem,
  fetchAdminRentals, updateRentalStatus,
  fetchAdminProfile, createAdminProfile, updateAdminProfile,
  fetchCategories,
} from "../services/api"

const defaultItem = { nama: "", deskripsi: "", harga_per_hari: "", stok: 1, foto_url: "", category_id: "" }

export default function AdminDashboard({ addToast }) {
  const { user } = useAuth()
  const [tab, setTab] = useState("items") // items | rentals | profile
  const [items, setItems] = useState([])
  const [rentals, setRentals] = useState([])
  const [profile, setProfile] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [rentalFilter, setRentalFilter] = useState("")

  // Form modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(defaultItem)
  const [saving, setSaving] = useState(false)

  // Profile form
  const [profileForm, setProfileForm] = useState({ nama_usaha: "", alamat_usaha: "", nomor_telepon: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchMyItems()
      setItems(data.items)
    } catch {}
  }, [])

  const loadRentals = useCallback(async () => {
    try {
      const data = await fetchAdminRentals({ status: rentalFilter || undefined })
      setRentals(data.rentals)
    } catch {}
  }, [rentalFilter])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadItems(),
      loadRentals(),
      fetchAdminProfile().then(p => {
        setProfile(p)
        setProfileForm({ nama_usaha: p.nama_usaha || "", alamat_usaha: p.alamat_usaha || "", nomor_telepon: p.nomor_telepon || "" })
      }).catch(() => {}),
      fetchCategories().then(setCategories).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (tab === "rentals") loadRentals() }, [tab, loadRentals])

  const openAdd = () => {
    if (!profile) {
      addToast?.("⚠️ Buat profil usaha terlebih dahulu sebelum menambah barang", "error")
      setTab("profile")
      return
    }
    setEditingItem(null)
    setForm(defaultItem)
    setModalOpen(true)
  }
  
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      nama: item.nama, deskripsi: item.deskripsi || "", harga_per_hari: item.harga_per_hari,
      stok: item.stok, foto_url: item.foto_url || "", category_id: item.category_id || "",
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus barang ini?")) return
    setDeletingId(id)
    try {
      await deleteItem(id)
      addToast?.("Barang dihapus ✓", "success")
      loadItems()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setDeletingId(null) }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        harga_per_hari: parseFloat(form.harga_per_hari),
        stok: parseInt(form.stok),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }
      // foto_url bisa berupa Data URL (base64) atau null
      if (!payload.foto_url) delete payload.foto_url
      if (!payload.deskripsi) delete payload.deskripsi
      if (!payload.category_id) delete payload.category_id

      if (editingItem) {
        await updateItem(editingItem.id, payload)
        addToast?.("Barang berhasil diupdate ✓", "success")
      } else {
        await createItem(payload)
        addToast?.("Barang berhasil ditambahkan ✓", "success")
      }
      setModalOpen(false)
      loadItems()
    } catch (err) {
      const errorMsg = err.message || "Terjadi kesalahan"
      if (errorMsg.includes("profil usaha")) {
        addToast?.("⚠️ " + errorMsg + ". Buat profil usaha terlebih dahulu.", "error")
        setModalOpen(false)
        setTab("profile")
      } else {
        addToast?.(errorMsg, "error")
      }
    }
    finally { setSaving(false) }
  }

  const handleUpdateRentalStatus = async (rentalId, status) => {
    try {
      await updateRentalStatus(rentalId, { status })
      addToast?.(`Status diubah ke "${status}" ✓`, "success")
      loadRentals()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const isNewProfile = !profile
      if (profile) await updateAdminProfile(profileForm)
      else await createAdminProfile(profileForm)
      const updated = await fetchAdminProfile()
      setProfile(updated)
      setProfileForm({ nama_usaha: updated.nama_usaha || "", alamat_usaha: updated.alamat_usaha || "", nomor_telepon: updated.nomor_telepon || "" })
      if (isNewProfile) {
        addToast?.("✅ Profil usaha berhasil dibuat! Sekarang Anda bisa menambah barang.", "success")
        setTimeout(() => setTab("items"), 1500)
      } else {
        addToast?.("Profil usaha tersimpan ✓", "success")
      }
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSavingProfile(false) }
  }

  if (loading) return <Spinner center size="lg" />

  const TABS = [
    { id: "items", label: `📦 Barang (${items.length})` },
    { id: "rentals", label: `📋 Sewa Masuk (${rentals.length})` },
    { id: "profile", label: "🏪 Profil Usaha" },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="page-title">🏪 Dashboard Admin</h1>
            <p className="page-subtitle">Kelola barang sewa dan permintaan penyewaan Anda</p>
          </div>
          {tab === "items" && <Button variant="primary" onClick={openAdd}>➕ Tambah Barang</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(15,23,42,0.6)", borderRadius: "14px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: tab === t.id ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
            color: tab === t.id ? "#fff" : "#64748b",
            fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s ease",
            boxShadow: tab === t.id ? "0 4px 14px rgba(99,102,241,0.3)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "items" && (
        <>
          {!profile && (
            <div style={{
              padding: "16px 20px", marginBottom: "20px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px", color: "#fca5a5",
            }}>
              <strong>⚠️ Profil Usaha Belum Dibuat</strong>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.875rem", color: "#fecaca" }}>
                Anda harus membuat profil usaha terlebih dahulu sebelum bisa menambah barang.{" "}
                <button onClick={() => setTab("profile")} style={{
                  background: "none", border: "none", color: "#fca5a5",
                  textDecoration: "underline", cursor: "pointer", fontWeight: 600,
                }}>
                  Buat profil sekarang →
                </button>
              </p>
            </div>
          )}
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>Belum ada barang</h3>
              <p>Tambah barang pertama Anda untuk mulai berjualan sewa</p>
            </div>
          ) : (
            <div className="grid-auto">
              {items.map(item => (
                <ItemCard key={item.id} item={item} role={user?.role} onEdit={openEdit} onDelete={handleDelete} deletingId={deletingId} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "rentals" && (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {["", "pending", "disetujui", "sedang_disewa", "selesai", "ditolak"].map(s => (
              <button key={s} onClick={() => setRentalFilter(s)} style={{
                padding: "6px 14px", borderRadius: "9999px", border: "none", cursor: "pointer",
                background: rentalFilter === s ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(30,41,59,0.8)",
                color: rentalFilter === s ? "#fff" : "#64748b", fontSize: "0.8rem", fontWeight: 600,
                transition: "all 0.15s ease",
              }}>{s || "Semua"}</button>
            ))}
          </div>
          {rentals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>Tidak ada permintaan sewa</h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rentals.map(r => <RentalCard key={r.id} rental={r} isAdmin onUpdateStatus={handleUpdateRentalStatus} />)}
            </div>
          )}
        </>
      )}

      {tab === "profile" && (
        <div className="card" style={{ maxWidth: "560px" }}>
          <h3 style={{ marginBottom: "20px" }}>Profil Usaha</h3>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nama Usaha *</label>
              <input id="admin-store-name" className="form-input" placeholder="Toko Sewa Jaya" value={profileForm.nama_usaha} onChange={e => setProfileForm(p => ({ ...p, nama_usaha: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Alamat Usaha</label>
              <input id="admin-address" className="form-input" placeholder="Jl. Soekarno-Hatta No.1" value={profileForm.alamat_usaha} onChange={e => setProfileForm(p => ({ ...p, alamat_usaha: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nomor Telepon</label>
              <input id="admin-phone" className="form-input" placeholder="08123456789" value={profileForm.nomor_telepon} onChange={e => setProfileForm(p => ({ ...p, nomor_telepon: e.target.value }))} />
            </div>
            <Button type="submit" variant="primary" loading={savingProfile}>💾 Simpan Profil Usaha</Button>
          </form>
        </div>
      )}

      {/* Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Barang" : "Tambah Barang Baru"} size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveItem}>
              {editingItem ? "Simpan Perubahan" : "Tambah Barang"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveItem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nama Barang *</label>
            <input id="item-name" className="form-input" placeholder="Kamera Sony A7III" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Deskripsi</label>
            <textarea id="item-desc" className="form-textarea" placeholder="Jelaskan kondisi dan fitur barang..." value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} style={{ minHeight: "80px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Harga/Hari (Rp) *</label>
              <input id="item-price" type="number" min="0" className="form-input" placeholder="250000" value={form.harga_per_hari} onChange={e => setForm(p => ({ ...p, harga_per_hari: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Stok</label>
              <input id="item-stok" type="number" min="0" className="form-input" placeholder="1" value={form.stok} onChange={e => setForm(p => ({ ...p, stok: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Kategori</label>
            <select id="item-category" className="form-select" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
              <option value="">Tanpa Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>
          </div>
          <ImageUpload
            label="Foto Barang"
            placeholder="📦"
            helpText="JPG, PNG, WEBP · Maks 2MB · Drag & drop atau klik"
            value={form.foto_url || null}
            onChange={(dataUrl) => setForm(p => ({ ...p, foto_url: dataUrl || "" }))}
            onError={(msg) => addToast?.(msg, "error")}
            previewHeight={180}
          />
        </form>
      </Modal>
    </div>
  )
}
