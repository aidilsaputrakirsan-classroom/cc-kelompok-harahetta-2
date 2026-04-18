import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItems, fetchCategories } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Skeleton } from "../components/ui/skeleton"
import {
  Search, Package, ShoppingCart, ChevronRight, ArrowLeft, ArrowRight,
  SlidersHorizontal, X, Menu, LogOut, LayoutDashboard, Sparkles,
  Tag, CheckCircle, Clock,
} from "lucide-react"

// ── Navbar (sama gaya dengan LandingPage) ───────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const homeRoute = isAdmin || isSuperAdmin ? "/dashboard" : "/home"

  const handleLogout = () => { logout(); navigate("/"); setOpen(false) }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/sewainLogo.webp" alt="Sewain" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-bold text-xl text-slate-800">Sewain</span>
        </Link>

        {/* Desktop center: breadcrumb */}
        <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800 transition-colors">Beranda</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800">Katalog Barang</span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-500">
                Halo, <span className="font-semibold text-slate-800">{user?.nama?.split(" ")[0]}</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate(homeRoute)}>
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
              </Button>
              <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/login"><Button size="sm">Masuk / Daftar</Button></Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-b px-4 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Button className="w-full" size="sm" variant="outline" onClick={() => { navigate(homeRoute); setOpen(false) }}>
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
              </Button>
              <button onClick={handleLogout} className="w-full text-sm text-destructive flex items-center justify-center gap-1 py-2">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}><Button className="w-full">Masuk / Daftar</Button></Link>
          )}
        </div>
      )}
    </nav>
  )
}

// ── Item Card ───────────────────────────────────────────────
const STATUS_CONFIG = {
  available: { label: "Tersedia", cls: "bg-emerald-100 text-emerald-700" },
  rented:    { label: "Disewa",   cls: "bg-amber-100  text-amber-700" },
  unavailable:{ label: "Tidak Tersedia", cls: "bg-slate-100 text-slate-500" },
}

function ItemCard({ item, onRent, isAuthenticated }) {
  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=1b7e6a&color=fff&size=400&bold=true`
  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.unavailable

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        <img
          src={item.foto_url || imgFallback}
          alt={item.nama}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = imgFallback }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
          {st.label}
        </span>
        {item.category && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 text-primary px-2 py-0.5 rounded-full">
            {item.category.nama}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 line-clamp-1 text-base">{item.nama}</h3>
        {item.deskripsi && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex-1">{item.deskripsi}</p>
        )}
        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-xl font-extrabold text-primary">{formatPrice(item.harga_per_hari)}</div>
            <div className="text-xs text-slate-400">/ hari · Stok {item.stok}</div>
          </div>
          {item.status === "available" && (
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => onRent(item)}
              disabled={item.stok <= 0}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Sewa
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
        <div className="h-6 bg-slate-100 rounded-full w-1/3 animate-pulse mt-3" />
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function CatalogPage({ addToast }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [items, setItems]           = useState([])
  const [total, setTotal]           = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage]             = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const LIMIT = 12

  useEffect(() => { fetchCategories().then(c => setCategories(Array.isArray(c) ? c : [])).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * LIMIT, limit: LIMIT }
      if (search)     params.search = search
      if (categoryId) params.category_id = categoryId
      if (statusFilter) params.status = statusFilter
      const data = await fetchItems(params)
      setItems(Array.isArray(data) ? data : (data?.items || []))
      setTotal(data?.total || 0)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, statusFilter, page, addToast])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const clearFilter = () => {
    setSearch(""); setSearchInput(""); setCategoryId(""); setStatusFilter(""); setPage(0)
  }

  const handleRent = (item) => {
    if (!isAuthenticated) { navigate("/login"); return }
    navigate(`/rentals/new?item=${item.id}`)
  }

  const hasFilter = search || categoryId || statusFilter

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Navbar />

      {/* ── HERO SEARCH ──────────────────────────────────── */}
      <section className="pt-16 bg-gradient-to-br from-[#0d5c4a] via-[#1b7e6a] to-[#2a9d87]">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" /> {total} barang tersedia
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Katalog Barang Sewa
          </h1>
          <p className="text-white/70 mt-3 text-base md:text-lg max-w-2xl mx-auto">
            Temukan barang yang kamu butuhkan dari berbagai penyedia terpercaya
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white shadow-md text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button type="submit"
              className="px-6 py-3 bg-white text-primary font-bold rounded-2xl shadow-md hover:bg-slate-50 transition whitespace-nowrap text-sm">
              Cari
            </button>
          </form>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap justify-center mt-5">
            <button
              onClick={() => { setCategoryId(""); setPage(0) }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                !categoryId ? "bg-white text-primary" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategoryId(String(c.id)); setPage(0) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  categoryId === String(c.id) ? "bg-white text-primary" : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {c.nama}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ───────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "", label: "Semua Status", icon: null },
              { v: "available", label: "Tersedia", icon: CheckCircle },
              { v: "rented",    label: "Disewa",   icon: Clock },
            ].map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => { setStatusFilter(v); setPage(0) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                  statusFilter === v
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />} {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {hasFilter && (
              <button onClick={clearFilter} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
            <span className="hidden sm:block font-medium text-slate-700">{total} barang</span>
          </div>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Active search/filter info */}
        {hasFilter && (
          <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
            <Tag className="w-4 h-4 text-primary" />
            Filter aktif:
            {search && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">"{search}"</span>}
            {categoryId && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {categories.find(c => String(c.id) === categoryId)?.nama}
              </span>
            )}
            {statusFilter && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{statusFilter}</span>}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600">Barang tidak ditemukan</h3>
            <p className="text-slate-400 mt-1 text-sm">Coba ubah kata kunci atau filter pencarian</p>
            <button onClick={clearFilter} className="mt-4 text-primary underline text-sm font-semibold">
              Reset filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map(item => (
                <ItemCard key={item.id} item={item} onRent={handleRent} isAuthenticated={isAuthenticated} />
              ))}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
                >
                  <ArrowLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <span className="text-sm text-slate-500 font-medium">
                  {page + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <button
                  disabled={(page + 1) * LIMIT >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
                >
                  Selanjutnya <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t bg-white mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-700">Sewain</span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Sewain Platform · Kelompok Harahetta-2
          </p>
          <Link to="/" className="text-xs text-primary hover:underline">Kembali ke Beranda</Link>
        </div>
      </footer>
    </div>
  )
}
