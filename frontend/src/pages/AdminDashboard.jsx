import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { formatPrice } from "../lib/utils"
import {
  fetchMyItems, createItem, updateItem, deleteItem,
  fetchAdminRentals, updateRentalStatus,
  fetchAdminProfile, createAdminProfile, updateAdminProfile,
  fetchCategories, fetchAdminPayments, confirmPayment,
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
  CreditCard, Eye, ThumbsUp, ThumbsDown,
} from "lucide-react"

const defaultItem = { nama: "", deskripsi: "", harga_per_hari: "", stok: 1, foto_url: "", category_id: "" }

function AdminRentalCard({ rental, onUpdateStatus, payment, onViewBukti }) {
  const item = rental.item
  const hasBukti = !!payment?.bukti_pembayaran
  const isPaid = payment?.status === "completed"
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground">{item?.nama || `Item #${rental.item_id}`}</h3>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Penyewa: <span className="font-medium text-foreground">{rental.user?.nama || `User #${rental.user_id}`}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(rental.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(rental.tanggal_selesai).toLocaleDateString("id-ID")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={rental.status} />
                {/* payment badge */}
                {isPaid && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Lunas
                  </span>
                )}
                {hasBukti && !isPaid && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    ⏳ Bukti Dikirim
                  </span>
                )}
              </div>
            </div>
            <div className="text-lg font-bold text-primary mt-2">{formatPrice(rental.total_harga)}</div>
            {rental.catatan && <p className="text-xs text-muted-foreground mt-1">{rental.catatan}</p>}

            {/* Bukti mini preview */}
            {hasBukti && (
              <button
                onClick={() => onViewBukti(payment.bukti_pembayaran)}
                className="mt-2 flex items-center gap-2 group"
                title="Lihat bukti pembayaran"
              >
                <img
                  src={payment.bukti_pembayaran}
                  alt="bukti"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 group-hover:opacity-80 transition"
                />
                <span className="text-xs text-primary underline">Lihat bukti bayar</span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {rental.status === "pending" && (
              <>
                <Button size="sm" variant="success" onClick={() => onUpdateStatus(rental.id, "disetujui")}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(rental.id, "ditolak")}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                </Button>
              </>
            )}
            {rental.status === "disetujui" && (
              <Button size="sm" onClick={() => onUpdateStatus(rental.id, "sedang_disewa")}>Proses Sewa</Button>
            )}
            {rental.status === "sedang_disewa" && (
              <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(rental.id, "selesai")}>Selesai</Button>
            )}
          </div>
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
  const [profileForm, setProfileForm] = useState({ nama_usaha: "", alamat_usaha: "", nomor_telepon: "", nomor_rekening: "", foto_qris: "" })
  const [qrisUploading, setQrisUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [payments, setPayments]           = useState([])
  const [paymentFilter, setPaymentFilter] = useState("")
  const [previewBukti, setPreviewBukti]   = useState(null) // base64 string
  const [confirmingId, setConfirmingId]   = useState(null)

  const loadItems = useCallback(async () => {
    try { const data = await fetchMyItems(); setItems(data.items) } catch {}
  }, [])

  const loadRentals = useCallback(async () => {
    try { const data = await fetchAdminRentals({ status: rentalFilter || undefined }); setRentals(data.rentals) } catch {}
  }, [rentalFilter])

  const loadPayments = useCallback(async () => {
    try {
      const data = await fetchAdminPayments({ status: paymentFilter || undefined, limit: 50 })
      setPayments(Array.isArray(data) ? data : (data?.payments || []))
    } catch {}
  }, [paymentFilter])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadItems(),
      loadRentals(),
      loadPayments(),
      fetchAdminProfile().then(p => {
        setProfile(p)
        setProfileForm({
          nama_usaha: p.nama_usaha || "",
          alamat_usaha: p.alamat_usaha || "",
          nomor_telepon: p.nomor_telepon || "",
          nomor_rekening: p.nomor_rekening || "",
          foto_qris: p.foto_qris || "",
        })
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

  const handleConfirmPayment = async (paymentId, statusVal) => {
    setConfirmingId(paymentId)
    try {
      const updatedPay = await confirmPayment(paymentId, statusVal)
      // Jika pembayaran dikonfirmasi (completed), setujui rental yang masih pending
      if (statusVal === "completed" && updatedPay?.rental_id) {
        const matchRental = rentals.find(r => r.id === updatedPay.rental_id)
        if (matchRental?.status === "pending") {
          await updateRentalStatus(matchRental.id, { status: "disetujui" }).catch(() => {})
        }
      }
      addToast?.(
        statusVal === "completed" ? "Pembayaran dikonfirmasi & sewa disetujui!" : "Bukti pembayaran ditolak",
        statusVal === "completed" ? "success" : "error"
      )
      await Promise.all([loadPayments(), loadRentals()])
    } catch (err) { addToast?.(err.message, "error") }
    finally { setConfirmingId(null) }
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

  const handleQrisChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        setProfileForm(p => ({ ...p, foto_qris: canvas.toDataURL("image/png", 0.9) }))
        setQrisUploading(false)
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
          <TabsTrigger value="payments" onClick={loadPayments}>
            <CreditCard className="w-4 h-4 mr-1" /> Pembayaran
            {payments.filter(p => p.status === "completed" && p.bukti_pembayaran).length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {payments.filter(p => p.status === "completed" && p.bukti_pembayaran).length}
              </span>
            )}
          </TabsTrigger>
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
                <AdminRentalCard
                  key={r.id}
                  rental={r}
                  onUpdateStatus={handleUpdateRentalStatus}
                  payment={payments.find(p => p.rental_id === r.id)}
                  onViewBukti={setPreviewBukti}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* === PEMBAYARAN === */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-foreground">Pembayaran Masuk</h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: "", label: "Semua" },
                { v: "pending", label: "Menunggu" },
                { v: "completed", label: "Selesai" },
                { v: "failed", label: "Ditolak" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => { setPaymentFilter(v); loadPayments() }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    paymentFilter === v
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Belum ada pembayaran masuk</p>
              <p className="text-sm text-muted-foreground mt-1">Pembayaran akan muncul setelah penyewa mengajukan sewa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map(pay => {
                const payStatusCfg = {
                  pending:   { cls: "bg-amber-100 text-amber-700",  label: "Belum Dikonfirmasi" },
                  completed: { cls: "bg-green-100 text-green-700",  label: "Terkonfirmasi" },
                  failed:    { cls: "bg-red-100 text-red-700",      label: "Ditolak" },
                  cancelled: { cls: "bg-slate-100 text-slate-500",  label: "Dibatalkan" },
                }
                const sc = payStatusCfg[pay.status] || payStatusCfg.pending
                const isConfirming = confirmingId === pay.id
                // find matching rental for status info
                const matchRental = rentals.find(r => r.id === pay.rental_id)
                const rentalPending = matchRental?.status === "pending"
                return (
                  <Card key={pay.id} className={pay.bukti_pembayaran && pay.status === "pending" ? "border-amber-200 shadow-amber-50 shadow" : ""}>
                    <CardContent className="p-4">
                      {/* Header badge jika ada bukti & belum dikonfirmasi */}
                      {pay.bukti_pembayaran && pay.status === "pending" && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-xl text-xs font-semibold text-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Bukti pembayaran diterima — perlu konfirmasi
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Bukti foto thumbnail */}
                        {pay.bukti_pembayaran ? (
                          <button
                            onClick={() => setPreviewBukti(pay.bukti_pembayaran)}
                            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-200 flex-shrink-0 relative group"
                            title="Lihat bukti pembayaran"
                          >
                            <img src={pay.bukti_pembayaran} alt="bukti" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition gap-1">
                              <Eye className="w-5 h-5 text-white" />
                              <span className="text-[10px] text-white font-semibold">Lihat</span>
                            </div>
                          </button>
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-slate-100 flex-shrink-0 flex flex-col items-center justify-center gap-1 text-slate-300">
                            <CreditCard className="w-7 h-7" />
                            <span className="text-[10px] font-medium">Belum upload</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                            <div>
                              <p className="font-bold text-foreground">
                                {matchRental?.item?.nama || `Rental #${pay.rental_id}`}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {matchRental?.user?.nama || `User #${pay.user_id}`} · {pay.metode_pembayaran}
                              </p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${sc.cls}`}>{sc.label}</span>
                          </div>
                          <p className="text-xl font-extrabold text-primary">{formatPrice(pay.jumlah)}</p>
                          {pay.catatan && <p className="text-xs text-muted-foreground mt-1 italic">"{pay.catatan}"</p>}
                          {!pay.bukti_pembayaran && (
                            <p className="text-xs text-amber-600 mt-1.5 font-medium">⏳ Menunggu user upload bukti transfer</p>
                          )}
                        </div>

                        {/* Actions */}
                        {pay.status === "completed" && (
                          <div className="flex items-center flex-shrink-0">
                            <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-5 h-5" /> Lunas
                            </span>
                          </div>
                        )}

                        {pay.bukti_pembayaran && pay.status === "pending" && (
                          <div className="flex sm:flex-col gap-2 flex-shrink-0 justify-end">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={isConfirming}
                              onClick={() => handleConfirmPayment(pay.id, "completed")}
                            >
                              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                              {isConfirming ? "Memproses..." : "Setujui & Konfirmasi"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isConfirming}
                              onClick={() => handleConfirmPayment(pay.id, "failed")}
                            >
                              <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Tolak Bukti
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* === PROFILE === */}
        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Profil Usaha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* ── Info Dasar */}
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

                <Separator />

                {/* ── Info Pembayaran */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Info Pembayaran</p>
                  <p className="text-xs text-muted-foreground mb-3">Ditampilkan ke penyewa saat mengajukan sewa</p>
                </div>
                <div className="space-y-2">
                  <Label>Nomor Rekening / Bank</Label>
                  <Input
                    placeholder="BCA 1234567890 a/n Nama Anda"
                    value={profileForm.nomor_rekening}
                    onChange={(e) => setProfileForm(p => ({ ...p, nomor_rekening: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Contoh: BRI 009301234567 a/n Toko Sewa Jaya</p>
                </div>

                <div className="space-y-2">
                  <Label>Gambar QRIS (Opsional)</Label>
                  {profileForm.foto_qris ? (
                    <div className="relative inline-block">
                      <img
                        src={profileForm.foto_qris}
                        alt="QRIS"
                        className="w-48 h-48 object-contain rounded-2xl border border-slate-200 bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setProfileForm(p => ({ ...p, foto_qris: "" }))}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow hover:opacity-80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors ${qrisUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        {qrisUploading ? (
                          <span className="text-sm">Memproses...</span>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 mb-1" />
                            <span className="text-sm font-medium text-center px-2">Upload foto QRIS</span>
                            <span className="text-xs">JPG / PNG</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleQrisChange}
                        disabled={qrisUploading}
                      />
                    </label>
                  )}
                </div>

                <Button type="submit" loading={savingProfile}>
                  <Save className="w-4 h-4 mr-2" /> Simpan Profil
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

      {/* ── BUKTI PREVIEW LIGHTBOX ── */}
      {previewBukti && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewBukti(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewBukti(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-slate-600 hover:text-destructive z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewBukti} alt="Bukti Pembayaran" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
            <p className="text-center text-white/70 text-xs mt-3">Bukti Pembayaran · Klik di luar untuk tutup</p>
          </div>
        </div>
      )}
    </div>
  )
}
