/**
 * CatalogPage — Sewain
 * Modern minimalist · search-first dengan filter sticky di kiri (desktop).
 */
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItems, fetchCategories, fetchItemCities } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Layout/Navbar"
import Footer from "../components/Layout/Footer"
import {
  Search, Package, ShoppingCart, ArrowLeft, ArrowRight, X,
  Sparkles, Eye, SlidersHorizontal, Filter, Store, MapPin,
} from "lucide-react"
import { useTour } from "../hooks/useTour"
import TourButton from "../components/TourButton"
import { TOUR_KEYS } from "../lib/tour"
import { catalogSteps } from "../lib/tourSteps"

/* ─── motion ──────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1]

/* ─── nav links ───────────────────────────────────────────── */
const catalogNavLinks = [
  { label: "Beranda", to: "/" },
  { label: "Katalog", to: "/catalog" },
  { label: "Tentang", to: "/about" },
  { label: "Mulai",   to: "/login" },
]

/* ─── status ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
  available:   { label: "Tersedia",        cls: "bg-white/90 text-emerald-700 backdrop-blur-sm shadow-sm border border-emerald-200" },
  rented:      { label: "Disewa",          cls: "bg-white/90 text-amber-700 backdrop-blur-sm shadow-sm border border-amber-200" },
  unavailable: { label: "Tidak tersedia",  cls: "bg-white/90 text-muted-foreground backdrop-blur-sm shadow-sm border border-border" },
}

/* ─── ItemCard ────────────────────────────────────────────── */
function ItemCard({ item, onRent, index }) {
  const navigate = useNavigate()
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=0a6e4a&color=fff&size=400&bold=true`
  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.unavailable

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: Math.min(index * 0.05, 0.4) }}
      layout
      className="group rounded-3xl border border-border bg-card overflow-hidden flex flex-col lift"
    >
      {/* Image */}
      <button
        type="button"
        onClick={() => navigate(`/items/${item.id}`)}
        className="relative aspect-[4/3] overflow-hidden bg-secondary"
      >
        <img
          src={item.foto_url || fallback}
          alt={item.nama}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => { e.target.src = fallback }}
          loading="lazy"
        />

        {/* Quick view indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-foreground/10 transition-opacity">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-semibold text-foreground shadow-soft">
            <Eye className="w-3.5 h-3.5" /> Lihat detail
          </span>
        </div>

        {/* Badges */}
        {item.category && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-background/90 text-primary backdrop-blur">
            {item.category.nama}
          </span>
        )}
      </button>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="font-semibold tracking-tight line-clamp-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate(`/items/${item.id}`)}
        >
          {item.nama}
        </h3>
        {item.admin_nama_usaha && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Store className="w-3 h-3" />
            {item.admin_nama_usaha}
          </p>
        )}
        {item.admin_kota && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.admin_kota}
          </p>
        )}
        {item.deskripsi && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 flex-1 leading-relaxed">
            {item.deskripsi}
          </p>
        )}

        <div className="flex items-end justify-between mt-5">
          <div>
            <div className="text-xl font-bold text-foreground tracking-tight">
              {formatPrice(item.harga_per_hari)}
            </div>
            <div className="text-xs text-muted-foreground">/ hari · stok {item.stok}</div>
          </div>
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={() => onRent(item)}
            disabled={item.stok <= 0}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Sewa
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Skeleton ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="aspect-[4/3] bg-secondary animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-muted rounded-full w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded-full w-full animate-pulse" />
        <div className="h-7 bg-muted rounded-full w-1/2 mt-2 animate-pulse" />
      </div>
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────── */
function EmptyState({ onReset }) {
  return (
    <div className="text-center py-24 col-span-full">
      <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5">
        <Package className="w-9 h-9 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold tracking-tight">Barang tidak ditemukan</h3>
      <p className="text-muted-foreground mt-2 text-sm">Coba ubah kata kunci atau filter pencarian.</p>
      <Button onClick={onReset} className="mt-6 rounded-full px-6">
        Reset filter
      </Button>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function CatalogPage({ addToast }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const { startTour } = useTour({
    tourKey:   TOUR_KEYS.catalog,
    steps:     catalogSteps,
    autoStart: false,
  })

  const initialSearch = searchParams.get("search") || ""

  const [items, setItems]               = useState([])
  const [total, setTotal]               = useState(0)
  const [categories, setCategories]     = useState([])
  const [cities, setCities]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState(initialSearch)
  const [searchInput, setSearchInput]   = useState(initialSearch)
  const [categoryId, setCategoryId]     = useState("")
  const [sortPrice, setSortPrice]       = useState("") // "asc" | "desc" | ""
  const [priceMin, setPriceMin]         = useState("")
  const [priceMax, setPriceMax]         = useState("")
  const [cityFilter, setCityFilter]     = useState("")
  const [page, setPage]                 = useState(0)
  const [filterOpen, setFilterOpen]     = useState(false)
  const LIMIT = 12

  useEffect(() => {
    fetchCategories()
      .then(c => setCategories(Array.isArray(c) ? c : []))
      .catch(() => {})
    fetchItemCities()
      .then(c => setCities(Array.isArray(c) ? c : []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: page * LIMIT, limit: LIMIT }
      if (search)       params.search = search
      if (categoryId)   params.category_id = categoryId
      if (cityFilter)   params.city = cityFilter
      if (sortPrice)    params.sort_price = sortPrice
      if (priceMin)     params.price_min = priceMin
      if (priceMax)     params.price_max = priceMax
      const data = await fetchItems(params)
      setItems(Array.isArray(data) ? data : (data?.items || []))
      setTotal(data?.total || 0)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, sortPrice, priceMin, priceMax, cityFilter, page, addToast])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const clearFilter = () => {
    setSearch("")
    setSearchInput("")
    setCategoryId("")
    setSortPrice("")
    setPriceMin("")
    setPriceMax("")
    setCityFilter("")
    setPage(0)
  }

  const handleRent = (item) => {
    if (!isAuthenticated) { navigate("/login"); return }
    navigate(`/rentals/new?item=${item.id}`)
  }

  const hasFilter = !!(search || categoryId || sortPrice || priceMin || priceMax || cityFilter)
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  /* ─── reusable filter section (desktop sidebar / mobile sheet) ── */
  const FilterPanel = (
    <div className="space-y-7">
      {/* Urutkan Harga */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Urutkan Harga
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "",     label: "Default" },
            { v: "asc",  label: "Termurah" },
            { v: "desc", label: "Termahal" },
          ].map(({ v, label }) => (
            <button
              key={v || "default"}
              onClick={() => { setSortPrice(v); setPage(0); setFilterOpen(false) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                sortPrice === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Range Harga */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Range Harga
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {(priceMin || priceMax) && (
          <button
            onClick={() => { setPriceMin(""); setPriceMax(""); setPage(0) }}
            className="mt-2 text-[10px] text-destructive hover:underline"
          >
            Reset harga
          </button>
        )}
      </div>

      {cities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Kota
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCityFilter(""); setPage(0); setFilterOpen(false) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                !cityFilter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              Semua
            </button>
            {cities.map(c => (
              <button
                key={c}
                onClick={() => { setCityFilter(c); setPage(0); setFilterOpen(false) }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  cityFilter === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                <MapPin className="w-3 h-3" /> {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Kategori
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCategoryId(""); setPage(0); setFilterOpen(false) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              !categoryId
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            Semua
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setCategoryId(String(c.id)); setPage(0); setFilterOpen(false) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                categoryId === String(c.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {c.nama}
            </button>
          ))}
        </div>
      </div>

      {hasFilter && (
        <button
          onClick={() => { clearFilter(); setFilterOpen(false) }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline"
        >
          <X className="w-3.5 h-3.5" /> Reset semua filter
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ══ HERO SEARCH ════════════════════════════════════ */}
      <section className={`relative pb-12 md:pb-16 bg-section-alt overflow-hidden ${isAuthenticated ? "pt-4 md:pt-6" : "pt-24 md:pt-28"}`}>
        <div className="absolute inset-0 bg-dot-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="chip mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {total} barang siap sewa
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="text-4xl md:text-6xl font-bold tracking-tight leading-tight"
          >
            Cari barang yang{" "}
            <span className="font-display text-primary">tepat</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Telusuri ribuan barang dari penyedia terpercaya. Filter sesuai kebutuhanmu.
          </motion.p>

          <motion.form
            id="catalog-search-form"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            onSubmit={handleSearch}
            className="mt-8 flex items-center bg-card border border-border rounded-full p-1.5 pl-5 shadow-soft max-w-xl mx-auto focus-within:ring-2 focus-within:ring-primary/30 transition"
          >
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama barang..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 px-3 py-2.5 text-sm placeholder:text-muted-foreground"
            />
            <Button type="submit" className="rounded-full px-5 h-10">
              Cari
            </Button>
          </motion.form>
        </div>
      </section>

      {/* ══ MAIN ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Desktop sidebar */}
          <aside id="catalog-filter-sidebar" className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h3 className="font-semibold tracking-tight">Filter</h3>
              </div>
              {FilterPanel}
            </div>
          </aside>

          {/* Items column */}
          <div className="lg:col-span-9">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div id="catalog-results-count" className="text-sm text-muted-foreground">
                {loading ? (
                  "Memuat..."
                ) : (
                  <>
                    Menampilkan <span className="font-semibold text-foreground">{items.length}</span>
                    {" "}dari <span className="font-semibold text-foreground">{total}</span> barang
                  </>
                )}
              </div>

              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                <Filter className="w-3.5 h-3.5" /> Filter
                {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            </div>

            {/* Active filter chips */}
            <AnimatePresence>
              {hasFilter && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-5"
                >
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Aktif:</span>
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        "{search}"
                        <button onClick={() => { setSearch(""); setSearchInput(""); setPage(0) }} className="hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {categoryId && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {categories.find(c => String(c.id) === categoryId)?.nama}
                        <button onClick={() => { setCategoryId(""); setPage(0) }} className="hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {sortPrice && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {sortPrice === "asc" ? "Termurah" : "Termahal"}
                        <button onClick={() => { setSortPrice(""); setPage(0) }} className="hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(priceMin || priceMax) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Harga: {priceMin || "0"} — {priceMax || "∞"}
                        <button onClick={() => { setPriceMin(""); setPriceMax(""); setPage(0) }} className="hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : items.length === 0 ? (
              <EmptyState onReset={clearFilter} />
            ) : (
              <>
                <motion.div
                  id="catalog-items-grid"
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
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
                  <div className="flex justify-center items-center gap-3 mt-12">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium px-3">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={(page + 1) * LIMIT >= total}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Selanjutnya <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              onClick={() => setFilterOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease }}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold tracking-tight">Filter</h3>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {FilterPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />

      {/* Tour button */}
      <TourButton onClick={startTour} />
    </div>
  )
}
