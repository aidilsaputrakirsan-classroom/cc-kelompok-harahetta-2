import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItems, fetchCategories } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Layout/Navbar"
import {
  Search, Package, ShoppingCart, ArrowLeft, ArrowRight,
  X, Sparkles, CheckCircle, Clock, Eye, Tag,
} from "lucide-react"

/* ─── Navbar breadcrumb config ──────────────────────────── */

const catalogBreadcrumb = [
  { label: "Beranda", to: "/" },
  { label: "Katalog Barang" },
]

/* ─── Item status config ────────────────────────────────── */

const STATUS_CONFIG = {
  available:   { label: "Tersedia",        cls: "bg-emerald-100 text-emerald-700" },
  rented:      { label: "Disewa",          cls: "bg-amber-100 text-amber-700" },
  unavailable: { label: "Tidak Tersedia",  cls: "bg-slate-100 text-slate-500" },
}

/* ─── Item Card ─────────────────────────────────────────── */

function ItemCard({ item, onRent, index }) {
  const navigate = useNavigate()
  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=1b7e6a&color=fff&size=400&bold=true`
  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.unavailable

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.06, 0.42) }}
      whileHover={{ y: -6 }}
      layout
    >
      <div className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {/* Image */}
        <div
          className="relative aspect-[4/3] overflow-hidden bg-slate-50 cursor-pointer"
          onClick={() => navigate(`/items/${item.id}`)}
        >
          <motion.img
            src={item.foto_url || imgFallback}
            alt={item.nama}
            className="w-full h-full object-cover bg-muted"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onError={(e) => { e.target.src = imgFallback }}
          />
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            whileHover={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5" /> Lihat Detail
            </span>
          </motion.div>

          {/* Badges */}
          <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
            {st.label}
          </span>
          {item.category && (
            <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 text-primary px-2 py-0.5 rounded-full shadow-sm">
              {item.category.nama}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3
            className="font-bold text-foreground line-clamp-1 text-base cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/items/${item.id}`)}
          >
            {item.nama}
          </h3>
          {item.deskripsi && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1 leading-relaxed">{item.deskripsi}</p>
          )}
          <div className="flex items-end justify-between mt-4">
            <div>
              <div className="text-xl font-extrabold text-primary">{formatPrice(item.harga_per_hari)}</div>
              <div className="text-xs text-muted-foreground">/ hari &middot; Stok {item.stok}</div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => navigate(`/items/${item.id}`)}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors"
                title="Lihat Detail"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
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
      </div>
    </motion.div>
  )
}

/* ─── Skeleton card ─────────────────────────────────────── */

function SkeletonCard({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm"
    >
      <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
        <div className="h-6 bg-slate-100 rounded-full w-1/3 animate-pulse mt-3" />
      </div>
    </motion.div>
  )
}

/* ─── Empty state ───────────────────────────────────────── */

function EmptyState({ onReset }) {
  return (
    <motion.div
      className="text-center py-24"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "backOut" }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Package className="w-20 h-20 text-slate-200 mx-auto mb-4" />
      </motion.div>
      <h3 className="text-xl font-bold text-slate-600">Barang tidak ditemukan</h3>
      <p className="text-slate-400 mt-2 text-sm">Coba ubah kata kunci atau filter pencarian</p>
      <button
        onClick={onReset}
        className="mt-5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
      >
        Reset filter
      </button>
    </motion.div>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function CatalogPage({ addToast }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [items, setItems]               = useState([])
  const [total, setTotal]               = useState(0)
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [searchInput, setSearchInput]   = useState("")
  const [categoryId, setCategoryId]     = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage]                 = useState(0)
  const LIMIT = 12

  useEffect(() => {
    fetchCategories().then(c => setCategories(Array.isArray(c) ? c : [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * LIMIT, limit: LIMIT }
      if (search)       params.search = search
      if (categoryId)   params.category_id = categoryId
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
    <div className="min-h-screen bg-page">
      <Navbar breadcrumb={catalogBreadcrumb} />

      {/* ── HERO SEARCH ─────────────────────────────────── */}
      <section className="pt-16 relative overflow-hidden bg-gradient-to-br from-[#0d5c4a] via-[#1b7e6a] to-[#2a9d87]">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"
            animate={{ scale: [1.1, 1, 1.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> {total} barang tersedia
            </span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl font-extrabold text-white leading-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Katalog Barang Sewa
          </motion.h1>

          <motion.p
            className="text-white/70 mt-3 text-base md:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Temukan barang yang kamu butuhkan dari berbagai penyedia terpercaya
          </motion.p>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            className="mt-8 flex gap-2 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white shadow-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-white text-primary font-bold rounded-2xl shadow-lg hover:bg-slate-50 active:scale-95 transition whitespace-nowrap text-sm"
            >
              Cari
            </button>
          </motion.form>

          {/* Category pills */}
          <motion.div
            className="flex gap-2 flex-wrap justify-center mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => { setCategoryId(""); setPage(0) }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !categoryId
                  ? "bg-white text-primary shadow-md scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategoryId(String(c.id)); setPage(0) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  categoryId === String(c.id)
                    ? "bg-white text-primary shadow-md scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {c.nama}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ──────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "",           label: "Semua",    icon: null },
              { v: "available",  label: "Tersedia", icon: CheckCircle },
              { v: "rented",     label: "Disewa",   icon: Clock },
            ].map(({ v, label, icon: Icon }) => (
              <motion.button
                key={v}
                onClick={() => { setStatusFilter(v); setPage(0) }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statusFilter === v
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />} {label}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <AnimatePresence>
              {hasFilter && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearFilter}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </motion.button>
              )}
            </AnimatePresence>
            <span className="hidden sm:block font-semibold text-slate-700">{total} barang</span>
          </div>
        </div>
      </div>

      {/* ── GRID ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Active filter chips */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-center gap-2 text-sm text-slate-600 flex-wrap overflow-hidden"
            >
              <Tag className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-slate-500">Filter aktif:</span>
              {search && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-xs">
                  "{search}"
                </span>
              )}
              {categoryId && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-xs">
                  {categories.find(c => String(c.id) === categoryId)?.nama}
                </span>
              )}
              {statusFilter && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-xs capitalize">
                  {statusFilter}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState onReset={clearFilter} />
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
              layout
            >
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onRent={handleRent}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {total > LIMIT && (
              <motion.div
                className="flex justify-center items-center gap-3 mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Sebelumnya
                </motion.button>
                <span className="text-sm text-slate-500 font-medium px-2">
                  {page + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={(page + 1) * LIMIT >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  Selanjutnya <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <motion.footer
        className="border-t bg-card mt-8 py-7"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-700">Sewain</span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Sewain Platform &middot; Kelompok Harahetta-2
          </p>
          <Link to="/" className="text-xs text-primary hover:underline font-medium">
            Kembali ke Beranda
          </Link>
        </div>
      </motion.footer>
    </div>
  )
}
