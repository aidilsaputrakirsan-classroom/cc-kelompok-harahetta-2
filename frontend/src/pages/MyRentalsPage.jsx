/**
 * MyRentalsPage — Sewain
 * Riwayat sewa user · detail lengkap per transaksi.
 */
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { fetchMyRentals, fetchRentalReview, createRentalReview, updateReview, fetchMyPayments, fetchRentalPickupInfo } from "../services/api"
import { formatPrice } from "../lib/utils"
import { getRentalDeadline, formatDeadline } from "../lib/rental"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/Skeleton"
import RatingStars from "../components/RatingStars"
import ReviewForm from "../components/ReviewForm"
import PickupMap from "../components/PickupMap"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/Dialog"
import {
  ClipboardList, ArrowLeft, ArrowRight, Calendar, Package,
  Clock, CheckCircle, XCircle, TrendingUp, Eye, ShoppingCart,
  Hash, Timer, Store, Star, Pencil, CreditCard, MapPin, Navigation, AlertTriangle,
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

/* ─── Payment status config ───────────────────────────────── */
const PAYMENT_STATUS_META = {
  pending:   { label: "Menunggu Pembayaran", cls: "bg-amber-100 text-amber-800" },
  completed: { label: "Lunas", cls: "bg-primary/10 text-primary" },
  failed:    { label: "Pembayaran Ditolak", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Dibatalkan", cls: "bg-muted text-muted-foreground" },
}

/* ─── RentalCountdown ─────────────────────────────────────── */
function RentalCountdown({ rental }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [expired, setExpired] = useState(false)

  const deadline = getRentalDeadline(rental)
  const deadlineMs = deadline ? deadline.getTime() : null
  const deadlineLabel = deadline ? formatDeadline(deadline) : ""

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

  if (!deadlineMs) return null

  if (expired) {
    return (
      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-red-700">Waktu sewa habis</p>
          {deadlineLabel && <p className="text-[10px] text-red-600">Berakhir {deadlineLabel}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
      <div>
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Sisa waktu sewa
        </p>
        {deadlineLabel && <p className="text-[10px] text-slate-500">Tanggal selesai: {deadlineLabel}</p>}
      </div>
      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
        {t.d > 0 && <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{t.d}h</span>}
        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{String(t.h).padStart(2, "0")}j</span>
        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{String(t.m).padStart(2, "0")}m</span>
        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">{String(t.s).padStart(2, "0")}s</span>
      </div>
    </div>
  )
}

/* ─── RentalCard ──────────────────────────────────────────── */
function RentalCard({ rental, review, payment, onReview, onPickup }) {
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
          {/* Payment status badge */}
          {payment && rental.status !== "ditolak" && (
            <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${PAYMENT_STATUS_META[payment.status]?.cls || "bg-muted text-muted-foreground"}`}>
              <CreditCard className="w-3 h-3" /> {PAYMENT_STATUS_META[payment.status]?.label || payment.status}
            </span>
          )}
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

          {/* Status info banner */}
          {rental.status === "disetujui" && payment?.status === "completed" && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <CheckCircle className="w-3.5 h-3.5" /> Pembayaran terkonfirmasi
                </span>
              </div>
              <button
                onClick={() => onPickup?.(rental)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                Lihat lokasi pengambilan
              </button>
            </div>
          )}

          {rental.status === "disetujui" && payment?.status !== "completed" && (
            <div className="mt-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Menunggu pembayaran</span>
            </div>
          )}

          {rental.status === "sedang_disewa" && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-700">Barang sedang disewa</span>
              </div>
              <button
                onClick={() => onPickup?.(rental, true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                Alamat pengembalian barang
              </button>
              <RentalCountdown rental={rental} />
            </div>
          )}

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
              {/* Payment status badge + Bayar button */}
              {payment && rental.status !== "ditolak" && (
                <>
                  {payment.status !== "completed" && (
                    <Button
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => navigate(`/payment/${rental.id}`)}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Bayar
                    </Button>
                  )}
                </>
              )}
              {rental.status === "disetujui" && !payment && (
                <Button
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => navigate(`/payment/${rental.id}`)}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> Bayar
                </Button>
              )}
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
              {rental.status === "selesai" && (
                review ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs"
                    onClick={() => onReview?.(rental, review)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit ulasan
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => onReview?.(rental, null)}
                  >
                    <Star className="w-3.5 h-3.5 mr-1" /> Beri ulasan
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Review preview */}
          {rental.status === "selesai" && review && (
            <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <RatingStars value={review.rating} size="sm" />
                <span className="text-xs font-semibold text-amber-900">
                  Ulasan kamu
                </span>
              </div>
              {review.komentar && (
                <p className="text-xs text-amber-900/80 line-clamp-2">{review.komentar}</p>
              )}
            </div>
          )}

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
  const [reviewsByRental, setReviewsByRental] = useState({}) // { [rentalId]: review|null }
  const [reviewModal, setReviewModal] = useState({ open: false, rental: null, review: null })
  const [paymentMap, setPaymentMap] = useState({}) // { [rentalId]: payment }
  const [pickupModal, setPickupModal] = useState(null) // { pickup info + isReturn }
  const [pickupLoading, setPickupLoading] = useState(false)
  const LIMIT = 8

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, paymentData] = await Promise.all([
        fetchMyRentals({
          status: statusFilter || undefined,
          skip: page * LIMIT,
          limit: LIMIT,
        }),
        fetchMyPayments({ limit: 100 }),
      ])
      setRentals(data.rentals || [])
      setTotal(data.total || 0)
      const map = {}
      for (const p of (paymentData.payments || [])) map[p.rental_id] = p
      setPaymentMap(map)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, addToast])

  useEffect(() => { load() }, [load])

  // Setiap kali daftar rental berubah, lookup review untuk yang status === selesai
  useEffect(() => {
    const completed = rentals.filter(r => r.status === "selesai" && reviewsByRental[r.id] === undefined)
    if (!completed.length) return
    let cancelled = false
    Promise.all(
      completed.map(r =>
        fetchRentalReview(r.id)
          .then(rv => [r.id, rv])
          .catch(() => [r.id, null]) // 404 → belum ada review
      )
    ).then(pairs => {
      if (cancelled) return
      setReviewsByRental(prev => {
        const next = { ...prev }
        pairs.forEach(([id, rv]) => { next[id] = rv })
        return next
      })
    })
    return () => { cancelled = true }
  }, [rentals, reviewsByRental])

  const handleOpenReview = (rental, review) => {
    setReviewModal({ open: true, rental, review })
  }

  const handlePickup = async (rental, isReturn = false) => {
    setPickupLoading(true)
    try {
      const info = await fetchRentalPickupInfo(rental.id)
      setPickupModal({ ...info, isReturn, tanggal_mulai: rental.tanggal_mulai, tanggal_selesai: rental.tanggal_selesai })
    } catch {
      addToast?.("Koordinat lokasi belum tersedia", "error")
    } finally {
      setPickupLoading(false)
    }
  }

  const handleSubmitReview = async ({ rating, komentar }) => {
    const { rental, review } = reviewModal
    if (!rental) return
    let saved
    if (review) {
      saved = await updateReview(review.id, { rating, komentar })
      addToast?.("Ulasan berhasil diperbarui", "success")
    } else {
      saved = await createRentalReview(rental.id, { rating, komentar })
      addToast?.("Terima kasih atas ulasanmu!", "success")
    }
    setReviewsByRental(prev => ({ ...prev, [rental.id]: saved }))
  }

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
            {rentals.map(r => (
              <RentalCard
                key={r.id}
                rental={r}
                review={reviewsByRental[r.id] || null}
                payment={paymentMap[r.id] || null}
                onReview={handleOpenReview}
                onPickup={handlePickup}
              />
            ))}
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

      {/* Review modal */}
      <ReviewForm
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, rental: null, review: null })}
        initial={reviewModal.review}
        onSubmit={handleSubmitReview}
        itemNama={reviewModal.rental?.item?.nama}
      />

      {/* Pickup location modal */}
      <Dialog open={!!pickupModal} onOpenChange={() => setPickupModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {pickupModal?.isReturn ? "Lokasi pengembalian" : "Lokasi pengambilan"}
            </DialogTitle>
          </DialogHeader>
          {pickupModal && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
                {pickupModal.pickup_nama_usaha && (
                  <p className="font-bold text-slate-800">{pickupModal.pickup_nama_usaha}</p>
                )}
                {pickupModal.pickup_alamat && (
                  <p className="text-sm text-slate-600">{pickupModal.pickup_alamat}</p>
                )}
                {pickupModal.pickup_telepon && (
                  <p className="text-sm text-slate-500">📞 {pickupModal.pickup_telepon}</p>
                )}
                <p className="text-xs text-slate-400">
                  📅 {new Date(pickupModal.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(pickupModal.tanggal_selesai).toLocaleDateString("id-ID")}
                </p>
              </div>

              {pickupModal.pickup_latitude && pickupModal.pickup_longitude && (
                <PickupMap
                  lat={pickupModal.pickup_latitude}
                  lng={pickupModal.pickup_longitude}
                  label={pickupModal.pickup_nama_usaha || "Lokasi"}
                />
              )}

              {pickupModal.pickup_latitude && pickupModal.pickup_longitude && (
                <a
                  href={`https://www.google.com/maps?q=${pickupModal.pickup_latitude},${pickupModal.pickup_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition"
                >
                  <Navigation className="w-4 h-4" />
                  Buka di Google Maps
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
