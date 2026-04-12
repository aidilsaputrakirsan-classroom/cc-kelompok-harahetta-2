import { useState, useEffect, useCallback } from "react"
import { formatPrice } from "../lib/utils"
import {
  fetchPlatformStats, fetchAllUsers, updateUser, deleteUser,
  fetchCategories, createCategory, deleteCategory,
  fetchPendingVerifications, verifyUser,
  fetchAllRentals,
} from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { StatusBadge } from "../components/ui/Badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog"
import {
  Users, Package, ClipboardList, FolderOpen, ShieldCheck, Crown,
  BarChart3, Plus, Trash2, UserCheck, UserX, CheckCircle, XCircle,
  Calendar, ExternalLink, DollarSign, Eye,
} from "lucide-react"

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
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
  useEffect(() => { loadRentals() }, [loadRentals])

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      addToast?.(`User ${!u.is_active ? "diaktifkan" : "dinonaktifkan"}`, "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm("Yakin hapus user ini?")) return
    try { await deleteUser(id); addToast?.("User dihapus", "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }

  const handleVerify = async (userId, status) => {
    try {
      await verifyUser(userId, { status })
      addToast?.(`Verifikasi ${status}`, "success")
      load()
    } catch (err) { addToast?.(err.message, "error") }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    setSavingCat(true)
    try {
      await createCategory(catForm)
      addToast?.("Kategori ditambahkan", "success")
      setCatModalOpen(false); setCatForm({ nama: "", deskripsi: "" }); load()
    } catch (err) { addToast?.(err.message, "error") }
    finally { setSavingCat(false) }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm("Yakin hapus kategori ini?")) return
    try { await deleteCategory(id); addToast?.("Kategori dihapus", "success"); load() }
    catch (err) { addToast?.(err.message, "error") }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Crown className="w-7 h-7 text-primary" /> Super Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Kelola seluruh platform Sewain</p>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-1" /> Statistik</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Semua Pengguna</TabsTrigger>
          <TabsTrigger value="categories"><FolderOpen className="w-4 h-4 mr-1" /> Kategori</TabsTrigger>
          <TabsTrigger value="verifications"><ShieldCheck className="w-4 h-4 mr-1" /> Verifikasi</TabsTrigger>
          <TabsTrigger value="rentals" onClick={loadRentals}><ClipboardList className="w-4 h-4 mr-1" /> Semua Transaksi</TabsTrigger>
        </TabsList>

        {/* === STATS === */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.total_users || 0} />
                <StatCard icon={Package} label="Total Barang" value={stats.total_items || 0} />
                <StatCard icon={ClipboardList} label="Total Transaksi" value={stats.total_rentals || 0} />
                <StatCard icon={Crown} label="Admin Aktif" value={stats.total_admins || 0} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={CheckCircle} label="Barang Tersedia" value={stats.items_available || 0} />
                <StatCard icon={Package} label="Sedang Disewa" value={stats.items_rented || 0} />
                <StatCard icon={ClipboardList} label="Sewa Pending" value={stats.rentals_pending || 0} />
                <StatCard icon={ShieldCheck} label="KTP Menunggu" value={stats.users_pending_verification || 0} />
              </div>
              {stats.revenue_total !== undefined && (
                <StatCard icon={DollarSign} label="Total Revenue Platform" value={formatPrice(stats.revenue_total || 0)} />
              )}
            </>
          )}
        </TabsContent>

        {/* === USERS === */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {["", "user", "admin", "super_admin"].map(r => (
              <Button key={r} variant={userRoleFilter === r ? "default" : "outline"} size="sm" className="rounded-full"
                onClick={() => setUserRoleFilter(r)}
              >
                {r || "Semua"}
              </Button>
            ))}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verifikasi</TableHead>
                  <TableHead>Aksi</TableHead>
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
                        <Button size="sm" variant={u.is_active ? "destructive" : "success"} onClick={() => handleToggleActive(u)}>
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* === CATEGORIES === */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Kategori Barang</h2>
            <Button onClick={() => setCatModalOpen(true)}><Plus className="w-4 h-4 mr-1" /> Kategori Baru</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground flex items-center gap-1">
                        <FolderOpen className="w-4 h-4 text-primary" /> {c.nama}
                      </h3>
                      {c.deskripsi && <p className="text-sm text-muted-foreground mt-1">{c.deskripsi}</p>}
                    </div>
                    <Button size="icon" variant="destructive" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteCategory(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ID: {c.id} &middot; {new Date(c.created_at).toLocaleDateString("id-ID")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* === VERIFICATIONS === */}
        <TabsContent value="verifications" className="space-y-4 mt-4">
          <h2 className="text-lg font-semibold">Verifikasi KTP Pengguna</h2>
          {verifications.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Tidak ada yang menunggu verifikasi</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {verifications.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">User #{p.user_id}</h3>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        {p.alamat && <div>Alamat: {p.alamat}</div>}
                        {p.nama_orang_tua && <div>Orang Tua: {p.nama_orang_tua}</div>}
                      </div>
                      <div className="mt-2"><StatusBadge status={p.status_verifikasi} /></div>
                      <div className="flex gap-3 mt-2">
                        {p.foto_ktp && (
                          <a href={p.foto_ktp} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <Eye className="w-3.5 h-3.5" /> Lihat KTP
                          </a>
                        )}
                        {p.foto_selfie_ktp && (
                          <a href={p.foto_selfie_ktp} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" /> Lihat Selfie
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="success" onClick={() => handleVerify(p.user_id, "disetujui")}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleVerify(p.user_id, "ditolak")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
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
              <Button key={s} variant={rentalStatusFilter === s ? "default" : "outline"} size="sm" className="rounded-full"
                onClick={() => setRentalStatusFilter(s)}
              >
                {s || "Semua"}
              </Button>
            ))}
          </div>
          {rentals.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Tidak ada transaksi</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map(r => (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground">{r.item?.nama || `Item #${r.item_id}`}</h3>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          Penyewa: {r.user?.nama || `User #${r.user_id}`}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(r.tanggal_selesai).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-lg font-bold text-primary mt-2">{formatPrice(r.total_harga)}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>Buat kategori untuk mengelompokkan barang sewa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input placeholder="Elektronik" value={catForm.nama}
                onChange={(e) => setCatForm(p => ({ ...p, nama: e.target.value }))} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Deskripsi kategori..."
                value={catForm.deskripsi}
                onChange={(e) => setCatForm(p => ({ ...p, deskripsi: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={savingCat}>Tambah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
