/**
 * AdminDashboard — Sewain
 * Modern minimalist · base hijau pekat + putih.
 * Fitur: items CRUD, rentals, wallet, profil usaha.
 */
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { formatPrice } from "../lib/utils"
import {
  fetchMyItems, createItem, updateItem, deleteItem,
  fetchAdminRentals, updateRentalStatus,
  fetchAdminProfile, createAdminProfile, updateAdminProfile,
  fetchCategories, fetchAdminPayments, confirmPayment,
  fetchWallet, fetchWalletTransactions, requestWithdrawal, fetchMyWithdrawals,
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
  Calendar, CheckCircle, XCircle, Save, AlertTriangle, ImageIcon, X, Eye, CreditCard, MapPin,
  Wallet, ArrowDownToLine, Clock, Ban,
} from "lucide-react"
import MapPicker from "../components/MapPicker"
import { getRentalDeadline, formatDeadline } from "../lib/rental"

const defaultItem = { nama: "", deskripsi: "", harga_per_hari: "", stok: 1, foto_url: "", category_id: "" }

const PAYMENT_STATUS_LABEL = {
  pending: { label: "Menunggu Pembayaran", cls: "bg-amber-100 text-amber-800" },
  completed: { label: "Lunas", cls: "bg-primary/10 text-primary" },
  failed: { label: "Ditolak", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Dibatalkan", cls: "bg-muted text-muted-foreground" },
}

/* ─── Admin Countdown (sisa waktu sewa) ───────────────────── */
function AdminCountdown({ rental }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [expired, setExpired] = useState(false)

  const deadline = getRentalDeadline(rental)
  const deadlineMs = deadline ? deadline.getTime() : null
  const deadlineLabel = deadline ? formatDeadline(deadline) : ""
  const fromPickup = !!rental?.due_at

  useEffect(() => {
    if (!deadlineMs) return
    const calc = () => {
      const diff = deadlineMs - Date.now()
      if (diff <= 0) { setExpired(true); return }
      setExpired(false)
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    calc()
    const tick = setInterval(calc, 1000)
    return () => clearInterval(tick)
  }, [deadlineMs])

  if (expired) {
    return (
      <div className="mt-3 flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg w-fit">
          <AlertTriangle className="w-3.5 h-3.5" /> Waktu sewa habis
        </div>
        {deadlineLabel && (
          <span className="text-[10px] text-muted-foreground">
            Berakhir {deadlineLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Sisa:</span>
        <div className="flex items-center gap-1 font-mono font-bold text-foreground">
          {t.d > 0 && <span className="bg-secondary px-1.5 py-0.5 rounded">{t.d}h</span>}
          <span className="bg-secondary px-1.5 py-0.5 rounded">{String(t.h).padStart(2, "0")}j</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded">{String(t.m).padStart(2, "0")}m</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded">{String(t.s).padStart(2, "0")}d</span>
        </div>
      </div>
      {deadlineLabel && (
        <span className="text-[10px] text-muted-foreground">
          {fromPickup ? "Berakhir " : "Tanggal selesai "}
          <span className="font-semibold text-foreground">{deadlineLabel}</span>
          {fromPickup ? " · 24 jam sejak pengambilan" : ""}
        </span>
      )}
    </div>
  )
}

/* ─── AdminRentalCard ─────────────────────────────────────── */
function AdminRentalCard({ rental, payment, onUpdateStatus, onViewBukti, onConfirmPayment, onRejectPayment, busy }) {
  const item = rental.item
  const paymentMeta = payment ? PAYMENT_STATUS_LABEL[payment.status] : null
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold tracking-tight">{item?.nama || `Item #${rental.item_id}`}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Penyewa: <span className="font-medium text-foreground">{rental.user?.nama || `User #${rental.user_id}`}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(rental.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(rental.tanggal_selesai).toLocaleDateString("id-ID")}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <StatusBadge status={rental.status} />
              {paymentMeta && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${paymentMeta.cls}`}>
                  <CreditCard className="w-3 h-3" /> {paymentMeta.label}
                </span>
              )}
            </div>
          </div>
          <p className="text-xl font-bold tracking-tight mt-3">{formatPrice(rental.total_harga)}</p>
          {rental.catatan && <p className="text-xs text-muted-foreground mt-1">{rental.catatan}</p>}

          {payment && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {payment.metode_pembayaran === "midtrans" ? (
                <span className="text-xs text-muted-foreground italic">
                  {payment.status === "completed"
                    ? `Dibayar via Midtrans${payment.payment_channel ? ` (${payment.payment_channel.replace(/_/g, " ")})` : ""}`
                    : "Menunggu pembayaran via Midtrans"}
                </span>
              ) : payment.bukti_pembayaran ? (
                <button
                  onClick={() => onViewBukti(payment)}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> Lihat bukti pembayaran
                </button>
              ) : (
                <span className="text-xs text-muted-foreground italic">Bukti belum diupload</span>
              )}
            </div>
          )}

          {/* Countdown sisa waktu sewa (hanya untuk sedang_disewa) */}
          {rental.status === "sedang_disewa" && (
            <AdminCountdown rental={rental} />
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {rental.status === "pending" && (
            <>
              <Button size="sm" variant="success" className="rounded-full" onClick={() => onUpdateStatus(rental.id, "disetujui")}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
              </Button>
              <Button size="sm" variant="destructive" className="rounded-full" onClick={() => onUpdateStatus(rental.id, "ditolak")}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
              </Button>
            </>
          )}
          {rental.status === "disetujui" && (
            <>
              {payment?.status === "pending" && payment?.bukti_pembayaran && payment?.metode_pembayaran !== "midtrans" && (
                <>
                  <Button size="sm" variant="success" className="rounded-full" onClick={() => onConfirmPayment(payment.id)}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi bayar
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-full" onClick={() => onRejectPayment(payment.id)}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak bayar
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => onUpdateStatus(rental.id, "sedang_disewa")}>Proses sewa</Button>
            </>
          )}
          {rental.status === "sedang_disewa" && (
            <>
              {rental.return_requested_at ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 whitespace-nowrap">
                    <Clock className="w-3 h-3" /> User minta kembalikan
                  </span>
                  <Button
                    size="sm"
                    variant="success"
                    className="rounded-full"
                    onClick={() => onUpdateStatus(rental.id, "selesai")}
                    loading={busy}
                    disabled={busy}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi terima
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => onUpdateStatus(rental.id, "selesai")}
                  loading={busy}
                  disabled={busy}
                >
                  Tandai selesai
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


/* ─── Main Component ──────────────────────────────────────── */
export default function AdminDashboard({ addToast }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [rentals, setRentals] = useState([])
  const [profile, setProfile] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [rentalFilter, setRentalFilter] = useState("")
  const [rentalsLoading, setRentalsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(defaultItem)
  const [saving, setSaving] = useState(false)
  const [fotoUploading, setFotoUploading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nama_usaha: "", alamat_usaha: "", nomor_telepon: "",
    latitude: null, longitude: null,
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [rentalUpdatingId, setRentalUpdatingId] = useState(null)
  const [previewBukti, setPreviewBukti] = useState(null)
  const [paymentMap, setPaymentMap] = useState({})

  // Wallet
  const [wallet, setWallet] = useState(null)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [wdModalOpen, setWdModalOpen] = useState(false)
  const [wdForm, setWdForm] = useState({ jumlah: "", bank_name: "", account_number: "", account_holder: "" })
  const [wdSubmitting, setWdSubmitting] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)

  const loadItems = useCallback(async () => {
    try { const data = await fetchMyItems(); setItems(data.items) } catch {}
  }, [])

  const loadRentals = useCallback(async () => {
    setRentalsLoading(true)
    try {
      const [rentalData, paymentData] = await Promise.all([
        fetchAdminRentals({ status: rentalFilter || undefined }),
        fetchAdminPayments({ limit: 100 }),
      ])
      setRentals(rentalData.rentals || [])
      const map = {}
      for (const p of (paymentData.payments || [])) map[p.rental_id] = p
      setPaymentMap(map)
    } catch { setRentals([]) }
    finally { setRentalsLoading(false) }
  }, [rentalFilter])

  const loadWallet = useCallback(async () => {
    setWalletLoading(true)
    try {
      const [w, tx, wd] = await Promise.all([
        fetchWallet(),
        fetchWalletTransactions({ limit: 10 }),
        fetchMyWithdrawals({ limit: 20 }),
      ])
      setWallet(w)
      setWalletTransactions(tx.transactions || [])
      setWithdrawals(wd.withdrawals || [])
    } catch {} finally { setWalletLoading(false) }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadItems(),
      loadRentals(),
      fetchAdminProfile().then(p => {
        setProfile(p)
        setProfileForm({
          nama_usaha: p.nama_usaha || "", alamat_usaha: p.alamat_usaha || "",
          nomor_telepon: p.nomor_telepon || "",
          latitude: p.latitude || null, longitude: p.longitude || null,
        })
      }).catch(() => {}),
      fetchCategories().then(setCategories).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadRentals() }, [rentalFilter])

  /* ── handlers ── */
  const openAdd = () => {
    if (!profile) { addToast?.("Buat profil usaha terlebih dahulu", "error"); return }
    setEditingItem(null); setForm(defaultItem); setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ nama: item.nama, deskripsi: item.deskripsi || "", harga_per_hari: item.harga_per_hari, stok: item.stok, foto_url: item.foto_url || "", category_id: item.category_id || "", status: item.status || "available" })
    setModalOpen(true)
  }
  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus barang ini? Jika ada proses sewa aktif (pending/disetujui/sedang disewa), barang akan dinonaktifkan. Jika tidak ada, barang akan dihapus permanen.")) return
    setDeletingId(id)
    try {
      await deleteItem(id)
      addToast?.("Barang berhasil dihapus/dinonaktifkan", "success")
      loadItems()
    }
    catch (err) { addToast?.(err.message, "error") }
    finally { setDeletingId(null) }
  }
  const handleSaveItem = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, harga_per_hari: parseFloat(form.harga_per_hari), stok: parseInt(form.stok), category_id: form.category_id ? parseInt(form.category_id) : null }
      if (!payload.foto_url) delete payload.foto_url
      if (!payload.deskripsi) delete payload.deskripsi
      if (!payload.category_id) delete payload.category_id
      if (!editingItem) delete payload.status
      if (editingItem) { await updateItem(editingItem.id, payload); addToast?.("Barang diupdate", "success") }
      else { await createItem(payload); addToast?.("Barang ditambahkan", "success") }
      setModalOpen(false); loadItems()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSaving(false) }
  }
  const handleUpdateRentalStatus = async (rentalId, status) => {
    setRentalUpdatingId(rentalId)
    try { await updateRentalStatus(rentalId, { status }); addToast?.(`Status → "${status}"`, "success"); await Promise.all([loadRentals(), loadItems()]) }
    catch (err) { addToast?.(err.message, "error") }
    finally { setRentalUpdatingId(null) }
  }
  const handleConfirmPayment = async (paymentId) => {
    if (!confirm("Konfirmasi pembayaran ini?")) return
    try { await confirmPayment(paymentId, "completed"); addToast?.("Pembayaran dikonfirmasi", "success"); setPreviewBukti(null); await loadRentals() }
    catch (err) { addToast?.(err.message, "error") }
  }
  const handleRejectPayment = async (paymentId) => {
    if (!confirm("Tolak pembayaran ini?")) return
    try { await confirmPayment(paymentId, "failed"); addToast?.("Pembayaran ditolak", "success"); setPreviewBukti(null); await loadRentals() }
    catch (err) { addToast?.(err.message, "error") }
  }
  const handleWithdraw = async (e) => {
    e.preventDefault(); setWdSubmitting(true)
    try {
      await requestWithdrawal({ jumlah: parseFloat(wdForm.jumlah), bank_name: wdForm.bank_name, account_number: wdForm.account_number, account_holder: wdForm.account_holder })
      addToast?.("Penarikan diajukan", "success"); setWdModalOpen(false)
      setWdForm({ jumlah: "", bank_name: "", account_number: "", account_holder: "" }); await loadWallet()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setWdSubmitting(false) }
  }
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!profileForm.nama_usaha?.trim()) { addToast?.("Nama usaha wajib diisi", "error"); return }
    if (!profileForm.alamat_usaha?.trim()) { addToast?.("Alamat usaha wajib diisi", "error"); return }
    if (!profileForm.nomor_telepon?.trim()) { addToast?.("Nomor telepon wajib diisi", "error"); return }
    if (!profileForm.latitude || !profileForm.longitude) { addToast?.("Titik lokasi di peta wajib diisi", "error"); return }
    setSavingProfile(true)
    try {
      const payload = { nama_usaha: profileForm.nama_usaha, alamat_usaha: profileForm.alamat_usaha, nomor_telepon: profileForm.nomor_telepon, latitude: profileForm.latitude, longitude: profileForm.longitude }
      if (profile) await updateAdminProfile(payload)
      else await createAdminProfile(payload)
      const updated = await fetchAdminProfile()
      setProfile(updated)
      setProfileForm({ nama_usaha: updated.nama_usaha || "", alamat_usaha: updated.alamat_usaha || "", nomor_telepon: updated.nomor_telepon || "", latitude: updated.latitude || null, longitude: updated.longitude || null })
      addToast?.("Profil usaha disimpan", "success")
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSavingProfile(false) }
  }
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { addToast?.("Maks 5MB", "error"); e.target.value = ""; return }
    setFotoUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800; let { width, height } = img
        if (width > MAX || height > MAX) { if (width > height) { height = Math.round(height * MAX / width); width = MAX } else { width = Math.round(width * MAX / height); height = MAX } }
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        setForm(p => ({ ...p, foto_url: canvas.toDataURL("image/jpeg", 0.75) })); setFotoUploading(false)
      }; img.src = ev.target.result
    }; reader.readAsDataURL(file); e.target.value = ""
  }
  const imgFallback = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a6e4a&color=fff&size=400&bold=true`

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-3xl" />)}
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Panel admin</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola barang sewa dan permintaan penyewaan</p>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="rounded-full p-1 bg-muted/40 border border-border/60">
          <TabsTrigger value="items" className="rounded-full"><Package className="w-4 h-4 mr-1.5" /> Barang ({items.length})</TabsTrigger>
          <TabsTrigger value="rentals" className="rounded-full" onClick={loadRentals}><ClipboardList className="w-4 h-4 mr-1.5" /> Sewa masuk</TabsTrigger>
          <TabsTrigger value="wallet" className="rounded-full" onClick={loadWallet}><Wallet className="w-4 h-4 mr-1.5" /> Saldo</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-full"><Store className="w-4 h-4 mr-1.5" /> Profil usaha</TabsTrigger>
        </TabsList>

        {/* ═══ ITEMS ═══ */}
        <TabsContent value="items" className="space-y-5 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">Daftar barang saya</h2>
            <Button onClick={openAdd} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Tambah barang</Button>
          </div>

          {!profile && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">Profil usaha belum dibuat</p>
                <p className="text-xs text-muted-foreground">Buat profil usaha terlebih dahulu di tab "Profil usaha"</p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Belum ada barang</h3>
              <p className="text-sm text-muted-foreground mt-1">Tambah barang pertama untuk mulai sewakan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => (
                <div key={item.id} className="group rounded-3xl border border-border bg-card overflow-hidden lift">
                  <div className="aspect-[4/3] overflow-hidden relative bg-secondary">
                    <img src={item.foto_url || imgFallback(item.nama)} alt={item.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" onError={(e) => { e.target.src = imgFallback(item.nama) }} />
                    <div className="absolute top-3 right-3"><StatusBadge status={item.status} /></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold tracking-tight line-clamp-1">{item.nama}</h3>
                    <div className="text-xl font-bold tracking-tight mt-1">{formatPrice(item.harga_per_hari)}<span className="text-xs font-normal text-muted-foreground"> /hari</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Stok: {item.stok}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-full" onClick={() => handleDelete(item.id)} loading={deletingId === item.id}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ RENTALS ═══ */}
        <TabsContent value="rentals" className="space-y-5 mt-6">
          <div className="flex gap-2 flex-wrap">
            {["", "pending", "disetujui", "sedang_disewa", "selesai", "ditolak"].map(s => (
              <button key={s || "all"} onClick={() => setRentalFilter(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${rentalFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
              >{s || "Semua"}</button>
            ))}
          </div>
          {rentalsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4"><ClipboardList className="w-7 h-7 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold">Tidak ada permintaan sewa</h3>
              <p className="text-sm text-muted-foreground mt-1">{rentalFilter ? `Tidak ada sewa "${rentalFilter}"` : "Belum ada permintaan masuk"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map(r => (
                <AdminRentalCard key={r.id} rental={r} payment={paymentMap[r.id]} onUpdateStatus={handleUpdateRentalStatus} onViewBukti={setPreviewBukti} onConfirmPayment={handleConfirmPayment} onRejectPayment={handleRejectPayment} busy={rentalUpdatingId === r.id} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ WALLET ═══ */}
        <TabsContent value="wallet" className="space-y-5 mt-6">
          {walletLoading ? (
            <div className="space-y-3"><Skeleton className="h-32 w-full max-w-md rounded-3xl" /><Skeleton className="h-20 w-full rounded-2xl" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-3xl bg-hero-deep text-white p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
                  <p className="relative text-xs font-semibold text-white/60 uppercase tracking-widest">Saldo tersedia</p>
                  <p className="relative text-3xl font-bold tracking-tight mt-2">{formatPrice(wallet?.saldo || 0)}</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total pendapatan</p>
                  <p className="text-2xl font-bold tracking-tight mt-2">{formatPrice(wallet?.total_pendapatan || 0)}</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total ditarik</p>
                  <p className="text-2xl font-bold tracking-tight mt-2">{formatPrice(wallet?.total_withdrawn || 0)}</p>
                </div>
              </div>

              <div>
                <Button onClick={() => setWdModalOpen(true)} disabled={!wallet || wallet.saldo < 50000} className="rounded-full">
                  <ArrowDownToLine className="w-4 h-4 mr-1" /> Tarik saldo
                </Button>
                {wallet && wallet.saldo < 50000 && <p className="text-xs text-muted-foreground mt-1">Minimal penarikan Rp 50.000</p>}
              </div>

              <Separator />

              {/* Riwayat Penarikan */}
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-3">Riwayat penarikan</h3>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada riwayat penarikan</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawals.map(wd => (
                      <div key={wd.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold tracking-tight">{formatPrice(wd.jumlah)}</p>
                          <p className="text-sm text-muted-foreground">{wd.bank_name} • {wd.account_number} • {wd.account_holder}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(wd.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                          {wd.rejected_reason && <p className="text-xs text-destructive mt-1">Alasan: {wd.rejected_reason}</p>}
                        </div>
                        <div>
                          {wd.status === "pending" && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Menunggu</span>}
                          {wd.status === "processing" && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Diproses</span>}
                          {wd.status === "completed" && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary"><CheckCircle className="w-3 h-3" /> Berhasil</span>}
                          {wd.status === "rejected" && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700"><Ban className="w-3 h-3" /> Ditolak</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Riwayat Pemasukan */}
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-3">Riwayat pemasukan</h3>
                {walletTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada pemasukan. Saldo masuk otomatis saat rental selesai.</p>
                ) : (
                  <div className="space-y-2">
                    {walletTransactions.map((tx, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold tracking-tight">{tx.item_nama}</p>
                          <p className="text-sm text-muted-foreground">Penyewa: {tx.penyewa}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">+{formatPrice(tx.jumlah)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>


        {/* ═══ PROFILE ═══ */}
        <TabsContent value="profile" className="mt-6">
          <div className="max-w-xl rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-tight mb-1">Profil usaha</h2>
            <p className="text-sm text-muted-foreground mb-6">Informasi ini ditampilkan ke penyewa.</p>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-2">
                <Label>Nama usaha <span className="text-destructive">*</span></Label>
                <Input placeholder="Sewa Jaya" value={profileForm.nama_usaha} onChange={(e) => setProfileForm(p => ({ ...p, nama_usaha: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Alamat usaha <span className="text-destructive">*</span></Label>
                <Input placeholder="Jl. Soekarno-Hatta No.1" value={profileForm.alamat_usaha} onChange={(e) => setProfileForm(p => ({ ...p, alamat_usaha: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Nomor telepon <span className="text-destructive">*</span></Label>
                <Input placeholder="08123456789" value={profileForm.nomor_telepon} onChange={(e) => setProfileForm(p => ({ ...p, nomor_telepon: e.target.value }))} required />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Titik lokasi usaha <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Klik atau geser pin di peta.</p>
                <MapPicker latitude={profileForm.latitude} longitude={profileForm.longitude} onChange={({ latitude, longitude, alamat }) => setProfileForm(p => ({ ...p, latitude, longitude, ...(alamat ? { alamat_usaha: alamat } : {}) }))} />
                {profileForm.latitude && profileForm.longitude && (
                  <p className="text-xs text-muted-foreground">Koordinat: {profileForm.latitude.toFixed(6)}, {profileForm.longitude.toFixed(6)}</p>
                )}
              </div>

              <Separator />

              <Button type="submit" loading={savingProfile} className="rounded-full"><Save className="w-4 h-4 mr-1.5" /> Simpan profil</Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ ITEM DIALOG ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit barang" : "Tambah barang baru"}</DialogTitle>
            <DialogDescription>{editingItem ? "Ubah detail barang sewa" : "Isi detail barang yang ingin disewakan"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-2"><Label>Nama barang *</Label><Input placeholder="Kamera Sony A7III" value={form.nama} onChange={(e) => setForm(p => ({ ...p, nama: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><textarea className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Kondisi dan fitur barang..." value={form.deskripsi} onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Harga/hari (Rp) *</Label><Input type="number" min="0" placeholder="250000" value={form.harga_per_hari} onChange={(e) => setForm(p => ({ ...p, harga_per_hari: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Stok</Label><Input type="number" min="0" placeholder="1" value={form.stok} onChange={(e) => setForm(p => ({ ...p, stok: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <select className="flex h-9 w-full rounded-xl border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.category_id} onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">Tanpa kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
            {editingItem && (
              <div className="space-y-2">
                <Label>Status barang</Label>
                <select className="flex h-9 w-full rounded-xl border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.status || "available"} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="available">Tersedia</option>
                  <option value="unavailable">Tidak tersedia (nonaktif)</option>
                </select>
                <p className="text-xs text-muted-foreground">Set "Tidak tersedia" untuk menyembunyikan dari katalog tanpa menghapus data.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Foto barang</Label>
              {form.foto_url ? (
                <div className="relative inline-block w-full">
                  <img src={form.foto_url} alt="Preview" className="w-full max-h-40 object-contain rounded-xl border bg-muted" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, foto_url: "" }))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:text-primary transition-colors ${fotoUploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    {fotoUploading ? <span className="text-sm">Memproses...</span> : (<><ImageIcon className="w-7 h-7" /><span className="text-sm font-medium">Pilih foto</span><span className="text-xs">JPG, PNG, WEBP · maks 5MB</span></>)}
                  </div>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFotoChange} disabled={fotoUploading} />
                </label>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={saving}>{editingItem ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ BUKTI PREVIEW ═══ */}
      {previewBukti && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewBukti(null)}>
          <div className="relative bg-card border border-border rounded-3xl shadow-soft w-full max-w-md overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h3 className="font-bold tracking-tight">Bukti pembayaran #{previewBukti.id}</h3>
              <button onClick={() => setPreviewBukti(null)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary/60 rounded-2xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Jumlah</span><span className="font-semibold">{formatPrice(previewBukti.jumlah)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span className="font-medium capitalize">{previewBukti.metode_pembayaran}</span></div>
                {previewBukti.catatan && <div className="flex justify-between"><span className="text-muted-foreground">Catatan</span><span className="text-right max-w-[60%]">{previewBukti.catatan}</span></div>}
              </div>
              <img src={previewBukti.bukti_pembayaran} alt="Bukti" className="w-full rounded-2xl border border-border object-contain max-h-72" />
              {previewBukti.status === "pending" && (
                <div className="flex gap-2">
                  <Button className="flex-1 rounded-full" variant="success" size="sm" onClick={() => handleConfirmPayment(previewBukti.id)}><CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi</Button>
                  <Button className="flex-1 rounded-full" variant="destructive" size="sm" onClick={() => handleRejectPayment(previewBukti.id)}><XCircle className="w-3.5 h-3.5 mr-1" /> Tolak</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WITHDRAWAL DIALOG ═══ */}
      <Dialog open={wdModalOpen} onOpenChange={setWdModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tarik saldo</DialogTitle>
            <DialogDescription>Masukkan jumlah dan rekening tujuan. Proses 1-3 hari kerja.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label>Jumlah (Rp) *</Label>
              <Input type="number" min="50000" max={wallet?.saldo || 0} placeholder="100000" value={wdForm.jumlah} onChange={(e) => setWdForm(p => ({ ...p, jumlah: e.target.value }))} required />
              <p className="text-xs text-muted-foreground">Tersedia: {formatPrice(wallet?.saldo || 0)} · Min Rp 50.000</p>
            </div>
            <div className="space-y-2">
              <Label>Bank tujuan *</Label>
              <select className="flex h-9 w-full rounded-xl border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={wdForm.bank_name} onChange={(e) => setWdForm(p => ({ ...p, bank_name: e.target.value }))} required>
                <option value="">Pilih bank</option>
                {["BCA","BNI","BRI","Mandiri","BSI","CIMB Niaga","Permata","Danamon","DANA","OVO","GoPay"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Nomor rekening *</Label><Input placeholder="1234567890" value={wdForm.account_number} onChange={(e) => setWdForm(p => ({ ...p, account_number: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Nama pemilik *</Label><Input placeholder="Nama sesuai buku tabungan" value={wdForm.account_holder} onChange={(e) => setWdForm(p => ({ ...p, account_holder: e.target.value }))} required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWdModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={wdSubmitting}>Ajukan penarikan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
