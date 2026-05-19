/**
 * ItemDetailPage — Sewain
 * Clean layout: hero image + single column detail below.
 * No QRIS/rekening (pakai payment gateway Midtrans).
 */
import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItem, fetchAdminPaymentInfo } from "../services/api"
import { openChatRoomForItem } from "../services/chat"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/Skeleton"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, ShoppingCart, Tag, CheckCircle,
  XCircle, AlertTriangle, Store, Phone,
  Calendar, MapPin, Shield, Timer, Clock, Star, MessageCircle, Loader2,
} from "lucide-react"

/* ─── status ──────────────────────────────────────────────── */
const STATUS_META = {
  available:   { label: "Tersedia",       cls: "bg-primary/10 text-primary",     dot: "bg-primary" },
  rented:      { label: "Sedang disewa",  cls: "bg-amber-100 text-amber-800",    dot: "bg-amber-500" },
  unavailable: { label: "Tidak tersedia", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

function calcDays(s, e) { return Math.max(0, Math.ceil((new Date(e) - new Date(s)) / 86400000)) }

export default function ItemDetailPage({ addToast }) {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isVerified, isAdmin, isSuperAdmin } = useAuth()

  const [item, setItem]           = useState(null)
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate]     = useState("")
  const [openingChat, setOpeningChat] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const days = startDate && endDate ? calcDays(startDate, endDate) : 0
  const estimated = item ? item.harga_per_hari * days : 0

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchItem(itemId)
        setItem(data)
        if (data.admin_id) fetchAdminPaymentInfo(data.admin_id).then(setAdminInfo).catch(() => {})
      } catch (err) {
        if (err.message === "UNAUTHORIZED") { navigate("/login"); return }
        addToast?.(err.message || "Barang tidak ditemukan", "error")
        navigate("/catalog")
      } finally { setLoading(false) }
    })()
  }, [itemId, navigate, addToast])

  const handleRent = () => {
    if (!isAuthenticated) { addToast?.("Silakan login terlebih dahulu", "info"); navigate("/login"); return }
    navigate(`/rentals/new?item=${itemId}`)
  }

  const handleAskAdmin = async () => {
    if (!isAuthenticated) {
      addToast?.("Login dulu untuk bisa chat dengan penyedia", "info")
      navigate("/login")
      return
    }
    if (isAdmin || isSuperAdmin) {
      addToast?.("Hanya akun penyewa yang bisa memulai chat dari halaman item", "warning")
      return
    }
    setOpeningChat(true)
    try {
      const room = await openChatRoomForItem(Number(itemId))
      navigate(`/chat/${room.id}`)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") { navigate("/login"); return }
      addToast?.(err.message || "Gagal membuka chat", "error")
    } finally {
      setOpeningChat(false)
    }
  }

  const fallback = (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || "I")}&background=0a6e4a&color=fff&size=800&bold=true`

  if (loading) return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="w-full aspect-[16/9] rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </div>
  )

  if (!item) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-9 h-9 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Barang tidak ditemukan</h3>
        <Button className="mt-5 rounded-full" onClick={() => navigate("/catalog")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke katalog
        </Button>
      </div>
    </div>
  )

  const st = STATUS_META[item.status] || STATUS_META.unavailable
  const isAvailable = item.status === "available" && item.stok > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* ═══ HERO IMAGE ═══ */}
      <div className="relative w-full rounded-3xl overflow-hidden aspect-[16/9] bg-secondary border border-border">
        <img
          src={item.foto_url || fallback(item.nama)}
          alt={item.nama}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = fallback(item.nama) }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Badges */}
        <span className={`absolute top-4 right-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
        </span>
        {item.category && (
          <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-xs font-semibold bg-background/90 backdrop-blur text-primary px-3 py-1.5 rounded-full border border-border">
            <Tag className="w-3 h-3" /> {item.category.nama}
          </span>
        )}
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">{item.nama}</h1>
        </div>
      </div>

      {/* ═══ MAIN CONTENT — single card full width ═══ */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">

        {/* Top row: price + status + stok */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{formatPrice(item.harga_per_hari)}</span>
              <span className="text-base text-muted-foreground">/ hari</span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
              </span>
              <span className="text-xs text-muted-foreground">Stok: <strong className="text-foreground">{item.stok} unit</strong></span>
              {item.category && (
                <span className="text-xs text-muted-foreground">Kategori: <strong className="text-foreground">{item.category.nama}</strong></span>
              )}
            </div>
          </div>

          {/* Provider mini */}
          {adminInfo && (
            <div className="bg-secondary/60 rounded-2xl px-4 py-3 sm:max-w-xs w-full">
              <div className="flex items-center gap-3">
                {adminInfo.foto_profil ? (
                  <img
                    src={adminInfo.foto_profil}
                    alt={adminInfo.nama_usaha}
                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-primary/20"
                    onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex" }}
                  />
                ) : null}
                <div
                  className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center text-primary flex-shrink-0"
                  style={{ display: adminInfo.foto_profil ? "none" : "flex" }}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight truncate">{adminInfo.nama_usaha}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {adminInfo.nomor_telepon && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 flex-shrink-0" /> {adminInfo.nomor_telepon}
                      </span>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              </div>

              {/* Tanya admin — di bawah info toko */}
              {!isAdmin && !isSuperAdmin && (
                <button
                  onClick={handleAskAdmin}
                  disabled={openingChat}
                  className="mt-3 w-full h-9 rounded-xl border border-primary/30 text-primary bg-background hover:bg-primary/10 transition font-semibold text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {openingChat
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageCircle className="w-3.5 h-3.5" />
                  }
                  Tanya admin
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deskripsi */}
        {item.deskripsi && (
          <div>
            <h2 className="text-sm font-bold mb-2">Deskripsi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.deskripsi}</p>
          </div>
        )}

        {/* Lokasi penyedia */}
        {adminInfo?.alamat_usaha && (
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-secondary/40 rounded-2xl p-4">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-xs mb-0.5">Lokasi pengambilan</p>
              <p>{adminInfo.alamat_usaha}</p>
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* Estimasi biaya + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estimasi */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 inline-flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" /> Estimasi biaya
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tanggal mulai</label>
                <input type="date" min={today} value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate("") }}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tanggal selesai</label>
                <input type="date" min={startDate || today} value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </div>
            {days > 0 && (
              <div className="mt-3 rounded-2xl bg-secondary/60 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Durasi</span><span className="font-semibold text-foreground">{days} hari</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Harga/hari</span><span className="font-semibold text-foreground">{formatPrice(item.harga_per_hari)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{formatPrice(estimated)}</span></div>
              </div>
            )}
          </div>

          {/* CTA side */}
          <div className="flex flex-col justify-between">
            {/* Trust points */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { icon: Shield,      text: "Transaksi aman" },
                { icon: CheckCircle, text: "Penyedia verified" },
                { icon: Clock,       text: "Proses cepat" },
                { icon: Star,        text: "Dukungan 7 hari" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {text}
                </div>
              ))}
            </div>

            {/* Verif warning */}
            {isAuthenticated && !isVerified && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">Verifikasi diperlukan</p>
                  <p className="mt-0.5">Upload KTP untuk bisa menyewa.</p>
                  <Link to="/profile" className="underline font-bold mt-1 inline-block">Verifikasi →</Link>
                </div>
              </div>
            )}

            {/* CTA */}
            {isAvailable ? (
              <Button className="w-full rounded-2xl h-12 text-base font-bold" size="lg" onClick={handleRent}>
                <ShoppingCart className="w-5 h-5 mr-2" /> Sewa sekarang
              </Button>
            ) : (
              <button disabled className="w-full h-12 rounded-2xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />
                {item.status === "rented" ? "Sedang disewa" : "Tidak tersedia"}
              </button>
            )}

            {!isAuthenticated && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Belum punya akun? <Link to="/login" className="text-primary font-semibold hover:underline">Login / Daftar</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
