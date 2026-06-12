/**
 * UserDashboard — Sewain
 * Modern minimalist · base hijau pekat + putih.
 * Fitur lengkap: ringkasan, sewa saya, payment modal, pickup map.
 */
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  fetchMyRentals, fetchItems, fetchMyPayments, createPaymentForRental,
  uploadPaymentProof, fetchAdminPaymentInfo, fetchRentalPickupInfo,
  requestReturn, fetchRentalReview, createRentalReview, updateReview,
} from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/Skeleton"
import {
  ShoppingCart, ClipboardList, ArrowRight, ArrowLeft, ArrowUpRight,
  Package, CheckCircle, Clock, TrendingUp, Calendar, ChevronRight,
  Sparkles, BadgeCheck, XCircle, Upload, X, CreditCard, Loader2,
  Building2, QrCode, Copy, AlertTriangle, MapPin, Navigation, RefreshCw,
  Star, Pencil,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import PickupMap from "../components/PickupMap"
import RatingStars from "../components/RatingStars"
import ReviewForm from "../components/ReviewForm"
import { getRentalDeadline, formatDeadline } from "../lib/rental"
import { useTour } from "../hooks/useTour"
import TourButton from "../components/TourButton"
import { TOUR_KEYS } from "../lib/tour"
import { dashboardSteps } from "../lib/tourSteps"

/* ─── status meta ─────────────────────────────────────────── */
const STATUS_META = {
  pending:        { label: "Menunggu",     cls: "bg-amber-100 text-amber-800" },
  disetujui:      { label: "Disetujui",    cls: "bg-primary/10 text-primary" },
  sedang_disewa:  { label: "Berlangsung",  cls: "bg-primary/10 text-primary" },
  selesai:        { label: "Selesai",      cls: "bg-secondary text-secondary-foreground" },
  ditolak:        { label: "Ditolak",      cls: "bg-rose-100 text-rose-700" },
}

const RENTAL_TABS = [
  { value: "",              label: "Semua",       icon: ClipboardList },
  { value: "pending",       label: "Menunggu",    icon: Clock },
  { value: "disetujui",     label: "Disetujui",   icon: CheckCircle },
  { value: "sedang_disewa", label: "Berlangsung", icon: TrendingUp },
  { value: "selesai",       label: "Selesai",     icon: CheckCircle },
  { value: "ditolak",       label: "Ditolak",     icon: XCircle },
]

const RENTAL_PAGE_SIZE = 6

/* ─── payment countdown (mini) ────────────────────────────── */
function PaymentMiniCountdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 1000))
  })

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  if (timeLeft <= 0) return <span className="text-[10px] text-red-600 font-semibold">Expired</span>

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isUrgent = timeLeft < 300

  return (
    <span className={`text-[10px] font-mono font-bold ${isUrgent ? "text-red-600" : "text-amber-600"}`}>
      ⏱ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  )
}

/* ─── countdown widget ────────────────────────────────────── */
function MiniCountdown({ rental, returnRequested, onReturnClick, returnLoading }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [expired, setExpired] = useState(false)

  const deadline = getRentalDeadline(rental)
  const deadlineMs = deadline ? deadline.getTime() : null
  const deadlineLabel = deadline ? formatDeadline(deadline) : ""
  const sourceFromPickup = !!rental?.due_at

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

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-border bg-secondary/40 rounded-xl p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> Sisa waktu sewa
        </span>
        {expired ? (
          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-lg inline-block">
            Waktu sewa habis
          </span>
        ) : (
          <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
            {t.d > 0 && <span className="bg-background border border-border px-1.5 py-0.5 rounded">{t.d}h</span>}
            <span className="bg-background border border-border px-1.5 py-0.5 rounded">{String(t.h).padStart(2, "0")}j</span>
            <span className="bg-background border border-border px-1.5 py-0.5 rounded">{String(t.m).padStart(2, "0")}m</span>
            <span className="bg-background border border-border px-1.5 py-0.5 rounded text-primary">{String(t.s).padStart(2, "0")}s</span>
          </div>
        )}
      </div>
      {deadlineLabel && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {sourceFromPickup ? "Berakhir " : "Tanggal selesai "}
          <span className="font-semibold text-foreground">{deadlineLabel}</span>
          {sourceFromPickup ? "  ·  24 jam sejak pengambilan" : ""}
        </p>
      )}
      {expired && returnRequested && (
        <div className="mt-2.5 w-full py-2 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-900">
          <Clock className="w-3.5 h-3.5" /> Menunggu konfirmasi admin
        </div>
      )}
      {expired && !returnRequested && (
        <button
          onClick={onReturnClick}
          disabled={returnLoading}
          className="mt-2.5 w-full py-2 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground flex items-center justify-center gap-1.5 hover:bg-destructive/90 disabled:opacity-50 transition"
        >
          {returnLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {returnLoading ? "Mengirim..." : "Kirim permintaan pengembalian"}
        </button>
      )}
    </div>
  )
}

