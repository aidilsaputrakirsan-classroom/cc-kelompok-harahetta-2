/**
 * SuperAdminPanel — Sewain
 * Modern minimalist · base hijau pekat + putih.
 * Fitur: stats, users, categories, verifications, all rentals.
 */
import { useState, useEffect, useCallback } from "react"
import { formatPrice } from "../lib/utils"
import {
  fetchPlatformStats, fetchAllUsers, updateUser, deleteUser,
  fetchCategories, createCategory, deleteCategory,
  fetchPendingVerifications, verifyUser,
  fetchAllRentals,
  fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, fetchPromoRedemptions,
} from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import { Card, CardContent } from "../components/ui/Card"
import { StatusBadge } from "../components/ui/Badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table"
import { Skeleton } from "../components/ui/Skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/Dialog"
import {
  Users, Package, ClipboardList, FolderOpen, ShieldCheck, Crown,
  BarChart3, Plus, Trash2, UserCheck, UserX, CheckCircle, XCircle,
  Calendar, DollarSign, Eye, ImageOff, RefreshCw, Pencil,
  Tag, Gift, TrendingDown, History,
} from "lucide-react"

/* ─── StatCard ────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminPanel({ addToast }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [verifications, setVerifications] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catForm, setCatForm] = useState({ nama: "", deskripsi: "" })
  const [savingCat, setSavingCat] = useState(false)
  const [userRoleFilter, setUserRoleFilter] = useState("")
  const [rentalStatusFilter, setRentalStatusFilter] = useState("")
  const [imgPreview, setImgPreview] = useState(null)
  const [verifLoading, setVerifLoading] = useState(false)
  const [verifLastUpdated, setVerifLastUpdated] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ nama: "", role: "user", is_active: true })
  const [savingEdit, setSavingEdit] = useState(false)

  // ── PROMO state
  const [promos, setPromos] = useState([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [editPromo, setEditPromo] = useState(null)         // null = create mode, object = edit mode
  const [savingPromo, setSavingPromo] = useState(false)
  const [redemptionsModal, setRedemptionsModal] = useState(null)  // { promo, data }
  const [promoForm, setPromoForm] = useState({
    code: "",
    nama: "",
    deskripsi: "",
    discount_type: "percentage",
    discount_value: 50,
    max_discount: 50000,
    min_order: 0,
    eligibility: "new_user",
    max_uses_per_user: 1,
    max_total_uses: "",
    is_active: true,
    is_featured: true,
    valid_from: "",
    valid_until: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, c, v] = await Promise.all([
        fetchPlatformStats(), fetchAllUsers({ role: userRoleFilter || undefined }),
        fetchCategories(), fetchPendingVerifications(),
      ])
      setStats(s)
      setUsers(Array.isArray(u) ? u : (u?.users || []))
      setCategories(Array.isArray(c) ? c : (c?.categories || []))
      setVerifications(v?.profiles || [])
      setVerifLastUpdated(new Date())
    } catch (err) { addToast?.(err.message, "error") }
    finally { setLoading(false) }
  }, [userRoleFilter, addToast])

  const loadVerifications = useCallback(async () => {
    setVerifLoading(true)
    try { const v = await fetchPendingVerifications(); setVerifications(v?.profiles || []); setVerifLastUpdated(new Date()) }
    catch (err) { addToast?.(err.message, "error") }
    finally { setVerifLoading(false) }
  }, [addToast])

  const loadRentals = useCallback(async () => {
    try { const data = await fetchAllRentals({ status: rentalStatusFilter || undefined }); setRentals(Array.isArray(data) ? data : (data?.rentals || [])) } catch {}
  }, [rentalStatusFilter])

  // ── PROMO loaders & handlers
  const loadPromos = useCallback(async () => {
    setPromoLoading(true)
    try {
      const data = await fetchPromoCodes()
      setPromos(data?.promos || [])
    } catch (err) { addToast?.(err.message, "error") }
    finally { setPromoLoading(false) }
  }, [addToast])

  const resetPromoForm = () => setPromoForm({
    code: "",
    nama: "",
    deskripsi: "",
    discount_type: "percentage",
    discount_value: 50,
    max_discount: 50000,
    min_order: 0,
    eligibility: "new_user",
    max_uses_per_user: 1,
    max_total_uses: "",
    is_active: true,
    is_featured: true,
    valid_from: "",
    valid_until: "",
  })

  const openCreatePromo = () => {
    setEditPromo(null)
    resetPromoForm()
    setPromoModalOpen(true)
  }

  const openEditPromo = (p) => {
    setEditPromo(p)
    setPromoForm({
      code: p.code,
      nama: p.nama,
      deskripsi: p.deskripsi || "",
      discount_type: "percentage",
      discount_value: p.discount_value,
      max_discount: p.max_discount ?? "",
      min_order: p.min_order ?? 0,
      eligibility: p.eligibility,
      max_uses_per_user: p.max_uses_per_user,
      max_total_uses: p.max_total_uses ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
      valid_from: p.valid_from ? p.valid_from.slice(0, 16) : "",
      valid_until: p.valid_until ? p.valid_until.slice(0, 16) : "",
    })
    setPromoModalOpen(true)
  }

  const handleSavePromo = async (e) => {
    e.preventDefault()
    setSavingPromo(true)
    try {
      const payload = {
        ...promoForm,
        discount_type: "percentage", // sistem promo hanya pakai persentase
        discount_value: parseFloat(promoForm.discount_value),
        max_discount: promoForm.max_discount === "" || promoForm.max_discount === null ? null : parseFloat(promoForm.max_discount),
        min_order: parseFloat(promoForm.min_order || 0),
        max_uses_per_user: parseInt(promoForm.max_uses_per_user || 1),
        max_total_uses: promoForm.max_total_uses === "" || promoForm.max_total_uses === null ? null : parseInt(promoForm.max_total_uses),
        valid_from: promoForm.valid_from || null,
        valid_until: promoForm.valid_until || null,
      }
      if (editPromo) {
        // Saat edit, code tidak boleh diubah → exclude
        const { code, ...rest } = payload
        await updatePromoCode(editPromo.id, rest)
        addToast?.("Promo diperbarui", "success")
      } else {
        await createPromoCode(payload)
        addToast?.("Promo dibuat", "success")
      }
      setPromoModalOpen(false)
      loadPromos()
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSavingPromo(false)
    }
  }

  const handleTogglePromoActive = async (p) => {
    try {
      await updatePromoCode(p.id, { is_active: !p.is_active })
      addToast?.(`Promo ${!p.is_active ? "diaktifkan" : "dinonaktifkan"}`, "success")
      loadPromos()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleDeletePromo = async (id) => {
    if (!confirm("Hapus promo ini? Jika sudah pernah dipakai, akan di-nonaktifkan saja.")) return
    try {
      await deletePromoCode(id)
      addToast?.("Promo dihapus/dinonaktifkan", "success")
      loadPromos()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleViewRedemptions = async (promo) => {
    try {
      const data = await fetchPromoRedemptions(promo.id)
      setRedemptionsModal({ promo, data })
    } catch (err) { addToast?.(err.message, "error") }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { loadRentals() }, [loadRentals])

  const handleToggleActive = async (u) => {
    try { await updateUser(u.id, { is_active: !u.is_active }); addToast?.(`User ${!u.is_active ? "diaktifkan" : "dinonaktifkan"}`, "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }
  const handleDeleteUser = async (id) => {
    if (!confirm("Yakin hapus user ini?")) return
    try { await deleteUser(id); addToast?.("User dihapus", "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }
  const openEditUser = (u) => { setEditUser(u); setEditForm({ nama: u.nama, role: u.role, is_active: u.is_active }) }
  const handleSaveEditUser = async (e) => {
    e.preventDefault()
    if (editForm.role === "admin" && !editUser.is_verified) { addToast?.("User harus terverifikasi dulu", "error"); return }
    setSavingEdit(true)
    try { await updateUser(editUser.id, editForm); addToast?.("User diupdate", "success"); setEditUser(null); load() }
    catch (err) { addToast?.(err.message, "error") }
    finally { setSavingEdit(false) }
  }
  const handleVerify = async (userId, status) => {
    try { await verifyUser(userId, { status }); addToast?.(`Verifikasi ${status}`, "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }
  const handleAddCategory = async (e) => {
    e.preventDefault(); setSavingCat(true)
    try { await createCategory(catForm); addToast?.("Kategori ditambahkan", "success"); setCatModalOpen(false); setCatForm({ nama: "", deskripsi: "" }); load() }
    catch (err) { addToast?.(err.message, "error") }
    finally { setSavingCat(false) }
  }
  const handleDeleteCategory = async (id) => {
    if (!confirm("Yakin hapus kategori ini?")) return
    try { await deleteCategory(id); addToast?.("Kategori dihapus", "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </div>
    )
  }


  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Platform management</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" /> Super Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola seluruh platform Sewain</p>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="flex-wrap rounded-full p-1 bg-muted/40 border border-border/60">
          <TabsTrigger value="stats" className="rounded-full"><BarChart3 className="w-4 h-4 mr-1.5" /> Statistik</TabsTrigger>
          <TabsTrigger value="users" className="rounded-full"><Users className="w-4 h-4 mr-1.5" /> Pengguna</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full"><FolderOpen className="w-4 h-4 mr-1.5" /> Kategori</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-full" onClick={loadVerifications}><ShieldCheck className="w-4 h-4 mr-1.5" /> Verifikasi</TabsTrigger>
          <TabsTrigger value="rentals" className="rounded-full" onClick={loadRentals}><ClipboardList className="w-4 h-4 mr-1.5" /> Transaksi</TabsTrigger>
          <TabsTrigger value="promos" className="rounded-full" onClick={loadPromos}><Tag className="w-4 h-4 mr-1.5" /> Promo</TabsTrigger>
        </TabsList>

        {/* ═══ STATS ═══ */}
        <TabsContent value="stats" className="space-y-5 mt-6">
          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total users" value={stats.total_users || 0} />
                <StatCard icon={Package} label="Total barang" value={stats.total_items || 0} />
                <StatCard icon={ClipboardList} label="Total transaksi" value={stats.total_rentals || 0} />
                <StatCard icon={Crown} label="Admin aktif" value={stats.total_admins || 0} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={CheckCircle} label="Barang tersedia" value={stats.items_available || 0} />
                <StatCard icon={Package} label="Sedang disewa" value={stats.items_rented || 0} />
                <StatCard icon={ClipboardList} label="Sewa pending" value={stats.rentals_pending || 0} />
                <StatCard icon={ShieldCheck} label="KTP menunggu" value={stats.users_pending_verification || 0} />
              </div>
              {stats.revenue_total !== undefined && (
                <StatCard icon={DollarSign} label="Total revenue platform" value={formatPrice(stats.revenue_total || 0)} />
              )}
            </>
          )}
        </TabsContent>

        {/* ═══ USERS ═══ */}
        <TabsContent value="users" className="space-y-5 mt-6">
          <div className="flex gap-2 flex-wrap">
            {["", "user", "admin", "super_admin"].map(r => (
              <button key={r || "all"} onClick={() => setUserRoleFilter(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${userRoleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
              >{r || "Semua"}</button>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Nama</TableHead><TableHead>Email</TableHead>
                  <TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Verifikasi</TableHead><TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">#{u.id}</TableCell>
                    <TableCell className="font-semibold">{u.nama}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><StatusBadge status={u.role} /></TableCell>
                    <TableCell><StatusBadge status={String(u.is_active)} label={u.is_active ? "Aktif" : "Nonaktif"} /></TableCell>
                    <TableCell><StatusBadge status={u.is_verified ? "disetujui" : "menunggu"} label={u.is_verified ? "Verified" : "Unverified"} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0" onClick={() => openEditUser(u)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant={u.is_active ? "destructive" : "success"} className="rounded-full h-8 w-8 p-0" onClick={() => handleToggleActive(u)} title={u.is_active ? "Nonaktifkan" : "Aktifkan"}>{u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}</Button>
                        <Button size="sm" variant="destructive" className="rounded-full h-8 w-8 p-0" onClick={() => handleDeleteUser(u.id)} title="Hapus"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ═══ CATEGORIES ═══ */}
        <TabsContent value="categories" className="space-y-5 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">Kategori barang</h2>
            <Button onClick={() => setCatModalOpen(true)} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Kategori baru</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 lift">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold tracking-tight flex items-center gap-1.5"><FolderOpen className="w-4 h-4 text-primary" /> {c.nama}</h3>
                    {c.deskripsi && <p className="text-sm text-muted-foreground mt-1">{c.deskripsi}</p>}
                  </div>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full flex-shrink-0" onClick={() => handleDeleteCategory(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">ID: {c.id} · {new Date(c.created_at).toLocaleDateString("id-ID")}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ VERIFICATIONS ═══ */}
        <TabsContent value="verifications" className="space-y-5 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold tracking-tight">Verifikasi KTP pengguna</h2>
            <div className="flex items-center gap-3">
              {verifLastUpdated && <span className="text-xs text-muted-foreground">Dimuat: {verifLastUpdated.toLocaleTimeString("id-ID")}</span>}
              <Button size="sm" variant="outline" className="rounded-full" onClick={loadVerifications} disabled={verifLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${verifLoading ? "animate-spin" : ""}`} />{verifLoading ? "Memuat..." : "Refresh"}
              </Button>
            </div>
          </div>
          {verifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-7 h-7 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold">Tidak ada yang menunggu verifikasi</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map(p => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold tracking-tight">User #{p.user_id}</h3>
                        <StatusBadge status={p.status_verifikasi} />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        {p.alamat && <div>📍 {p.alamat}</div>}
                        {p.nama_orang_tua && <div>👤 Orang tua: {p.nama_orang_tua}</div>}
                        {p.nomor_telepon && <div>📞 {p.nomor_telepon}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="success" className="rounded-full" onClick={() => handleVerify(p.user_id, "disetujui")}><CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui</Button>
                      <Button size="sm" variant="destructive" className="rounded-full" onClick={() => handleVerify(p.user_id, "ditolak")}><XCircle className="w-3.5 h-3.5 mr-1" /> Tolak</Button>
                    </div>
                  </div>
                  {/* KTP photos */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Foto KTP</p>
                      {p.foto_ktp ? (
                        <button type="button" onClick={() => setImgPreview({ src: p.foto_ktp, label: `Foto KTP — User #${p.user_id}` })} className="group relative w-full overflow-hidden rounded-xl border border-border bg-muted hover:ring-2 hover:ring-primary transition" style={{ aspectRatio: "16/9" }}>
                          <img src={p.foto_ktp} alt="KTP" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition"><Eye className="w-5 h-5 text-white" /><span className="text-white text-xs font-medium">Lihat</span></div>
                        </button>
                      ) : (
                        <div className="w-full rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground" style={{ aspectRatio: "16/9" }}><ImageOff className="w-6 h-6" /><span className="text-xs">Belum diupload</span></div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Selfie + KTP</p>
                      {p.foto_selfie_ktp ? (
                        <button type="button" onClick={() => setImgPreview({ src: p.foto_selfie_ktp, label: `Selfie + KTP — User #${p.user_id}` })} className="group relative w-full overflow-hidden rounded-xl border border-border bg-muted hover:ring-2 hover:ring-primary transition" style={{ aspectRatio: "16/9" }}>
                          <img src={p.foto_selfie_ktp} alt="Selfie KTP" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition"><Eye className="w-5 h-5 text-white" /><span className="text-white text-xs font-medium">Lihat</span></div>
                        </button>
                      ) : (
                        <div className="w-full rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground" style={{ aspectRatio: "16/9" }}><ImageOff className="w-6 h-6" /><span className="text-xs">Belum diupload</span></div>
                      )}
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
              <button key={s || "all"} onClick={() => setRentalStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${rentalStatusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
              >{s || "Semua"}</button>
            ))}
          </div>
          {rentals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4"><ClipboardList className="w-7 h-7 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold">Tidak ada transaksi</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map(r => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold tracking-tight">{r.item?.nama || `Item #${r.item_id}`}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Penyewa: {r.user?.nama || `User #${r.user_id}`}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(r.tanggal_selesai).toLocaleDateString("id-ID")}
                      </div>
                      <p className="text-xl font-bold tracking-tight mt-2">{formatPrice(r.total_harga)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ PROMOS ═══ */}
        <TabsContent value="promos" className="space-y-5 mt-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Kupon promo platform
            </h2>
            <Button onClick={openCreatePromo} className="rounded-full"><Plus className="w-4 h-4 mr-1.5" /> Buat promo</Button>
          </div>

          {promoLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : promos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Tag className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Belum ada promo</h3>
              <p className="text-sm text-muted-foreground mt-1">Klik "Buat promo" untuk menambah kupon baru</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Pakai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell><span className="font-mono font-bold text-primary">{p.code}</span></TableCell>
                      <TableCell className="font-semibold">{p.nama}</TableCell>
                      <TableCell className="text-sm">
                        {p.discount_type === "percentage"
                          ? <>{Math.round(p.discount_value)}%{p.max_discount ? ` (max ${formatPrice(p.max_discount)})` : ""}</>
                          : <>{formatPrice(p.discount_value)}</>
                        }
                      </TableCell>
                      <TableCell><StatusBadge status={p.eligibility} label={p.eligibility === "new_user" ? "Pengguna baru" : "Semua"} /></TableCell>
                      <TableCell className="text-sm">
                        {p.used_count}{p.max_total_uses ? ` / ${p.max_total_uses}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={p.is_active ? "disetujui" : "ditolak"} label={p.is_active ? "Aktif" : "Nonaktif"} />
                          {p.is_featured && <span className="text-[10px] font-semibold text-primary">★ Featured</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0" onClick={() => handleViewRedemptions(p)} title="Riwayat pemakaian">
                            <History className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0" onClick={() => handleTogglePromoActive(p)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"}>
                            {p.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0" onClick={() => openEditPromo(p)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" className="rounded-full h-8 w-8 p-0" onClick={() => handleDeletePromo(p.id)} title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ EDIT USER DIALOG ═══ */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit user — {editUser?.nama}</DialogTitle>
            <DialogDescription>Ubah nama, role, atau status aktif.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditUser} className="space-y-4">
            <div className="space-y-2"><Label>Nama</Label><Input value={editForm.nama} onChange={(e) => setEditForm(p => ({ ...p, nama: e.target.value }))} required minLength={2} /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={editForm.role} onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">User (Penyewa)</option>
                <option value="admin" disabled={!editUser?.is_verified}>Admin (Penyedia){!editUser?.is_verified ? " — Butuh verifikasi" : ""}</option>
              </select>
              {!editUser?.is_verified && <p className="text-xs text-destructive">Role Admin hanya untuk user terverifikasi.</p>}
            </div>
            <div className="space-y-2">
              <Label>Status akun</Label>
              <select className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={String(editForm.is_active)} onChange={(e) => setEditForm(p => ({ ...p, is_active: e.target.value === "true" }))}>
                <option value="true">Aktif</option><option value="false">Nonaktif</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Batal</Button>
              <Button type="submit" loading={savingEdit}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ IMAGE PREVIEW ═══ */}
      <Dialog open={!!imgPreview} onOpenChange={() => setImgPreview(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader><DialogTitle>{imgPreview?.label}</DialogTitle></DialogHeader>
          <div className="flex justify-center">{imgPreview && <img src={imgPreview.src} alt={imgPreview.label} className="max-w-full max-h-[70vh] rounded-xl object-contain border border-border" />}</div>
        </DialogContent>
      </Dialog>

      {/* ═══ ADD CATEGORY DIALOG ═══ */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tambah kategori baru</DialogTitle>
            <DialogDescription>Buat kategori untuk mengelompokkan barang sewa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2"><Label>Nama kategori *</Label><Input placeholder="Elektronik" value={catForm.nama} onChange={(e) => setCatForm(p => ({ ...p, nama: e.target.value }))} required minLength={2} /></div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Deskripsi kategori..." value={catForm.deskripsi} onChange={(e) => setCatForm(p => ({ ...p, deskripsi: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={savingCat}>Tambah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ PROMO CREATE/EDIT DIALOG ═══ */}
      <Dialog open={promoModalOpen} onOpenChange={setPromoModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPromo ? `Edit promo — ${editPromo.code}` : "Buat promo baru"}</DialogTitle>
            <DialogDescription>
              {editPromo
                ? "Ubah detail kupon. Kode tidak bisa diubah setelah dibuat."
                : "Definisikan kupon promo platform-wide."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePromo} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kode *</Label>
                <Input
                  placeholder="WELCOME50"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm(p => ({ ...p, code: e.target.value.toUpperCase().slice(0, 20) }))}
                  required
                  disabled={!!editPromo}
                  maxLength={20}
                  className="font-mono uppercase"
                />
                <p className="text-[10px] text-muted-foreground text-right">{(promoForm.code || "").length}/20</p>
              </div>
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  placeholder="Promo Pengguna Baru"
                  value={promoForm.nama}
                  onChange={(e) => setPromoForm(p => ({ ...p, nama: e.target.value.slice(0, 28) }))}
                  required
                  maxLength={28}
                />
                <p className="text-[10px] text-muted-foreground text-right">{(promoForm.nama || "").length}/28</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <select
                  className="flex h-9 w-full rounded-xl border border-input bg-muted/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-not-allowed"
                  value="percentage"
                  disabled
                >
                  <option value="percentage">Persentase</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nilai *</Label>
                <Input
                  type="number" step="0.01" min={0.01} max={100}
                  placeholder="50"
                  value={promoForm.discount_value}
                  onChange={(e) => setPromoForm(p => ({ ...p, discount_value: e.target.value }))}
                  required
                />
                <p className="text-[10px] text-muted-foreground">1-100 %</p>
              </div>
              <div className="space-y-2">
                <Label>Max diskon</Label>
                <Input
                  type="number" min={0}
                  placeholder="50000"
                  value={promoForm.max_discount}
                  onChange={(e) => setPromoForm(p => ({ ...p, max_discount: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground">Cap potongan (Rp)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min order</Label>
                <Input
                  type="number" min={0}
                  placeholder="0"
                  value={promoForm.min_order}
                  onChange={(e) => setPromoForm(p => ({ ...p, min_order: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Eligibility</Label>
                <select
                  className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={promoForm.eligibility}
                  onChange={(e) => setPromoForm(p => ({ ...p, eligibility: e.target.value }))}
                >
                  <option value="new_user">Pengguna baru</option>
                  <option value="all">Semua user</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Max pakai/user</Label>
                <Input
                  type="number" min={1}
                  value={promoForm.max_uses_per_user}
                  onChange={(e) => setPromoForm(p => ({ ...p, max_uses_per_user: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kuota total (kosongkan = unlimited)</Label>
              <Input
                type="number" min={1}
                placeholder="Unlimited"
                value={promoForm.max_total_uses}
                onChange={(e) => setPromoForm(p => ({ ...p, max_total_uses: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Berlaku dari</Label>
                <Input
                  type="datetime-local"
                  value={promoForm.valid_from}
                  onChange={(e) => setPromoForm(p => ({ ...p, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Berlaku sampai</Label>
                <Input
                  type="datetime-local"
                  value={promoForm.valid_until}
                  onChange={(e) => setPromoForm(p => ({ ...p, valid_until: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoForm.is_active}
                  onChange={(e) => setPromoForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-input"
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoForm.is_featured}
                  onChange={(e) => setPromoForm(p => ({ ...p, is_featured: e.target.checked }))}
                  className="rounded border-input"
                />
                Tampilkan di landing page
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPromoModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={savingPromo}>{editPromo ? "Simpan" : "Buat"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ PROMO REDEMPTIONS DIALOG ═══ */}
      <Dialog open={!!redemptionsModal} onOpenChange={(open) => { if (!open) setRedemptionsModal(null) }}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat pemakaian — {redemptionsModal?.promo?.code}</DialogTitle>
            <DialogDescription>
              {redemptionsModal?.data?.total || 0} pemakaian · total diskon dibagikan: {formatPrice(redemptionsModal?.data?.total_discount_given || 0)}
            </DialogDescription>
          </DialogHeader>
          {redemptionsModal?.data?.redemptions?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Rental ID</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionsModal.data.redemptions.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>#{r.user_id}</TableCell>
                    <TableCell>#{r.rental_id}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPrice(r.original_amount)}</TableCell>
                    <TableCell className="text-emerald-600 font-semibold">−{formatPrice(r.discount_amount)}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(r.final_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">Belum ada pemakaian</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
