import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { formatPrice } from "../lib/utils"
import {
  fetchMyItems, createItem, updateItem, deleteItem,
  fetchAdminRentals, updateRentalStatus,
  fetchAdminProfile, createAdminProfile, updateAdminProfile,
  fetchCategories,
} from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { StatusBadge } from "../components/ui/Badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Skeleton } from "../components/ui/skeleton"
import { Separator } from "../components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog"
import {
  Package, ClipboardList, Store, Plus, Pencil, Trash2,
  Calendar, CheckCircle, XCircle, Save, AlertTriangle, ImageIcon, X,
} from "lucide-react"

const defaultItem = { nama: "", deskripsi: "", harga_per_hari: "", stok: 1, foto_url: "", category_id: "" }

function AdminRentalCard({ rental, onUpdateStatus }) {
  const item = rental.item
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground">{item?.nama || `Item #${rental.item_id}`}</h3>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Penyewa: {rental.user?.nama || `User #${rental.user_id}`}
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(rental.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(rental.tanggal_selesai).toLocaleDateString("id-ID")}
                </div>
              </div>
              <StatusBadge status={rental.status} />
            </div>
            <div className="text-lg font-bold text-primary mt-2">{formatPrice(rental.total_harga)}</div>
            {rental.catatan && <p className="text-xs text-muted-foreground mt-1">{rental.catatan}</p>}
          </div>
          {rental.status === "pending" && (
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="success" onClick={() => onUpdateStatus(rental.id, "disetujui")}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(rental.id, "ditolak")}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
              </Button>
            </div>
          )}
          {rental.status === "disetujui" && (
            <Button size="sm" onClick={() => onUpdateStatus(rental.id, "sedang_disewa")}>Proses Sewa</Button>
          )}
          {rental.status === "sedang_disewa" && (
            <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(rental.id, "selesai")}>Selesai</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard({ addToast }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [rentals, setRentals] = useState([])
  const [profile, setProfile] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [rentalFilter, setRentalFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(defaultItem)
  const [saving, setSaving] = useState(false)
  const [fotoUploading, setFotoUploading] = useState(false)
  const [profileForm, setProfileForm] = useState({ nama_usaha: "", alamat_usaha: "", nomor_telepon: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  const loadItems = useCallback(async () => {
    try { const data = await fetchMyItems(); setItems(data.items) } catch {}
  }, [])

  const loadRentals = useCallback(async () => {
    try { const data = await fetchAdminRentals({ status: rentalFilter || undefined }); setRentals(data.rentals) } catch {}
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

  const openAdd = () => {
    if (!profile) {
      addToast?.("Buat profil usaha terlebih dahulu", "error")
      return
    }
    setEditingItem(null); setForm(defaultItem); setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      nama: item.nama, deskripsi: item.deskripsi || "",
      harga_per_hari: item.harga_per_hari, stok: item.stok,
      foto_url: item.foto_url || "", category_id: item.category_id || "",
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus barang ini?")) return
    setDeletingId(id)
    try { await deleteItem(id); addToast?.("Barang dihapus", "success"); loadItems() }
    catch (err) { addToast?.(err.message, "error") }
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
      if (!payload.foto_url) delete payload.foto_url
      if (!payload.deskripsi) delete payload.deskripsi
      if (!payload.category_id) delete payload.category_id

      if (editingItem) {
        await updateItem(editingItem.id, payload)
        addToast?.("Barang berhasil diupdate", "success")
      } else {
        await createItem(payload)
        addToast?.("Barang ditambahkan (demo)", "success")
      }
      setModalOpen(false); loadItems()
    } catch (err) {
      addToast?.(err.message, "error")
    } finally { setSaving(false) }
  }

  const handleUpdateRentalStatus = async (rentalId, status) => {
    try {
      await updateRentalStatus(rentalId, { status })
      addToast?.(`Status diubah ke "${status}"`, "success")
      loadRentals()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      if (profile) await updateAdminProfile(profileForm)
      else await createAdminProfile(profileForm)
      const updated = await fetchAdminProfile()
      setProfile(updated)
      setProfileForm({ nama_usaha: updated.nama_usaha || "", alamat_usaha: updated.alamat_usaha || "", nomor_telepon: updated.nomor_telepon || "" })
      addToast?.("Profil usaha disimpan", "success")
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSavingProfile(false) }
  }

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      addToast?.("Ukuran file maksimal 5MB", "error")
      e.target.value = ""
      return
    }
    setFotoUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL("image/jpeg", 0.75)
        setForm(p => ({ ...p, foto_url: compressed }))
        setFotoUploading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    )
  }

  const imgFallback = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1b7e6a&color=fff&size=400&bold=true`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Kelola barang sewa dan permintaan penyewaan</p>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Package className="w-4 h-4 mr-1" /> Barang ({items.length})</TabsTrigger>
          <TabsTrigger value="rentals" onClick={loadRentals}><ClipboardList className="w-4 h-4 mr-1" /> Sewa Masuk</TabsTrigger>
          <TabsTrigger value="profile"><Store className="w-4 h-4 mr-1" /> Profil Usaha</TabsTrigger>
        </TabsList>

        {/* === ITEMS === */}
        <TabsContent value="items" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Daftar Barang Saya</h2>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Tambah Barang Baru</Button>
          </div>

          {!profile && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-destructive">Profil Usaha Belum Dibuat</div>
                <div className="text-sm text-muted-foreground">Buat profil usaha terlebih dahulu di tab "Profil Usaha"</div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Belum ada barang</h3>
              <p className="text-sm text-muted-foreground mt-1">Tambah barang pertama untuk mulai sewakan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={item.foto_url || imgFallback(item.nama)}
                      alt={item.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = imgFallback(item.nama) }}
                    />
                    <div className="absolute top-2 right-2"><StatusBadge status={item.status} /></div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground line-clamp-1">{item.nama}</h3>
                    <div className="text-lg font-extrabold text-primary mt-1">{formatPrice(item.harga_per_hari)}<span className="text-xs font-normal text-muted-foreground">/hari</span></div>
                    <div className="text-xs text-muted-foreground mt-1">Stok: {item.stok}</div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} loading={deletingId === item.id}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === RENTALS === */}
        <TabsContent value="rentals" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {["", "pending", "disetujui", "sedang_disewa", "selesai", "ditolak"].map(s => (
              <Button key={s} variant={rentalFilter === s ? "default" : "outline"} size="sm" className="rounded-full"
                onClick={() => setRentalFilter(s)}
              >
                {s || "Semua"}
              </Button>
            ))}
          </div>
          {rentals.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Tidak ada permintaan sewa</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map(r => (
                <AdminRentalCard key={r.id} rental={r} onUpdateStatus={handleUpdateRentalStatus} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* === PROFILE === */}
        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Profil Usaha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Usaha *</Label>
                  <Input placeholder="Sewa Jaya" value={profileForm.nama_usaha}
                    onChange={(e) => setProfileForm(p => ({ ...p, nama_usaha: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Alamat Usaha</Label>
                  <Input placeholder="Jl. Soekarno-Hatta No.1" value={profileForm.alamat_usaha}
                    onChange={(e) => setProfileForm(p => ({ ...p, alamat_usaha: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input placeholder="08123456789" value={profileForm.nomor_telepon}
                    onChange={(e) => setProfileForm(p => ({ ...p, nomor_telepon: e.target.value }))} />
                </div>
                <Button type="submit" loading={savingProfile}>
                  <Save className="w-4 h-4 mr-2" /> Simpan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Ubah detail barang sewa" : "Isi detail barang yang ingin disewakan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Barang *</Label>
              <Input placeholder="Kamera Sony A7III" value={form.nama}
                onChange={(e) => setForm(p => ({ ...p, nama: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Jelaskan kondisi dan fitur barang..."
                value={form.deskripsi}
                onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga per Hari (Rp) *</Label>
                <Input type="number" min="0" placeholder="250000" value={form.harga_per_hari}
                  onChange={(e) => setForm(p => ({ ...p, harga_per_hari: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Stok</Label>
                <Input type="number" min="0" placeholder="1" value={form.stok}
                  onChange={(e) => setForm(p => ({ ...p, stok: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.category_id}
                onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">Tanpa Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Foto Barang</Label>
              {form.foto_url ? (
                <div className="relative inline-block w-full">
                  <img
                    src={form.foto_url}
                    alt="Preview foto barang"
                    className="w-full max-h-40 object-contain rounded-lg border bg-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, foto_url: "" }))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${fotoUploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    {fotoUploading ? (
                      <span className="text-sm">Memproses...</span>
                    ) : (
                      <>
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-sm font-medium">Klik untuk pilih foto</span>
                        <span className="text-xs">JPG, PNG, WEBP, GIF · maks 2MB</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFotoChange}
                    disabled={fotoUploading}
                  />
                </label>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={saving}>
                {editingItem ? "Simpan" : "Tambah Barang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