/* ─── metric card ─────────────────────────────────────────── */
function Metric({ label, value, sub, icon: Icon, accent = false }) {
  return (
    <div
      className={`relative rounded-3xl p-5 lift overflow-hidden ${
        accent
          ? "bg-hero-deep text-white border border-white/10"
          : "bg-card border border-border"
      }`}
    >
      {accent && <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />}
      <div className="relative flex items-start justify-between">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${accent ? "text-white/60" : "text-muted-foreground"}`}>
          {label}
        </p>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            accent ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`relative mt-4 text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-foreground"}`}>
        {value}
      </p>
      <p className={`relative mt-1 text-xs ${accent ? "text-white/70" : "text-muted-foreground"}`}>
        {sub}
      </p>
    </div>
  )
}

/* ─── PAGE ────────────────────────────────────────────────── */
export default function UserDashboard({ addToast }) {
  const { user, isVerified } = useAuth()
  const navigate = useNavigate()

  const { startTour } = useTour({
    tourKey:   TOUR_KEYS.dashboard,
    steps:     dashboardSteps,
    autoStart: true,
    delay:     800,
  })

  const [rentals, setRentals]     = useState([])
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)

  const [allRentals, setAllRentals]     = useState([])
  const [allTotal, setAllTotal]         = useState(0)
  const [rentalLoading, setRentalLoading] = useState(false)
  const [statusTab, setStatusTab]       = useState("")
  const [rentalPage, setRentalPage]     = useState(0)

  const [payments, setPayments]         = useState([])
  const [buktiModal, setBuktiModal]     = useState(null)
  const [pickupModal, setPickupModal]   = useState(null)
  const [, setPickupLoading]            = useState(false)
  const [returnLoadingId, setReturnLoadingId] = useState(null)
  const [reviewsByRental, setReviewsByRental] = useState({})
  const [reviewModal, setReviewModal] = useState({ open: false, rental: null, review: null })
  const [adminPayInfo, setAdminPayInfo] = useState(null)
  const [buktiFile, setBuktiFile]       = useState(null)
  const [buktiCatatan, setBuktiCatatan] = useState("")
  const [buktiSubmitting, setBuktiSubmitting] = useState(false)
  const [copiedRek, setCopiedRek]       = useState(false)
  const buktiFileRef = useRef()

  /* ── initial load ── */
  useEffect(() => {
    Promise.all([
      fetchMyRentals({ limit: 20 }).catch(() => ({ rentals: [] })),
      fetchItems({ limit: 8 }).catch(() => ({ items: [] })),
      fetchMyPayments({ limit: 50 }).catch(() => ({ payments: [] })),
    ]).then(([r, it, p]) => {
      setRentals(Array.isArray(r) ? r : (r?.rentals || []))
      setItems(Array.isArray(it) ? it : (it?.items || []))
      setPayments(Array.isArray(p) ? p : (p?.payments || []))
    }).finally(() => setLoading(false))
  }, [])

  /* ── helpers ── */
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.75))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleBuktiFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressImage(file)
      setBuktiFile({ preview: base64, base64 })
    } catch { addToast?.("Gagal memproses gambar", "error") }
  }

  const copyRekening = () => {
    if (!adminPayInfo?.nomor_rekening) return
    navigator.clipboard.writeText(adminPayInfo.nomor_rekening).then(() => {
      setCopiedRek(true)
      setTimeout(() => setCopiedRek(false), 2000)
    })
  }

  const handleBuktiSubmit = async () => {
    if (!buktiFile) { addToast?.("Pilih foto bukti pembayaran terlebih dahulu", "warning"); return }
    setBuktiSubmitting(true)
    try {
      let payment = buktiModal.payment
      if (!payment) payment = await createPaymentForRental(buktiModal.rental.id)
      await uploadPaymentProof(payment.id, { bukti_pembayaran: buktiFile.base64, catatan: buktiCatatan })
      addToast?.("Bukti pembayaran berhasil dikirim", "success")
      const p = await fetchMyPayments({ limit: 50 }).catch(() => ({ payments: [] }))
      setPayments(Array.isArray(p) ? p : (p?.payments || []))
      setBuktiModal(null)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setBuktiSubmitting(false)
    }
  }

  const loadAllRentals = useCallback(async () => {
    setRentalLoading(true)
    try {
      const params = { skip: rentalPage * RENTAL_PAGE_SIZE, limit: RENTAL_PAGE_SIZE }
      if (statusTab) params.status = statusTab
      const data = await fetchMyRentals(params)
      setAllRentals(Array.isArray(data) ? data : (data?.rentals || []))
      setAllTotal(data?.total || 0)
      const p = await fetchMyPayments({ limit: 50 }).catch(() => ({ payments: [] }))
      setPayments(Array.isArray(p) ? p : (p?.payments || []))
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setRentalLoading(false)
    }
  }, [statusTab, rentalPage, addToast])

  useEffect(() => { loadAllRentals() }, [loadAllRentals])

  const handleRequestReturn = async (rentalId) => {
    setReturnLoadingId(rentalId)
    try {
      await requestReturn(rentalId)
      addToast?.("Permintaan pengembalian dikirim ke admin", "success")
      await loadAllRentals()
    } catch (err) {
      addToast?.(err.message || "Gagal kirim permintaan pengembalian", "error")
    } finally {
      setReturnLoadingId(null)
    }
  }

  // Load reviews for completed rentals
  useEffect(() => {
    const completed = allRentals.filter(r => r.status === "selesai" && reviewsByRental[r.id] === undefined)
    if (!completed.length) return
    let cancelled = false
    Promise.all(
      completed.map(r =>
        fetchRentalReview(r.id)
          .then(rv => [r.id, rv])
          .catch(() => [r.id, null])
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
  }, [allRentals])

  const handleOpenReview = (rental, review) => {
    setReviewModal({ open: true, rental, review })
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

  /* ── derived ── */
  const totalSpend = rentals.reduce((s, r) => s + (r.total_harga || 0), 0)
  const active     = rentals.filter(r => ["pending", "disetujui", "sedang_disewa"].includes(r.status))
  const done       = rentals.filter(r => r.status === "selesai")
  const pending    = rentals.filter(r => r.status === "pending")
  const completion = rentals.length ? Math.round((done.length / rentals.length) * 100) : 0
  const activeRentals = rentals.filter(r => r.status === "sedang_disewa" || r.status === "disetujui")

  const firstName = user?.nama?.split(" ")[0] || "Pengguna"
  const imgFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a6e4a&color=fff&size=100&bold=true`

  const h = new Date().getHours()
  const greet = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam"

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-7">
        {/* ── HEADER ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Dashboard penyewa
            </p>
            <h1 className="mt-1.5 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {greet},{" "}
              <span className="font-display text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola aktivitas penyewaan barangmu di sini.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {items.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/items/${item.id}`)}
                    className="w-9 h-9 rounded-full border-2 border-background overflow-hidden hover:scale-110 hover:z-10 transition-transform"
                    title={item.nama}
                  >
                    <img
                      src={item.foto_url || imgFallback(item.nama)}
                      alt={item.nama}
                      className="w-full h-full object-cover bg-muted"
                      onError={(e) => { e.target.src = imgFallback(item.nama) }}
                    />
                  </button>
                ))}
                {items.length > 5 && (
                  <div className="w-9 h-9 rounded-full border-2 border-background bg-secondary text-xs font-bold flex items-center justify-center text-muted-foreground">
                    +{items.length - 5}
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/catalog")}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                aria-label="Lihat katalog"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* ── VERIF ALERT ───────────────────────────────── */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-sm text-amber-900 flex-1">
              Lengkapi verifikasi KTP untuk bisa menyewa barang.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="text-xs font-bold text-amber-900 hover:underline whitespace-nowrap"
            >
              Verifikasi →
            </button>
          </motion.div>
        )}

        {/* ── METRICS ───────────────────────────────────── */}
        <div id="dashboard-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric
            icon={TrendingUp}
            label="Total pengeluaran"
            value={formatPrice(totalSpend)}
            sub={`Dari ${rentals.length} transaksi`}
          />
          <Metric
            accent
            icon={Package}
            label="Sewa aktif"
            value={active.length}
            sub={
              activeRentals.length > 0
                ? `Terbaru: ${activeRentals[0].item?.nama || "Barang"}`
                : "Belum ada barang disewa"
            }
          />
          <Metric
            icon={Clock}
            label="Menunggu"
            value={pending.length}
            sub={pending.length > 0 ? "Perlu bayar / konfirmasi" : "Semua transaksi lancar"}
          />
          <Metric
            icon={CheckCircle}
            label="Selesai"
            value={done.length}
            sub={`Tingkat penyelesaian ${completion}%`}
          />
        </div>

        {/* ── CTA BANNER ────────────────────────────────── */}
        <motion.div
          id="dashboard-cta-banner"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-hero-deep text-white px-6 py-7 md:px-9 md:py-9"
        >
          <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-dot-grid opacity-[0.04] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                {isVerified ? (
                  <BadgeCheck className="w-6 h-6 text-primary-300" />
                ) : (
                  <Sparkles className="w-6 h-6 text-amber-300" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-300">
                  {isVerified ? "Akun terverifikasi" : "Akses terbatas"}
                </p>
                <h3 className="mt-1 text-xl md:text-2xl font-bold tracking-tight">
                  {isVerified
                    ? "Jelajahi & sewa barang impianmu"
                    : "Akun belum terverifikasi"}
                </h3>
                <p className="mt-1 text-sm text-white/70 max-w-xl">
                  {isVerified
                    ? "Temukan berbagai pilihan barang berkualitas dari mitra penyedia kami."
                    : "Upload KTP/identitas resmi pada profil Anda agar bisa menyewa barang."}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="rounded-full px-7 bg-white text-primary-700 hover:bg-white/90 flex-shrink-0"
              onClick={() => navigate(isVerified ? "/catalog" : "/profile")}
            >
              {isVerified ? "Mulai jelajahi katalog" : "Lengkapi profil"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </motion.div>

        {/* ── SEWA SAYA ─────────────────────────────────── */}
        <div id="dashboard-rental-section" className="rounded-3xl border border-border bg-card p-5 md:p-7">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Sewa saya</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Semua transaksi penyewaan kamu
              </p>
            </div>
            <Button
              id="dashboard-new-rental-btn"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/catalog")}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Sewa baru
            </Button>
          </div>

          {/* Tab pills */}
          <div id="dashboard-rental-tabs" className="flex gap-2 flex-wrap mb-5 border-b border-border pb-5">
            {RENTAL_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value || "all"}
                onClick={() => { setStatusTab(value); setRentalPage(0) }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  statusTab === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {/* List */}
          {rentalLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded-full w-2/3" />
                    <div className="h-3 bg-muted rounded-full w-1/3" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : allRentals.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusTab
                  ? `Tidak ada sewa dengan status "${RENTAL_TABS.find(t => t.value === statusTab)?.label}"`
                  : "Mulai sewa barang dari katalog"}
              </p>
              {isVerified && (
                <Button size="sm" className="mt-4 rounded-full" onClick={() => navigate("/catalog")}>
                  Lihat katalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[480px] overflow-y-auto no-scrollbar pr-1">
                {allRentals.map(r => {
                  const item = r.item
                  const meta = STATUS_META[r.status] || { label: r.status, cls: "bg-muted text-muted-foreground" }
                  const payment = payments.find(p => p.rental_id === r.id)
                  const needsPayment = r.status === "disetujui" && payment
                  const hasBukti = !!payment?.bukti_pembayaran
                  const isPaid = payment?.status === "completed"

                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item?.foto_url || imgFallback(item?.nama || "Item")}
                          alt={item?.nama}
                          className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 bg-muted"
                          onError={(e) => { e.target.src = imgFallback(item?.nama || "Item") }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold tracking-tight truncate">
                            {item?.nama || `Item #${r.item_id}`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")} —{" "}
                            {new Date(r.tanggal_selesai).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                            {meta.label}
                          </span>
                          <span className="text-sm font-bold tracking-tight">
                            {formatPrice(r.total_harga)}
                          </span>
                        </div>
                      </div>

                      {/* Payment row */}
                      {needsPayment && (
                        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                <CheckCircle className="w-3.5 h-3.5" /> Lunas{payment.payment_channel ? ` — ${payment.payment_channel.replace(/_/g, " ").toUpperCase()}` : ""}
                              </span>
                            ) : payment?.midtrans_order_id ? (
                              <span className="text-xs font-semibold text-amber-700">
                                Menunggu pembayaran — {payment.payment_channel?.replace(/_/g, " ").toUpperCase() || "Midtrans"}
                                {payment.expires_at && (
                                  <> · <PaymentMiniCountdown expiresAt={payment.expires_at} /></>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-primary font-semibold">
                                Siap dibayar
                                {r.payment_deadline && (
                                  <> · <PaymentMiniCountdown expiresAt={r.payment_deadline} /></>
                                )}
                              </span>
                            )}
                          </div>
                          {!isPaid && (
                            <button
                              onClick={() => navigate(`/payment/${r.id}`)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {payment?.midtrans_order_id ? "Lihat instruksi" : "Bayar sekarang"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Pickup */}
                      {isPaid && r.status === "disetujui" && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <button
                            onClick={async () => {
                              setPickupLoading(true)
                              try {
                                const info = await fetchRentalPickupInfo(r.id)
                                setPickupModal({ ...info, isReturn: false })
                              } catch {
                                addToast?.("Koordinat lokasi belum tersedia", "error")
                              } finally {
                                setPickupLoading(false)
                              }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Lihat lokasi pengambilan
                          </button>
                        </div>
                      )}

                      {r.status === "sedang_disewa" && (
                        <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                          <button
                            onClick={async () => {
                              setPickupLoading(true)
                              try {
                                const info = await fetchRentalPickupInfo(r.id)
                                setPickupModal({ ...info, isReturn: true })
                              } catch {
                                addToast?.("Koordinat lokasi belum tersedia", "error")
                              } finally {
                                setPickupLoading(false)
                              }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Alamat pengembalian barang
                          </button>
                          <MiniCountdown
                            rental={r}
                            returnRequested={!!r.return_requested_at}
                            onReturnClick={() => handleRequestReturn(r.id)}
                            returnLoading={returnLoadingId === r.id}
                          />
                        </div>
                      )}

                      {r.status === "selesai" && (
                        <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/items/${r.item_id}`)}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Sewa lagi
                            </button>
                            {reviewsByRental[r.id] ? (
                              <button
                                onClick={() => handleOpenReview(r, reviewsByRental[r.id])}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary hover:text-primary transition"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit ulasan
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenReview(r, null)}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 transition"
                              >
                                <Star className="w-3.5 h-3.5" /> Beri ulasan
                              </button>
                            )}
                          </div>
                          {reviewsByRental[r.id] && (
                            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                              <div className="flex items-center gap-2">
                                <RatingStars value={reviewsByRental[r.id].rating} size="sm" />
                                <span className="text-[10px] font-semibold text-amber-900">Ulasan kamu</span>
                              </div>
                              {reviewsByRental[r.id].komentar && (
                                <p className="text-[11px] text-amber-900/80 mt-1 line-clamp-1">{reviewsByRental[r.id].komentar}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {allTotal > RENTAL_PAGE_SIZE && (
                <div className="flex justify-between items-center mt-6 pt-5 border-t border-border">
                  <button
                    disabled={rentalPage === 0}
                    onClick={() => setRentalPage(p => p - 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {rentalPage + 1} / {Math.ceil(allTotal / RENTAL_PAGE_SIZE)} · {allTotal} total
                  </span>
                  <button
                    disabled={(rentalPage + 1) * RENTAL_PAGE_SIZE >= allTotal}
                    onClick={() => setRentalPage(p => p + 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ PICKUP MODAL ════════════════════════════════════ */}
      <AnimatePresence>
        {pickupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setPickupModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-border rounded-3xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-bold tracking-tight">
                    {pickupModal.isReturn ? "Alamat pengembalian" : "Lokasi pengambilan"}
                  </h3>
                </div>
                <button
                  onClick={() => setPickupModal(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-secondary/60 rounded-2xl p-4 space-y-1">
                  {pickupModal.pickup_nama_usaha && (
                    <p className="font-semibold tracking-tight">{pickupModal.pickup_nama_usaha}</p>
                  )}
                  {pickupModal.pickup_alamat && (
                    <p className="text-sm text-muted-foreground">{pickupModal.pickup_alamat}</p>
                  )}
                  {pickupModal.pickup_telepon && (
                    <p className="text-sm text-muted-foreground">📞 {pickupModal.pickup_telepon}</p>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    📅 {new Date(pickupModal.tanggal_mulai).toLocaleDateString("id-ID")} —{" "}
                    {new Date(pickupModal.tanggal_selesai).toLocaleDateString("id-ID")}
                  </p>
                </div>

                <PickupMap
                  lat={pickupModal.pickup_latitude}
                  lng={pickupModal.pickup_longitude}
                  label={pickupModal.pickup_nama_usaha || "Lokasi pickup"}
                />

                <a
                  href={`https://www.google.com/maps?q=${pickupModal.pickup_latitude},${pickupModal.pickup_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition"
                >
                  <Navigation className="w-4 h-4" />
                  Buka di Google Maps
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ BUKTI BAYAR MODAL ═══════════════════════════════ */}
      <AnimatePresence>
        {buktiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setBuktiModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-border rounded-3xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="font-bold tracking-tight">Upload bukti pembayaran</h3>
                </div>
                <button
                  onClick={() => setBuktiModal(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-secondary/60 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold tracking-tight">
                    {buktiModal.rental.item?.nama || `Item #${buktiModal.rental.item_id}`}
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total sewa</span>
                    <span className="font-bold text-primary">{formatPrice(buktiModal.rental.total_harga)}</span>
                  </div>
                  {buktiModal.payment && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Jumlah tagihan</span>
                      <span className="font-bold">{formatPrice(buktiModal.payment.jumlah)}</span>
                    </div>
                  )}
                </div>

                {/* Admin pay info: dihilangkan, sekarang pakai payment gateway (Midtrans) */}

                {/* Existing bukti */}
                {buktiModal.payment?.bukti_pembayaran && !buktiFile && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Bukti yang sudah dikirim
                    </p>
                    <img
                      src={buktiModal.payment.bukti_pembayaran}
                      alt="bukti"
                      className="w-full rounded-2xl object-cover max-h-48 border border-border"
                    />
                    <p className="text-xs text-amber-700 font-medium">Menunggu konfirmasi admin</p>
                  </div>
                )}

                {/* Upload */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {buktiModal.payment?.bukti_pembayaran ? "Ganti bukti" : "Upload bukti transfer"}
                  </p>
                  <input
                    ref={buktiFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBuktiFileChange}
                  />
                  {buktiFile ? (
                    <div className="relative">
                      <img src={buktiFile.preview} alt="preview" className="w-full rounded-2xl object-cover max-h-48 border border-border" />
                      <button
                        onClick={() => { setBuktiFile(null); if (buktiFileRef.current) buktiFileRef.current.value = "" }}
                        className="absolute top-2 right-2 w-7 h-7 bg-background rounded-full shadow flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => buktiFileRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Upload className="w-7 h-7" />
                      <span className="text-sm font-medium">Klik untuk pilih foto</span>
                      <span className="text-xs">JPG, PNG, WEBP · maks 5MB</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Catatan (opsional)
                  </p>
                  <textarea
                    value={buktiCatatan}
                    onChange={(e) => setBuktiCatatan(e.target.value)}
                    placeholder="Misal: Transfer via BCA 14:30, sudah dikonfirmasi"
                    rows={2}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => setBuktiModal(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-border text-sm font-semibold hover:bg-muted transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleBuktiSubmit}
                  disabled={buktiSubmitting || !buktiFile}
                  className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                  {buktiSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {buktiSubmitting ? "Mengirim..." : "Kirim bukti"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ REVIEW MODAL ════════════════════════════════════ */}
      <ReviewForm
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, rental: null, review: null })}
        initial={reviewModal.review}
        onSubmit={handleSubmitReview}
        itemNama={reviewModal.rental?.item?.nama}
      />

      {/* Tour button */}
      <TourButton onClick={startTour} />
    </>
  )
}
