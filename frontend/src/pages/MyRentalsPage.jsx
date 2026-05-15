/**
 * MyRentalsPage — Sewain
 * Riwayat sewa user · detail lengkap per transaksi.
 */
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { fetchMyRentals } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/skeleton"
import {
  ClipboardList, ArrowLeft, ArrowRight, Calendar, Package,
  Clock, CheckCircle, XCircle, TrendingUp, Eye, ShoppingCart,
  Hash, Timer, Store,
} from "lucide-react"

/* ─── status config ───────────────────────────────────────── */
const STATUS_META = {
  pending:        { label: "Menunggu",    cls: "bg-amber-100 text-amber-800",       icon: Clock },
  disetujui:      { label: "Disetujui",   cls: "bg-primary/10 text-primary",        icon: CheckCircle },
  sedang_disewa:  { label: "Berlangsung", cls: "bg-blue-100 text-blue-800",         icon: TrendingUp },
  selesai:        { label: "Selesai",     cls: "bg-secondary text-secondary-foreground", icon: CheckCircle },
  ditolak:        { label: "Ditolak",     cls: "bg-rose-100 text-rose-700",         icon: XCircle },
}

const STATUS_FILTERS = [
  { value: "",              label: "Semua",       icon: ClipboardList },
  { value: "pending",       label: "Menunggu",    icon: Clock },
  { value: "disetujui",     label: "Disetujui",   icon: CheckCircle },
  { value: "sedang_disewa", label: "Berlangsung", icon: TrendingUp },
  { value: "selesai",       label: "Selesai",     icon: CheckCircle },
  { value: "ditolak",       label: "Ditolak",     icon: XCircle },
]

/* ─── helpers ─────────────────────────────────────────────── */
function calcDays(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.ceil(ms / 86400000))
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })
}

/* ─── RentalCard ──────────────────────────────────────────── */
function RentalCard({ rental }) {
  const navigate = useNavigate()
  const item = rental.item
  const meta = STATUS_META[rental.status] || { label: rental.status, cls: "bg-muted text-muted-foreground", icon: Clock }
  const StatusIcon = meta.icon
  const days = calcDays(rental.tanggal_mulai, rental.tanggal_selesai)
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=0a6e4a&color=fff&size=200&bold=true`

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <button
          onClick={() => navigate(`/items/${rental.item_id}`)}
          className="relative w-full sm:w-44 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-secondary"
        >
          <img
            src={item?.foto_url || fallback}
            alt={item?.nama}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => { e.target.src = fallback }}
          />
          {/* Status badge on image */}
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>
            <StatusIcon className="w-3 h-3" /> {meta.label}
          </span>
        </button>

        {/* Details */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Top row: name + price */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="font-semibold tracking-tight text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/items/${rental.item_id}`)}
              >
                {item?.nama || `Item #${rental.item_id}`}
              </h3>
              {item?.category && (
                <span className="text-xs text-muted-foreground">{item.category.nama}</span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold tracking-tight">{formatPrice(rental.total_harga)}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mulai</p>
                <p className="text-xs font-semibold">{formatDate(rental.tanggal_mulai)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Selesai</p>
                <p className="text-xs font-semibold">{formatDate(rental.tanggal_selesai)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Timer className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Durasi</p>
                <p className="text-xs font-semibold">{days} hari</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID Sewa</p>
                <p className="text-xs font-semibold">#{rental.id}</p>
              </div>
            </div>
          </div>

          {/* Bottom row: harga/hari + penyedia + actions */}
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {formatPrice(item?.harga_per_hari || 0)}/hari
              </span>
              {item?.admin_profile?.nama_usaha && (
                <span className="inline-flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  {item.admin_profile.nama_usaha}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs"
                onClick={() => navigate(`/items/${rental.item_id}`)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> Detail
              </Button>
              {rental.status === "selesai" && (
                <Button
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => navigate(`/rentals/new?item=${rental.item_id}`)}
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Sewa lagi
                </Button>
              )}
            </div>
          </div>

          {/* Catatan */}
          {rental.catatan && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-secondary/60 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Catatan:</span> {rental.catatan}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function MyRentalsPage({ addToast }) {
  const [rentals, setRentals] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const LIMIT = 8

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMyRentals({
        status: statusFilter || undefined,
        skip: page * LIMIT,
        limit: LIMIT,
      })
      setRentals(data.rentals || [])
      setTotal(data.total || 0)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, addToast])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Riwayat
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">
          Riwayat sewa saya
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau semua transaksi penyewaan — dari pending hingga selesai.
        </p>
      </div>

      {/* Summary strip */}
      {!loading && total > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> transaksi total
          {statusFilter && (
            <>
              <span>·</span>
              <span>Filter: <span className="font-medium text-foreground capitalize">{statusFilter}</span></span>
            </>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value || "all"}
            onClick={() => { setStatusFilter(value); setPage(0) }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              statusFilter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl border border-border bg-card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-44 h-28 rounded-2xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-10" />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-9 h-9 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Belum ada transaksi</h3>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
            {statusFilter
              ? `Tidak ada sewa dengan status "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}"`
              : "Mulai sewa barang dari katalog untuk melihat riwayat di sini."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {rentals.map(r => <RentalCard key={r.id} rental={r} />)}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-center items-center gap-3 pt-4">
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
  )
}
