import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchMyRentals, fetchItems } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/skeleton"
import {
  Search, Bell, ShoppingCart, ClipboardList, ArrowRight,
  Package, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Calendar, ChevronRight, Sparkles, BadgeCheck,
} from "lucide-react"

// ── Mini bar chart ──────────────────────────────────────────
function MiniBarChart({ data = [] }) {
  const max = Math.max(...data, 1)
  const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${Math.max(8, (v / max) * 36)}px`,
              background: i === data.length - 1 ? "#1b7e6a" : "#d1fae5",
            }}
          />
          <span className="text-[9px] text-slate-400 hidden sm:block">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart ─────────────────────────────────────────────
function DonutChart({ pct = 0, color = "#1b7e6a" }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(${color} 0% ${clamped}%, #e5e7eb ${clamped}% 100%)`,
        }}
      />
      {/* inner hole */}
      <div className="absolute inset-[6px] rounded-full bg-white flex items-center justify-center">
        <span className="text-sm font-extrabold text-slate-800">{clamped}%</span>
      </div>
    </div>
  )
}

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

export default function UserDashboard({ addToast }) {
  const { user, isVerified } = useAuth()
  const navigate = useNavigate()

  const [rentals, setRentals] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMyRentals({ limit: 20 }).catch(() => ({ rentals: [] })),
      fetchItems({ limit: 8 }).catch(() => ({ items: [] })),
    ]).then(([r, it]) => {
      setRentals(Array.isArray(r) ? r : (r?.rentals || []))
      setItems(Array.isArray(it) ? it : (it?.items || []))
    }).finally(() => setLoading(false))
  }, [])

  // — derived stats
  const totalSpend = rentals.reduce((s, r) => s + (r.total_harga || 0), 0)
  const active = rentals.filter(r => ["pending","disetujui","sedang_disewa"].includes(r.status))
  const done = rentals.filter(r => r.status === "selesai")
  const pending = rentals.filter(r => r.status === "pending")
  const completionPct = rentals.length ? Math.round((done.length / rentals.length) * 100) : 0
  const activePct = rentals.length ? Math.round((active.length / rentals.length) * 100) : 0
  const recentRentals = rentals.slice(0, 5)
  const activeRental = active.find(r => r.status === "sedang_disewa") || active[0]

  // — fake weekly bar (counts by day-of-week from real data)
  const weekBars = [0, 0, 0, 0, 0, 0, 0]
  rentals.forEach(r => {
    const d = new Date(r.created_at || r.tanggal_mulai).getDay()
    weekBars[d] = (weekBars[d] || 0) + 1
  })
  // rotate so Mon=0
  const rotated = [...weekBars.slice(1), weekBars[0]]

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
    <div className="min-h-full bg-[#f5f5f0] -m-4 md:-m-6 p-4 md:p-6 space-y-4">

      {/* ── HEADER ─────────────────────────────────────────── */}
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

      {/* ── ROW 1: 3 CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card 1 — Total Pengeluaran (like Balance Statistics) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Statistik Sewa</p>
            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" /> {rentals.length} total
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 mt-2">{formatPrice(totalSpend)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total pengeluaran sewa</p>
          </div>
          <div className="mt-3">
            <MiniBarChart data={rotated} />
          </div>
        </div>

        {/* Card 2 — Active Rental (like bank card, teal gradient) */}
        <div className="bg-gradient-to-br from-[#1b7e6a] to-[#0d5c4a] rounded-3xl p-5 shadow-md text-white flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Sewa Aktif</p>
              <Package className="w-4 h-4 text-white/60" />
            </div>
            <p className="text-3xl font-black mt-2">{active.length}</p>
            <p className="text-xs text-white/60 mt-0.5">Barang sedang disewa</p>
          </div>
          {activeRental ? (
            <div className="relative mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-white/70">Terbaru</p>
              <p className="font-bold text-sm truncate mt-0.5">
                {activeRental.item?.nama || `Item #${activeRental.item_id}`}
              </p>
              <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(activeRental.tanggal_selesai).toLocaleDateString("id-ID")}
              </p>
            </div>
          ) : (
            <div className="relative mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-white/60">Belum ada sewa aktif</p>
              <button
                onClick={() => navigate("/catalog")}
                className="mt-1 text-xs font-bold text-white/90 underline"
              >
                Jelajahi katalog →
              </button>
            </div>
          )}
        </div>

        {/* Card 3 — Analytics donut (completion rate) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Analitik</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Selesai
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Aktif
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Lainnya
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center py-2">
            <DonutChart pct={completionPct} color="#1b7e6a" />
          </div>
          <p className="text-center text-xs text-slate-400">
            {done.length} dari {rentals.length} sewa selesai
          </p>
        </div>
      </div>

      {/* ── ROW 2: TRANSACTIONS + STATUS + CTA ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left — Recent Rentals */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Sewa Terbaru</p>
            <button
              onClick={() => navigate("/rentals/my")}
              className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
            >
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentRentals.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Belum ada riwayat sewa</p>
              <button onClick={() => navigate("/catalog")} className="mt-2 text-xs text-primary underline font-semibold">
                Mulai sewa sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRentals.map(r => {
                const item = r.item
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <img
                      src={item?.foto_url || imgFallback(item?.nama || "Item")}
                      alt={item?.nama}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                      onError={(e) => { e.target.src = imgFallback(item?.nama || "Item") }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item?.nama || `Item #${r.item_id}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-slate-700">{formatPrice(r.total_harga)}</p>
                      <Tag status={r.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — Status breakdown + CTA */}
        <div className="flex flex-col gap-4">

          {/* Status breakdown */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-1">
            <p className="text-sm font-bold text-slate-800 mb-4">Status Sewa</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black text-primary">{activePct}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Sedang Berjalan</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${activePct}%` }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-green-500">{completionPct}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Selesai</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </div>

            {/* quick stats row */}
            <div className="flex gap-2 mt-4">
              {[
                { icon: Clock, label: "Pending", val: pending.length, color: "text-amber-500" },
                { icon: CheckCircle, label: "Selesai", val: done.length, color: "text-green-500" },
                { icon: Package, label: "Aktif", val: active.length, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="flex-1 bg-slate-50 rounded-2xl p-2.5 text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <p className="text-base font-black text-slate-800">{s.val}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA card — dark, like Fenco "More features" */}
          <div className="bg-slate-800 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                {isVerified
                  ? <BadgeCheck className="w-5 h-5 text-primary" />
                  : <Sparkles className="w-5 h-5 text-amber-400" />
                }
              </div>
              <div>
                <p className="text-white text-sm font-bold">
                  {isVerified ? "Siap Menyewa!" : "Belum Terverifikasi"}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {isVerified
                    ? "Jelajahi barang yang tersedia"
                    : "Upload KTP untuk mulai menyewa"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl whitespace-nowrap flex-shrink-0"
              onClick={() => navigate(isVerified ? "/catalog" : "/profile")}
            >
              {isVerified ? "Jelajahi" : "Verifikasi"}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
