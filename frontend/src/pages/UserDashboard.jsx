import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchMyRentals, fetchItems, fetchMyPayments, createPaymentForRental, uploadPaymentProof, fetchAdminPaymentInfo, fetchRentalPickupInfo } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/skeleton"
import {
  ShoppingCart, ClipboardList, ArrowRight, ArrowLeft,
  Package, CheckCircle, Clock, TrendingUp,
  Calendar, ChevronRight, Sparkles, BadgeCheck, XCircle,
  Upload, ImageIcon, X, CreditCard, Loader2, Building2, QrCode, Copy, AlertTriangle,
  MapPin, Navigation,
} from "lucide-react"
import PickupMap from "../components/PickupMap"

// ── Status badge inline ──────────────────────────────────────
const STATUS_LABEL = {
  pending: { label: "Menunggu", color: "bg-amber-100 text-amber-700" },
  disetujui: { label: "Disetujui", color: "bg-blue-100 text-blue-700" },
  sedang_disewa: { label: "Berlangsung", color: "bg-teal-100 text-teal-700" },
  selesai: { label: "Selesai", color: "bg-green-100 text-green-700" },
  ditolak: { label: "Ditolak", color: "bg-red-100 text-red-700" },
}

function Tag({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: "bg-gray-100 text-gray-600" }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

const RENTAL_STATUS_TABS = [
  { value: "", label: "Semua", icon: ClipboardList },
  { value: "pending", label: "Menunggu", icon: Clock },
  { value: "disetujui", label: "Disetujui", icon: CheckCircle },
  { value: "sedang_disewa", label: "Berlangsung", icon: TrendingUp },
  { value: "selesai", label: "Selesai", icon: CheckCircle },
  { value: "ditolak", label: "Ditolak", icon: XCircle },
]
const RENTAL_PAGE_SIZE = 6

function MiniCountdownItem({ endDate, onReturnClick }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!endDate) return
    const calc = () => {
      const diff = new Date(endDate).getTime() - new Date().getTime()
      if (diff <= 0) {
        setIsExpired(true)
        return
      }
      setIsExpired(false)
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [endDate])

  return (
    <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-100 bg-slate-50/50 rounded-xl p-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Sisa Waktu Sewa:
        </span>
        {isExpired ? (
          <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 inline-block text-center animate-pulse">
            ⚠️ Waktu Sewa Habis
          </span>
        ) : (
          <div className="flex items-center gap-1 self-end sm:self-auto font-mono text-xs font-bold text-slate-700">
            {timeLeft.d > 0 && <span className="bg-white px-1.5 py-0.5 rounded border shadow-xs">{timeLeft.d}h</span>}
            <span className="bg-white px-1.5 py-0.5 rounded border shadow-xs">{String(timeLeft.h).padStart(2, '0')}j</span>
            <span className="bg-white px-1.5 py-0.5 rounded border shadow-xs">{String(timeLeft.m).padStart(2, '0')}m</span>
            <span className="bg-white px-1.5 py-0.5 rounded border shadow-xs text-primary">{String(timeLeft.s).padStart(2, '0')}s</span>
          </div>
        )}
      </div>
      {isExpired && (
        <button
          onClick={onReturnClick}
          className="w-full mt-2.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 animate-bounce"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Konfirmasi Pengembalian Barang
        </button>
      )}
    </div>
  )
}

