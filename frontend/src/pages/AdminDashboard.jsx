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

const defaultItem = { nama: "", deskripsi: "", harga_per_hari: "", stok: 1, foto_url: "", category_id: "" }

const PAYMENT_STATUS_LABEL = {
  pending: { label: "Menunggu Pembayaran", cls: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Lunas", cls: "bg-green-100 text-green-800" },
  failed: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  cancelled: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-600" },
}

function AdminRentalCard({ rental, payment, onUpdateStatus, onViewBukti, onConfirmPayment, onRejectPayment }) {
  const item = rental.item
  const paymentMeta = payment ? PAYMENT_STATUS_LABEL[payment.status] : null
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
                {paymentMeta && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${paymentMeta.cls}`}>
                    <CreditCard className="w-3 h-3" /> {paymentMeta.label}
                  </span>
                )}
              </div>
            </div>
            <div className="text-lg font-bold text-primary mt-2">{formatPrice(rental.total_harga)}</div>
            {rental.catatan && <p className="text-xs text-muted-foreground mt-1">{rental.catatan}</p>}

            {/* Info bukti pembayaran */}
            {payment && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {payment.metode_pembayaran === "midtrans" ? (
                  <span className="text-xs text-slate-500 italic">
                    {payment.status === "completed"
                      ? `Dibayar otomatis via Midtrans${payment.payment_channel ? ` (${payment.payment_channel.replace(/_/g, " ")})` : ""}`
                      : "Menunggu pembayaran user via Midtrans"}
                  </span>
                ) : payment.bukti_pembayaran ? (
                  <button
                    onClick={() => onViewBukti(payment)}
                    className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    <Eye className="w-3.5 h-3.5" /> Lihat bukti pembayaran
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Bukti pembayaran belum diupload</span>
                )}
              </div>
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
              <>
                {payment?.status === "pending" && payment?.bukti_pembayaran && payment?.metode_pembayaran !== "midtrans" && (
                  <>
                    <Button size="sm" variant="success" onClick={() => onConfirmPayment(payment.id)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi Bayar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onRejectPayment(payment.id)}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak Bayar
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => onUpdateStatus(rental.id, "sedang_disewa")}>Proses Sewa</Button>
              </>
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
  const [rentalsLoading, setRentalsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(defaultItem)
  const [saving, setSaving] = useState(false)
  const [fotoUploading, setFotoUploading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nama_usaha: "", alamat_usaha: "", nomor_telepon: "",
    nomor_rekening: "", foto_qris: "",
    latitude: null, longitude: null,
  })
  const [qrisUploading, setQrisUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [previewBukti, setPreviewBukti] = useState(null)   // payment object
  const [paymentMap, setPaymentMap] = useState({})          // rental_id -> payment

  // Wallet state
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
      for (const p of (paymentData.payments || [])) {
        map[p.rental_id] = p
      }
      setPaymentMap(map)
    } catch (err) {
      console.error("Error loading rentals:", err)
      setRentals([])
    } finally {
      setRentalsLoading(false)
    }
  }, [rentalFilter])

  const loadWallet = useCallback(async () => {
    setWalletLoading(true)
    try {
      const [walletData, txData, wdData] = await Promise.all([
        fetchWallet(),
        fetchWalletTransactions({ limit: 10 }),
        fetchMyWithdrawals({ limit: 20 }),
      ])
      setWallet(walletData)
      setWalletTransactions(txData.transactions || [])
      setWithdrawals(wdData.withdrawals || [])
    } catch (err) {
      console.error("Error loading wallet:", err)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadItems(),
      loadRentals(),
      fetchAdminProfile().then(p => {
        setProfile(p)
        setProfileForm({
          nama_usaha: p.nama_usaha || "",
          alamat_usaha: p.alamat_usaha || "",
          nomor_telepon: p.nomor_telepon || "",
          nomor_rekening: p.nomor_rekening || "",
          foto_qris: p.foto_qris || "",
          latitude: p.latitude || null,
          longitude: p.longitude || null,
        })
      }).catch(() => {}),
      fetchCategories().then(setCategories).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  // Reload rentals ketika filter berubah
  useEffect(() => {
    loadRentals()
  }, [rentalFilter])

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
      await Promise.all([loadRentals(), loadItems()])
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleConfirmPayment = async (paymentId) => {
    if (!confirm("Konfirmasi pembayaran ini?")) return
    try {
      await confirmPayment(paymentId, "completed")
      addToast?.("Pembayaran dikonfirmasi", "success")
      setPreviewBukti(null)
      await loadRentals()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleRejectPayment = async (paymentId) => {
    if (!confirm("Tolak pembayaran ini?")) return
    try {
      await confirmPayment(paymentId, "failed")
      addToast?.("Pembayaran ditolak", "success")
      setPreviewBukti(null)
      await loadRentals()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWdSubmitting(true)
    try {
      await requestWithdrawal({
        jumlah: parseFloat(wdForm.jumlah),
        bank_name: wdForm.bank_name,
        account_number: wdForm.account_number,
        account_holder: wdForm.account_holder,
      })
      addToast?.("Request penarikan berhasil diajukan", "success")
      setWdModalOpen(false)
      setWdForm({ jumlah: "", bank_name: "", account_number: "", account_holder: "" })
      await loadWallet()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setWdSubmitting(false) }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    // Validasi field wajib
    if (!profileForm.nama_usaha?.trim()) {
      addToast?.("Nama usaha wajib diisi", "error"); return
    }
    if (!profileForm.alamat_usaha?.trim()) {
      addToast?.("Alamat usaha wajib diisi", "error"); return
    }
    if (!profileForm.nomor_telepon?.trim()) {
      addToast?.("Nomor telepon wajib diisi", "error"); return
    }
    if (!profileForm.latitude || !profileForm.longitude) {
      addToast?.("Titik lokasi di peta wajib diisi — geser pin ke lokasi usaha Anda", "error"); return
    }
    setSavingProfile(true)
    try {
      // Kirim payload eksplisit agar latitude/longitude selalu tersimpan
      const payload = {
        nama_usaha: profileForm.nama_usaha,
        alamat_usaha: profileForm.alamat_usaha,
        nomor_telepon: profileForm.nomor_telepon,
        nomor_rekening: profileForm.nomor_rekening || null,
        foto_qris: profileForm.foto_qris || null,
        latitude: profileForm.latitude,
        longitude: profileForm.longitude,
      }
      if (profile) await updateAdminProfile(payload)
      else await createAdminProfile(payload)
      const updated = await fetchAdminProfile()
      setProfile(updated)
      setProfileForm({
        nama_usaha: updated.nama_usaha || "",
        alamat_usaha: updated.alamat_usaha || "",
        nomor_telepon: updated.nomor_telepon || "",
        nomor_rekening: updated.nomor_rekening || "",
        foto_qris: updated.foto_qris || "",
        latitude: updated.latitude || null,
        longitude: updated.longitude || null,
      })
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
          <TabsTrigger value="wallet" onClick={loadWallet}><Wallet className="w-4 h-4 mr-1" /> Saldo</TabsTrigger>
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
          {rentalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Tidak ada permintaan sewa</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {rentalFilter ? `Tidak ada sewa dengan status "${rentalFilter}"` : "Belum ada permintaan sewa masuk"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map(r => (
                <AdminRentalCard
                  key={r.id}
                  rental={r}
                  payment={paymentMap[r.id]}
                  onUpdateStatus={handleUpdateRentalStatus}
                  onViewBukti={setPreviewBukti}
                  onConfirmPayment={handleConfirmPayment}
                  onRejectPayment={handleRejectPayment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* === WALLET / SALDO === */}
        <TabsContent value="wallet" className="space-y-4 mt-4">
          {walletLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full max-w-md" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {/* Saldo Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                  <CardContent className="p-5">
                    <p className="text-sm opacity-80">Saldo Tersedia</p>
                    <p className="text-2xl font-bold mt-1">{formatPrice(wallet?.saldo || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                    <p className="text-xl font-bold text-foreground mt-1">{formatPrice(wallet?.total_pendapatan || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Total Ditarik</p>
                    <p className="text-xl font-bold text-foreground mt-1">{formatPrice(wallet?.total_withdrawn || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tombol Tarik Saldo */}
              <div>
                <Button onClick={() => setWdModalOpen(true)} disabled={!wallet || wallet.saldo < 50000}>
                  <ArrowDownToLine className="w-4 h-4 mr-1" /> Tarik Saldo
                </Button>
                {wallet && wallet.saldo < 50000 && (
                  <p className="text-xs text-muted-foreground mt-1">Minimal penarikan Rp 50.000</p>
                )}
              </div>

              <Separator />

              {/* Riwayat Penarikan */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Riwayat Penarikan</h3>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada riwayat penarikan</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawals.map(wd => (
                      <Card key={wd.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{formatPrice(wd.jumlah)}</p>
                            <p className="text-sm text-muted-foreground">{wd.bank_name} • {wd.account_number} • {wd.account_holder}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(wd.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            {wd.rejected_reason && <p className="text-xs text-destructive mt-1">Alasan: {wd.rejected_reason}</p>}
                          </div>
                          <div>
                            {wd.status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3" /> Menunggu
                              </span>
                            )}
                            {wd.status === "processing" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3" /> Diproses (1-3 hari)
                              </span>
                            )}
                            {wd.status === "completed" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3" /> Berhasil
                              </span>
                            )}
                            {wd.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                                <Ban className="w-3 h-3" /> Ditolak
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Riwayat Pemasukan */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Riwayat Pemasukan</h3>
                {walletTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada pemasukan. Saldo akan masuk otomatis saat rental selesai.</p>
                ) : (
                  <div className="space-y-2">
                    {walletTransactions.map((tx, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{tx.item_nama}</p>
                            <p className="text-sm text-muted-foreground">Penyewa: {tx.penyewa}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-emerald-600">+{formatPrice(tx.jumlah)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
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
                  <Label>Nama Usaha <span className="text-destructive">*</span></Label>
                  <Input placeholder="Sewa Jaya" value={profileForm.nama_usaha}
                    onChange={(e) => setProfileForm(p => ({ ...p, nama_usaha: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Alamat Usaha <span className="text-destructive">*</span></Label>
                  <Input placeholder="Jl. Soekarno-Hatta No.1" value={profileForm.alamat_usaha}
                    onChange={(e) => setProfileForm(p => ({ ...p, alamat_usaha: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon <span className="text-destructive">*</span></Label>
                  <Input placeholder="08123456789" value={profileForm.nomor_telepon}
                    onChange={(e) => setProfileForm(p => ({ ...p, nomor_telepon: e.target.value }))} required />
                </div>

                <Separator />

                {/* ── Titik Lokasi di Peta */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Titik Lokasi Usaha di Peta <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Klik atau geser pin di peta. Nama jalan &amp; alamat akan terisi otomatis.
                  </p>
                  <MapPicker
                    latitude={profileForm.latitude}
                    longitude={profileForm.longitude}
                    onChange={({ latitude, longitude, alamat }) => {
                      setProfileForm(p => ({
                        ...p,
                        latitude,
                        longitude,
                        // Selalu update alamat dari reverse geocoding saat pin digeser
                        ...(alamat ? { alamat_usaha: alamat } : {}),
                      }))
                    }}
                  />
                  {profileForm.latitude && profileForm.longitude && (
                    <p className="text-xs text-muted-foreground">
                      Koordinat: {profileForm.latitude.toFixed(6)}, {profileForm.longitude.toFixed(6)}
                    </p>
                  )}
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
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <h3 className="font-bold text-foreground">Bukti Pembayaran #{previewBukti.id}</h3>
              <button
                onClick={() => setPreviewBukti(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info ringkas */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-semibold">{formatPrice(previewBukti.jumlah)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium capitalize">{previewBukti.metode_pembayaran}</span>
                </div>
                {previewBukti.catatan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catatan</span>
                    <span className="text-right max-w-[60%]">{previewBukti.catatan}</span>
                  </div>
                )}
              </div>

              {/* Foto bukti */}
              <img
                src={previewBukti.bukti_pembayaran}
                alt="Bukti Pembayaran"
                className="w-full rounded-xl border object-contain max-h-72"
              />

              {/* Tombol aksi jika masih pending */}
              {previewBukti.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1"
                    variant="success"
                    size="sm"
                    onClick={() => handleConfirmPayment(previewBukti.id)}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRejectPayment(previewBukti.id)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAWAL MODAL ── */}
      <Dialog open={wdModalOpen} onOpenChange={setWdModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tarik Saldo</DialogTitle>
            <DialogDescription>
              Masukkan jumlah dan rekening tujuan. Proses 1-3 hari kerja.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label>Jumlah Penarikan (Rp) *</Label>
              <Input type="number" min="50000" max={wallet?.saldo || 0} placeholder="100000"
                value={wdForm.jumlah}
                onChange={(e) => setWdForm(p => ({ ...p, jumlah: e.target.value }))} required />
              <p className="text-xs text-muted-foreground">Saldo tersedia: {formatPrice(wallet?.saldo || 0)} • Min: Rp 50.000</p>
            </div>
            <div className="space-y-2">
              <Label>Bank Tujuan *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer"
                value={wdForm.bank_name}
                onChange={(e) => setWdForm(p => ({ ...p, bank_name: e.target.value }))} required>
                <option value="" className="bg-background text-muted-foreground">Pilih Bank</option>
                <option value="BCA" className="bg-background text-foreground">BCA</option>
                <option value="BNI" className="bg-background text-foreground">BNI</option>
                <option value="BRI" className="bg-background text-foreground">BRI</option>
                <option value="Mandiri" className="bg-background text-foreground">Mandiri</option>
                <option value="BSI" className="bg-background text-foreground">BSI</option>
                <option value="CIMB Niaga" className="bg-background text-foreground">CIMB Niaga</option>
                <option value="Permata" className="bg-background text-foreground">Permata</option>
                <option value="Danamon" className="bg-background text-foreground">Danamon</option>
                <option value="DANA" className="bg-background text-foreground">DANA</option>
                <option value="OVO" className="bg-background text-foreground">OVO</option>
                <option value="GoPay" className="bg-background text-foreground">GoPay</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nomor Rekening *</Label>
              <Input placeholder="1234567890" value={wdForm.account_number}
                onChange={(e) => setWdForm(p => ({ ...p, account_number: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Nama Pemilik Rekening *</Label>
              <Input placeholder="Nama sesuai buku tabungan" value={wdForm.account_holder}
                onChange={(e) => setWdForm(p => ({ ...p, account_holder: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWdModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={wdSubmitting}>Ajukan Penarikan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
