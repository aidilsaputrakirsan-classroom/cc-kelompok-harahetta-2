import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItem, fetchAdminPaymentInfo } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import {
  ArrowLeft, Package, ShoppingCart, Tag, CheckCircle,
  XCircle, AlertTriangle, Store, Phone, CreditCard,
  Calendar, ChevronRight, LayoutDashboard, LogOut,
  Menu, X, Sparkles, QrCode, Building2, Copy, Star,
} from "lucide-react"

// ── Navbar (sama dengan CatalogPage) ─────────────────────────
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

        <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800 transition-colors">Beranda</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/catalog" className="hover:text-slate-800 transition-colors">Katalog Barang</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800">Detail Barang</span>
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

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  available:   { label: "Tersedia",       cls: "bg-emerald-100 text-emerald-700",  dot: "bg-emerald-500" },
  rented:      { label: "Sedang Disewa",  cls: "bg-amber-100  text-amber-700",     dot: "bg-amber-500"   },
  unavailable: { label: "Tidak Tersedia", cls: "bg-slate-100  text-slate-500",     dot: "bg-slate-400"   },
}

// ── Skeleton loading ──────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="pt-16 min-h-screen bg-[#f8f8f6]">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="h-4 w-40 bg-slate-200 rounded-full animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-slate-200 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-full w-2/3 animate-pulse" />
            <div className="h-5 bg-slate-200 rounded-full w-1/3 animate-pulse" />
            <div className="h-24 bg-slate-200 rounded-3xl animate-pulse" />
            <div className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ItemDetailPage({ addToast }) {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isVerified } = useAuth()

  const [item, setItem]           = useState(null)
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)

  // Kalkulator estimasi biaya
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate]     = useState("")
  const today = new Date().toISOString().split("T")[0]
  const days = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
    : 0
  const estimated = item ? item.harga_per_hari * days : 0

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchItem(itemId)
        setItem(data)
        if (data.admin_id) {
          fetchAdminPaymentInfo(data.admin_id).then(setAdminInfo).catch(() => {})
        }
      } catch (err) {
        if (err.message === "UNAUTHORIZED") {
          navigate("/login")
          return
        }
        addToast?.(err.message || "Barang tidak ditemukan", "error")
        navigate("/catalog")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId, navigate, addToast])

  const handleRent = () => {
    if (!isAuthenticated) {
      addToast?.("Silakan login terlebih dahulu", "info")
      navigate("/login")
      return
    }
    navigate(`/rentals/new?item=${itemId}`)
  }

  const copyRekening = () => {
    if (!adminInfo?.nomor_rekening) return
    navigator.clipboard.writeText(adminInfo.nomor_rekening).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const imgFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Item")}&background=1b7e6a&color=fff&size=800&bold=true`

  if (loading) return <><Navbar /><SkeletonDetail /></>

  if (!item) return (
    <div className="pt-16 min-h-screen bg-[#f8f8f6] flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <XCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Barang tidak ditemukan</h3>
        <Button className="mt-4" onClick={() => navigate("/catalog")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Katalog
        </Button>
      </div>
    </div>
  )

  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.unavailable
  const isAvailable = item.status === "available" && item.stok > 0

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Navbar />

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div className="pt-16">

        {/* Thin teal strip for breadcrumb */}
        <div className="bg-gradient-to-r from-[#0d5c4a] to-[#1b7e6a] py-3">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1.5 text-sm text-white/80">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link to="/catalog" className="hover:text-white transition-colors">Katalog</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-white font-semibold truncate max-w-[200px]">{item.nama}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

            {/* ── LEFT: IMAGE + PROVIDER ── */}
            <div className="space-y-5">

              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 shadow-sm">
                <img
                  src={item.foto_url || imgFallback(item.nama)}
                  alt={item.nama}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = imgFallback(item.nama) }}
                />
                {/* Status badge */}
                <span className={`absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${st.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                {/* Category badge */}
                {item.category && (
                  <span className="absolute top-4 left-4 flex items-center gap-1 text-xs font-semibold bg-white/90 text-primary px-3 py-1.5 rounded-full shadow-sm">
                    <Tag className="w-3 h-3" /> {item.category.nama}
                  </span>
                )}
              </div>

              {/* Provider info card */}
              {adminInfo && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{adminInfo.nama_usaha}</p>
                      <p className="text-xs text-slate-400">Penyedia Barang Sewa</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-semibold">
                      <CheckCircle className="w-3 h-3" /> Terverifikasi
                    </span>
                  </div>

                  <div className="space-y-2">
                    {adminInfo.nomor_telepon && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {adminInfo.nomor_telepon}
                      </div>
                    )}
                    {adminInfo.nomor_rekening && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 flex-1 truncate">{adminInfo.nomor_rekening}</span>
                        <button
                          onClick={copyRekening}
                          className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition flex-shrink-0"
                        >
                          {copied
                            ? <><CheckCircle className="w-3 h-3" /> Tersalin</>
                            : <><Copy className="w-3 h-3" /> Salin</>
                          }
                        </button>
                      </div>
                    )}
                    {adminInfo.foto_qris && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                          <QrCode className="w-3.5 h-3.5" /> QRIS
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 flex justify-center">
                          <img src={adminInfo.foto_qris} alt="QRIS" className="w-36 h-36 object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Promo/trust card */}
              <div className="bg-gradient-to-br from-[#0d5c4a] to-[#1b7e6a] rounded-3xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-white/70" />
                  <p className="text-sm font-bold">Keunggulan Sewain</p>
                </div>
                <div className="space-y-2">
                  {[
                    "Penyedia terverifikasi & terpercaya",
                    "Transaksi aman & terjamin",
                    "Proses sewa cepat & mudah",
                    "Dukungan tim 7 hari seminggu",
                  ].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-white/80">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: DETAILS + CTA ── */}
            <div className="space-y-4 lg:sticky lg:top-24">

              {/* Main detail card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">

                {/* Title & category */}
                <div>
                  {item.category && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2">
                      <Tag className="w-3 h-3" /> {item.category.nama}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{item.nama}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </div>
                    <span className="text-xs text-slate-400">Stok: <span className="font-bold text-slate-700">{item.stok} unit</span></span>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/10">
                  <p className="text-xs text-slate-500 mb-1">Harga Sewa</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-primary">{formatPrice(item.harga_per_hari)}</span>
                    <span className="text-sm text-slate-400 font-medium">/ hari</span>
                  </div>
                </div>

                {/* Deskripsi */}
                {item.deskripsi && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Deskripsi</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.deskripsi}</p>
                  </div>
                )}

                {/* Separator */}
                <div className="border-t border-slate-100" />

                {/* Kalkulator estimasi */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Estimasi Biaya
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        min={today}
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate("") }}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        min={startDate || today}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      />
                    </div>
                  </div>
                  {days > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Durasi</span>
                        <span className="font-semibold text-slate-700">{days} hari</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Harga/hari</span>
                        <span className="font-semibold text-slate-700">{formatPrice(item.harga_per_hari)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold">
                        <span className="text-slate-700">Total Estimasi</span>
                        <span className="text-primary text-sm">{formatPrice(estimated)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verif warning */}
                {isAuthenticated && !isVerified && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-700">
                      <p className="font-semibold mb-0.5">Verifikasi diperlukan</p>
                      <p>Upload KTP untuk bisa menyewa barang.</p>
                      <Link to="/profile" className="underline font-bold mt-1 inline-block">Verifikasi Sekarang →</Link>
                    </div>
                  </div>
                )}

                {/* CTA button */}
                {isAvailable ? (
                  <Button
                    className="w-full rounded-2xl py-3 text-base font-bold"
                    size="lg"
                    onClick={handleRent}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Sewa Sekarang
                  </Button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    {item.status === "rented" ? "Sedang Disewa" : "Tidak Tersedia"}
                  </button>
                )}

                {!isAuthenticated && (
                  <p className="text-center text-xs text-slate-500">
                    Belum punya akun?{" "}
                    <Link to="/login" className="text-primary underline font-semibold">Login atau Daftar</Link>
                  </p>
                )}
              </div>

              {/* Info tambahan */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Info Tambahan
                </p>
                <div className="space-y-2">
                  {[
                    { icon: Package,      label: "Stok",      val: `${item.stok} unit` },
                    { icon: CreditCard,   label: "Harga",     val: `${formatPrice(item.harga_per_hari)} / hari` },
                    { icon: Tag,          label: "Kategori",  val: item.category?.nama || "Umum" },
                    { icon: CheckCircle,  label: "Status",    val: st.label },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {label}
                      </div>
                      <span className="font-semibold text-slate-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© 2026 Sewain Platform · Kelompok Harahetta-2</span>
          <Link to="/catalog" className="text-primary hover:underline font-medium">Kembali ke Katalog</Link>
        </div>
      </footer>
    </div>
  )
}