export default function UserDashboard({ addToast }) {
  const { user, isVerified } = useAuth()
  const navigate = useNavigate()

  const [rentals, setRentals] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // — Sewa Saya section state
  const [allRentals, setAllRentals]   = useState([])
  const [allTotal, setAllTotal]       = useState(0)
  const [rentalLoading, setRentalLoading] = useState(false)
  const [statusTab, setStatusTab]     = useState("")
  const [rentalPage, setRentalPage]   = useState(0)

  // — Payment / Bukti Bayar state
  const [payments, setPayments]           = useState([])
  const [buktiModal, setBuktiModal]       = useState(null) // { rental, payment | null }
  const [pickupModal, setPickupModal]     = useState(null) // { info } | null
  const [pickupLoading, setPickupLoading] = useState(false)
  const [adminPayInfo, setAdminPayInfo]   = useState(null) // admin rekening/qris info
  const [buktiFile, setBuktiFile]         = useState(null) // { preview, base64 }
  const [buktiCatatan, setBuktiCatatan]   = useState("")
  const [buktiSubmitting, setBuktiSubmitting] = useState(false)
  const [copiedRek, setCopiedRek]         = useState(false)
  const buktiFileRef = useRef()

  useEffect(() => {
    Promise.all([
      fetchMyRentals({ limit: 20 }).catch(() => ({ rentals: [] })),
      fetchItems({ limit: 8 }).catch(() => ({ items: [] })),
      fetchMyPayments({ limit: 50 }).catch(() => ({ payments: [] })),
    ]).then(([r, it, p]) => {
      setRentals(Array.isArray(r) ? r : (r?.rentals || []))
      setItems(Array.isArray(it) ? it : (it?.items || []))
      const pList = Array.isArray(p) ? p : (p?.payments || [])
      setPayments(pList)
    }).finally(() => setLoading(false))
  }, [])

  // — compress image to base64 (max 800px, 75% quality)
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

  const openBuktiModal = async (rental) => {
    const payment = payments.find(p => p.rental_id === rental.id) || null
    setBuktiModal({ rental, payment })
    setBuktiFile(null)
    setBuktiCatatan("")
    setAdminPayInfo(null)
    // load admin payment info
    const adminId = rental.item?.admin_id
    if (adminId) {
      fetchAdminPaymentInfo(adminId).then(setAdminPayInfo).catch(() => {})
    }
  }

  const copyRekening = () => {
    if (!adminPayInfo?.nomor_rekening) return
    navigator.clipboard.writeText(adminPayInfo.nomor_rekening).then(() => {
      setCopiedRek(true); setTimeout(() => setCopiedRek(false), 2000)
    })
  }

  const handleBuktiSubmit = async () => {
    if (!buktiFile) { addToast?.("Pilih foto bukti pembayaran terlebih dahulu", "warning"); return }
    setBuktiSubmitting(true)
    try {
      let payment = buktiModal.payment
      // if no payment record yet, create one first
      if (!payment) {
        payment = await createPaymentForRental(buktiModal.rental.id)
      }
      await uploadPaymentProof(payment.id, { bukti_pembayaran: buktiFile.base64, catatan: buktiCatatan })
      addToast?.("Bukti pembayaran berhasil dikirim!", "success")
      // refresh payments
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
      
      // Reload payments juga untuk sinkronisasi dengan rental (payment auto-created saat disetujui)
      const p = await fetchMyPayments({ limit: 50 }).catch(() => ({ payments: [] }))
      setPayments(Array.isArray(p) ? p : (p?.payments || []))
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setRentalLoading(false)
    }
  }, [statusTab, rentalPage, addToast])

  useEffect(() => { loadAllRentals() }, [loadAllRentals])

  // — derived stats
  const totalSpend = rentals.reduce((s, r) => s + (r.total_harga || 0), 0)
  const active = rentals.filter(r => ["pending","disetujui","sedang_disewa"].includes(r.status))
  const done = rentals.filter(r => r.status === "selesai")
  const pending = rentals.filter(r => r.status === "pending")
  const completionPct = rentals.length ? Math.round((done.length / rentals.length) * 100) : 0
  const activeRentals = rentals.filter(r => r.status === "sedang_disewa" || r.status === "disetujui")

  const firstName = user?.nama?.split(" ")[0] || "Pengguna"
  const imgFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1b7e6a&color=fff&size=100&bold=true`

  // greeting
  const h = new Date().getHours()
  const greet = h < 11 ? "Selamat Pagi" : h < 15 ? "Selamat Siang" : h < 18 ? "Selamat Sore" : "Selamat Malam"

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-4">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="pt-5  " />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Platform Sewa Barang</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mt-0.5 leading-tight">
            {greet},{" "}
            <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola aktivitas penyewaan barangmu di sini!</p>
        </div>

        {/* recent item avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {items.slice(0, 5).map((item) => (
              <img
                key={item.id}
                src={item.foto_url || imgFallback(item.nama)}
                alt={item.nama}
                title={item.nama}
                className="w-9 h-9 rounded-full border-2 border-white object-cover bg-muted cursor-pointer hover:scale-110 transition-transform"
                onError={(e) => { e.target.src = imgFallback(item.nama) }}
                onClick={() => navigate(`/rentals/new?item=${item.id}`)}
              />
            ))}
            {items.length > 5 && (
              <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                +{items.length - 5}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/catalog")}
            className="ml-1 w-8 h-8 rounded-full bg-white shadow-sm border flex items-center justify-center hover:bg-slate-50 transition"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* verif warning */}
      {!isVerified && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 flex-1">
            Lengkapi verifikasi KTP untuk bisa menyewa barang.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="text-xs font-bold text-amber-700 underline whitespace-nowrap"
          >
            Verifikasi →
          </button>
        </div>
      )}

      {/* ── ROW 1: RINGKASAN METRIK ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Total Pengeluaran */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{formatPrice(totalSpend)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Dari <strong>{rentals.length}</strong> transaksi sewa
            </p>
          </div>
          {/* subtle accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Metrik 2: Sewa Berlangsung/Aktif */}
        <div className="bg-gradient-to-br from-[#1b7e6a] to-[#0d5c4a] text-white rounded-3xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
          {/* subtle background glow/shapes */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-bold text-teal-100 uppercase tracking-wider">Sewa Aktif</p>
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-3xl font-black tracking-tight">{active.length}</p>
            <p className="text-xs text-teal-100/80 mt-0.5 truncate">
              {activeRentals.length > 0 ? `Terbaru: ${activeRentals[0].item?.nama || "Barang"}` : "Belum ada barang disewa"}
            </p>
          </div>
        </div>

        {/* Metrik 3: Menunggu Pembayaran/Konfirmasi */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{pending.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              {pending.length > 0 ? "Perlu bayar/konfirmasi" : "Semua transaksi lancar"}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Metrik 4: Transaksi Selesai */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</p>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{done.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              Tingkat penyelesaian: <strong>{completionPct}%</strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* abstract glowing background blobs */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            {isVerified
              ? <BadgeCheck className="w-7 h-7 text-primary" />
              : <Sparkles className="w-7 h-7 text-amber-400" />
            }
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-wide uppercase text-slate-300 mb-1">
              {isVerified ? "Status Akun Terverifikasi" : "Akses Terbatas"}
            </div>
            <h3 className="text-lg md:text-xl font-black text-white leading-tight">
              {isVerified ? "Jelajahi & Sewa Barang Impianmu" : "Akun Belum Terverifikasi Lengkap"}
            </h3>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5 max-w-xl">
              {isVerified
                ? "Temukan berbagai macam pilihan barang berkualitas dengan harga terbaik dari mitra penyedia kami."
                : "Upload KTP/Identitas resmi pada profil Anda agar bisa mengajukan penyewaan barang di platform."}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto rounded-2xl font-bold tracking-wide whitespace-nowrap shadow-lg hover:scale-105 transition-transform flex-shrink-0 relative z-10"
          onClick={() => navigate(isVerified ? "/catalog" : "/profile")}
        >
          {isVerified ? "Mulai Jelajahi Katalog" : "Lengkapi Profil Sekarang"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* ── SEWA SAYA ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-800">Sewa Saya</h2>
            <p className="text-xs text-slate-400 mt-0.5">Semua transaksi penyewaan kamu</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            onClick={() => navigate("/rentals/new")}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Sewa Baru
          </Button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {RENTAL_STATUS_TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setStatusTab(value); setRentalPage(0) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                statusTab === value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        {/* Rental list */}
        {rentalLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded-full w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : allRentals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Belum ada transaksi</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusTab
                ? `Tidak ada sewa dengan status "${RENTAL_STATUS_TABS.find(t => t.value === statusTab)?.label}"`
                : "Mulai sewa barang dari katalog!"}
            </p>
            {isVerified && (
              <Button size="sm" className="mt-3 rounded-xl text-xs" onClick={() => navigate("/catalog")}>
                Lihat Katalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {allRentals.map(r => {
                const item = r.item
                const st = STATUS_LABEL[r.status] || { label: r.status, color: "bg-slate-100 text-slate-600" }
                const payment = payments.find(p => p.rental_id === r.id)
                const needsPayment = r.status === "disetujui" && payment
                const hasBukti = !!payment?.bukti_pembayaran
                const isPaid = payment?.status === "completed"
                const canSeePickup = isPaid && ["disetujui", "sedang_disewa", "selesai"].includes(r.status)
                return (
                  <div key={r.id} className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={item?.foto_url || imgFallback(item?.nama || "Item")}
                        alt={item?.nama}
                        className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 bg-slate-100"
                        onError={(e) => { e.target.src = imgFallback(item?.nama || "Item") }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {item?.nama || `Item #${r.item_id}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")} —{" "}
                            {new Date(r.tanggal_selesai).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-sm font-black text-slate-700">{formatPrice(r.total_harga)}</span>
                      </div>
                    </div>

                    {/* Payment action row */}
                    {needsPayment && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                          {isPaid ? (
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Pembayaran Terkonfirmasi
                            </span>
                          ) : hasBukti ? (
                            <span className="text-xs text-amber-600 font-medium">Bukti dikirim · menunggu konfirmasi</span>
                          ) : (
                            <span className="text-xs text-primary font-semibold">Upload bukti transfer</span>
                          )}
                        </div>
                        {!hasBukti && !isPaid && (
                          <button
                            onClick={() => navigate(`/payment/${r.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 bg-primary text-white hover:bg-primary/90"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Bayar Sekarang
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tombol Lihat Lokasi Pickup — muncul jika sudah bayar */}
                    {canSeePickup && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            setPickupLoading(true)
                            try {
                              const info = await fetchRentalPickupInfo(r.id)
                              setPickupModal({ ...info, isReturn: r.status === "sedang_disewa" })
                            } catch {
                              alert("Koordinat lokasi belum tersedia. Hubungi admin.")
                            } finally {
                              setPickupLoading(false)
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {r.status === "sedang_disewa" ? "Alamat Pengembalian Barang" : "Lihat Lokasi Pengambilan"}
                        </button>
                        {r.status === "sedang_disewa" && (
                          <MiniCountdownItem
                            endDate={r.tanggal_selesai}
                            onReturnClick={() => {
                              addToast?.("Notifikasi pengembalian barang berhasil dikirim ke admin!", "success")
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {allTotal > RENTAL_PAGE_SIZE && (
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                <button
                  disabled={rentalPage === 0}
                  onClick={() => setRentalPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
                </button>
                <span className="text-xs text-slate-400">
                  {rentalPage + 1} / {Math.ceil(allTotal / RENTAL_PAGE_SIZE)} halaman · {allTotal} total
                </span>
                <button
                  disabled={(rentalPage + 1) * RENTAL_PAGE_SIZE >= allTotal}
                  onClick={() => setRentalPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>

    {/* ── PICKUP LOCATION MODAL ── */}
    {pickupModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-slate-800">
                {pickupModal.isReturn ? "Alamat Pengembalian Barang" : "Lokasi Pengambilan"}
              </h3>
            </div>
            <button onClick={() => setPickupModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Info usaha */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
              {pickupModal.pickup_nama_usaha && (
                <p className="font-bold text-slate-800">{pickupModal.pickup_nama_usaha}</p>
              )}
              {pickupModal.pickup_alamat && (
                <p className="text-sm text-slate-600">{pickupModal.pickup_alamat}</p>
              )}
              {pickupModal.pickup_telepon && (
                <p className="text-sm text-slate-500">📞 {pickupModal.pickup_telepon}</p>
              )}
              <p className="text-xs text-slate-400 pt-1">
                📅 {new Date(pickupModal.tanggal_mulai).toLocaleDateString("id-ID")} —{" "}
                {new Date(pickupModal.tanggal_selesai).toLocaleDateString("id-ID")}
              </p>
            </div>

            {/* Peta */}
            <PickupMap
              lat={pickupModal.pickup_latitude}
              lng={pickupModal.pickup_longitude}
              label={pickupModal.pickup_nama_usaha || "Lokasi Pickup"}
            />

            {/* Buka Google Maps */}
            <a
              href={`https://www.google.com/maps?q=${pickupModal.pickup_latitude},${pickupModal.pickup_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm
                         flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              <Navigation className="w-4 h-4" />
              Buka di Google Maps
            </a>
          </div>
        </div>
      </div>
    )}

    {/* ── BUKTI BAYAR MODAL (outside main div, inside Fragment) ──────────────────────────────────── */}
    {buktiModal && (

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-black text-slate-800">Upload Bukti Pembayaran</h3>
            </div>
            <button onClick={() => setBuktiModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Info pembayaran */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold text-slate-700">{buktiModal.rental.item?.nama || `Item #${buktiModal.rental.item_id}`}</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Sewa</span>
                <span className="font-bold text-primary">{formatPrice(buktiModal.rental.total_harga)}</span>
              </div>
              {buktiModal.payment && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Jumlah Tagihan</span>
                  <span className="font-bold text-slate-700">{formatPrice(buktiModal.payment.jumlah)}</span>
                </div>
              )}
            </div>

            {/* Admin rekening/QRIS info */}
            {adminPayInfo && (adminPayInfo.nomor_rekening || adminPayInfo.foto_qris) && (
              <div className="bg-slate-800 rounded-2xl p-4 space-y-3 text-white">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Transfer ke
                </p>
                {adminPayInfo.nomor_rekening && (
                  <div className="bg-white/10 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                      <Building2 className="w-3 h-3" /> Nomor Rekening
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{adminPayInfo.nomor_rekening}</span>
                      <button
                        onClick={copyRekening}
                        className="flex items-center gap-1 text-[10px] bg-primary/30 text-primary px-2 py-1 rounded-lg hover:bg-primary/40 transition flex-shrink-0"
                      >
                        {copiedRek ? <><CheckCircle className="w-3 h-3" />Tersalin</> : <><Copy className="w-3 h-3" />Salin</>}
                      </button>
                    </div>
                  </div>
                )}
                {adminPayInfo.foto_qris && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <QrCode className="w-3 h-3" /> QRIS
                    </div>
                    <div className="bg-white rounded-xl p-2 flex justify-center">
                      <img src={adminPayInfo.foto_qris} alt="QRIS" className="w-32 h-32 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Existing bukti preview */}
            {buktiModal.payment?.bukti_pembayaran && !buktiFile && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bukti yang sudah dikirim</p>
                <img
                  src={buktiModal.payment.bukti_pembayaran}
                  alt="bukti"
                  className="w-full rounded-2xl object-cover max-h-48 border border-slate-200"
                />
                <p className="text-xs text-amber-600 font-medium">Menunggu konfirmasi admin</p>
              </div>
            )}

            {/* File upload */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {buktiModal.payment?.bukti_pembayaran ? "Ganti Bukti" : "Upload Bukti Transfer"}
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
                  <img src={buktiFile.preview} alt="preview" className="w-full rounded-2xl object-cover max-h-48 border border-slate-200" />
                  <button
                    onClick={() => { setBuktiFile(null); if (buktiFileRef.current) buktiFileRef.current.value = "" }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => buktiFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Klik untuk pilih foto</span>
                  <span className="text-xs">JPG, PNG, WEBP · Maks. 5MB</span>
                </button>
              )}
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catatan (Opsional)</p>
              <textarea
                value={buktiCatatan}
                onChange={(e) => setBuktiCatatan(e.target.value)}
                placeholder="Misal: Transfer via BCA 14:30, sudah dikonfirmasi"
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-slate-50"
              />
            </div>
          </div>

          <div className="px-5 pb-5 flex gap-2">
            <button
              onClick={() => setBuktiModal(null)}
              className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleBuktiSubmit}
              disabled={buktiSubmitting || !buktiFile}
              className="flex-1 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {buktiSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {buktiSubmitting ? "Mengirim..." : "Kirim Bukti"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
