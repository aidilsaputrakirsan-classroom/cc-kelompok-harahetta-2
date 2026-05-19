import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItems, fetchCategories } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"
import { StatusBadge } from "../components/ui/Badge"
import { Skeleton } from "../components/ui/Skeleton"
import { Search, Package, ShoppingCart, ArrowLeft, ArrowRight, X, Settings } from "lucide-react"

function ItemCard({ item, role, onRent }) {
  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=1b7e6a&color=fff&size=400&bold=true`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={item.foto_url || imgFallback}
          alt={item.nama}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = imgFallback }}
        />
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-foreground line-clamp-1">{item.nama}</h3>
        {item.deskripsi && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.deskripsi}</p>}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="text-lg font-extrabold text-primary">{formatPrice(item.harga_per_hari)}</div>
            <div className="text-xs text-muted-foreground">per hari</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Stok: {item.stok}
          </div>
        </div>
        {item.category && (
          <div className="mt-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
            {item.category.nama}
          </div>
        )}
        {role === "user" && item.status === "available" && (
          <Button size="sm" className="w-full mt-3" onClick={onRent}>
            <ShoppingCart className="w-4 h-4 mr-1" /> Sewa
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage({ addToast }) {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const LIMIT = 12

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { search, skip: page * LIMIT, limit: LIMIT }
      if (categoryId) params.category_id = categoryId
      if (statusFilter) params.status = statusFilter
      const data = await fetchItems(params)
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, statusFilter, page, addToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}) }, [])

  const handleSearch = (e) => { e.preventDefault(); setPage(0); load() }
  const isAdminRole = isAdmin || isSuperAdmin

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isAdminRole ? "Katalog Barang" : "Temukan Barang"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminRole ? `Total ${total} barang di platform` : `Hallo, ${user?.nama}! Cari barang yang ingin disewa`}
          </p>
        </div>
        {isAdminRole && (
          <Button onClick={() => navigate("/admin/dashboard")}>
            <Settings className="w-4 h-4 mr-1" /> Kelola Barang
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Cari</Button>
            </form>

            <select
              className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(0) }}
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>

            <select
              className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            >
              <option value="">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="rented">Disewa</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>

            {(search || categoryId || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(""); setStatusFilter(""); setPage(0) }}>
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[4/3] rounded-t-xl" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Tidak ada barang ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1">Coba ubah filter pencarian atau kata kunci</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                role={user?.role}
                onRent={() => navigate(`/rentals/new?item=${item.id}`)}
              />
            ))}
          </div>

          {total > LIMIT && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Hal. {page + 1} / {Math.ceil(total / LIMIT)} ({total} barang)
              </span>
              <Button variant="outline" size="sm" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
                Selanjutnya <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
