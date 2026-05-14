import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchMyRentals, fetchMyPayments,
  fetchAdminPaymentInfo, fetchRentalPickupInfo,
  chargeMidtransForRental, syncMidtransPayment,
} from "../services/api"
import { openSnap } from "../lib/midtrans"
import { formatPrice } from "../lib/utils"
import { Skeleton } from "../components/ui/skeleton"
import PickupMap from "../components/PickupMap"
import {
  ArrowLeft, CreditCard, CheckCircle, Loader2, Clock,
  AlertTriangle, BadgeCheck, MapPin, Navigation,
  Calendar, RefreshCw, Shield, XCircle,
} from "lucide-react"


const PAY_STATUS = {
  pending:   { label: "Menunggu Pembayaran",  cls: "bg-amber-100 text-amber-700",  icon: Clock },
  completed: { label: "Lunas",                cls: "bg-green-100 text-green-700",  icon: CheckCircle },
  failed:    { label: "Gagal",                cls: "bg-red-100 text-red-700",      icon: XCircle },
  cancelled: { label: "Kedaluwarsa",          cls: "bg-slate-100 text-slate-500",  icon: XCircle },
}

const RENTAL_STATUS = {
  pending:       { label: "Menunggu Persetujuan Admin", cls: "bg-amber-100 text-amber-700" },
  disetujui:     { label: "Disetujui Admin",            cls: "bg-blue-100 text-blue-700" },
  sedang_disewa: { label: "Sedang Disewa",              cls: "bg-teal-100 text-teal-700" },
  selesai:       { label: "Selesai",                    cls: "bg-green-100 text-green-700" },
  ditolak:       { label: "Ditolak",                    cls: "bg-red-100 text-red-700" },
}


export default function PaymentPage({ addToast }) {
  const { rentalId } = useParams()
  const navigate     = useNavigate()

  const [rental, setRental]         = useState(null)
  const [payment, setPayment]       = useState(null)
  const [adminInfo, setAdminInfo]   = useState(null)
  const [pickupInfo, setPickupInfo] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [paying, setPaying]         = useState(false)
  const [syncing, setSyncing]       = useState(false)

  const loadAll = async () => {
    const id = parseInt(rentalId, 10)
    if (Number.isNaN(id)) { navigate("/home"); return }

    // Ambil rental milik user
    const rentalsData = await fetchMyRentals({ limit: 100 }).catch(() => ({ rentals: [] }))
    const rentals = Array.isArray(rentalsData) ? rentalsData : (rentalsData?.rentals || [])
    const r = rentals.find(x => x.id === id)
    if (!r) {
      addToast?.("Data sewa tidak ditemukan", "error")
      navigate("/home"); return
    }
    setRental(r)

    // Ambil payment terkait
    const paymentsData = await fetchMyPayments({ limit: 100 }).catch(() => ({ payments: [] }))
    const pays = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])
    const pay = pays.find(x => x.rental_id === id) || null
    setPayment(pay)

    // Pickup info (kalau sudah bayar)
    if (pay?.status === "completed" || ["sedang_disewa", "selesai"].includes(r.status)) {
      fetchRentalPickupInfo(id).then(setPickupInfo).catch(() => {})
    }

    // Kontak penyedia
    if (r.item?.admin_id) {
      fetchAdminPaymentInfo(r.item.admin_id).then(setAdminInfo).catch(() => {})
    }
  }

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId])

  // ── Trigger Midtrans Snap popup
  const handlePayNow = async () => {
    setPaying(true)
    try {
      const charge = await chargeMidtransForRental(rentalId)
      await openSnap(charge.snap_token, {
        onSuccess: async () => {
          addToast?.("Pembayaran berhasil! Status sedang disinkronkan...", "success")
          // Sync dari Midtrans langsung (lebih cepat dari menunggu webhook saat testing)
          await syncMidtransPayment(charge.payment_id).catch(() => {})
          await loadAll()
        },
        onPending: async () => {
          addToast?.("Menunggu konfirmasi pembayaran", "info")
          await loadAll()
        },
        onError: () => {
          addToast?.("Pembayaran gagal diproses", "error")
        },
        onClose: async () => {
          // User menutup popup tanpa menyelesaikan
          addToast?.("Popup ditutup. Anda bisa melanjutkan pembayaran kapan saja.", "info")
          await loadAll()
        },
      })
    } catch (err) {
      addToast?.(err.message || "Gagal membuka payment gateway", "error")
    } finally {
      setPaying(false)
    }
  }

  // ── Manual sync kalau webhook telat
  const handleSync = async () => {
    if (!payment?.id) return
    setSyncing(true)
    try {
      await syncMidtransPayment(payment.id)
      await loadAll()
      addToast?.("Status pembayaran berhasil diperbarui", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal sync status", "error")
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 pt-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
  if (!rental) return null

  const item = rental.item
  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=1b7e6a&color=fff&size=200&bold=true`
  const isApproved = rental.status === "disetujui"
  const isPaid     = payment?.status === "completed"
  const isRunning  = rental.status === "sedang_disewa"
  const canPay     = isApproved && !isPaid
  const payMeta    = payment ? (PAY_STATUS[payment.status] || PAY_STATUS.pending) : null
  const rs         = RENTAL_STATUS[rental.status] || RENTAL_STATUS.pending
  const PayIcon    = payMeta?.icon || Clock

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-black text-slate-800">Pembayaran Sewa</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rs.cls}`}>{rs.label}</span>
          {payMeta && (
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${payMeta.cls}`}>
              <PayIcon className="w-3.5 h-3.5" /> {payMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Banner: masih pending approval */}
      {rental.status === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Menunggu Persetujuan Admin</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Admin sedang meninjau permintaan sewamu. Tombol bayar akan muncul setelah disetujui.
            </p>
          </div>
        </div>
      )}

      {/* Banner: ditolak */}
      {rental.status === "ditolak" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Permintaan Sewa Ditolak</p>
            {rental.catatan && <p className="text-xs text-red-700 mt-0.5">Catatan admin: {rental.catatan}</p>}
          </div>
        </div>
      )}

      {/* Ringkasan rental */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex gap-4 p-4">
          <img
            src={item?.foto_url || imgFallback}
            alt={item?.nama}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 bg-slate-100"
            onError={(e) => { e.target.src = imgFallback }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-800 text-base">{item?.nama || `Item #${rental.item_id}`}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {new Date(rental.tanggal_mulai).toLocaleDateString("id-ID")} —{" "}
              {new Date(rental.tanggal_selesai).toLocaleDateString("id-ID")}
            </div>
            {rental.catatan && <p className="text-xs text-slate-400 mt-0.5 truncate">{rental.catatan}</p>}
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 flex justify-between items-center bg-slate-50/50">
          <span className="text-sm text-slate-500 font-medium">Total Pembayaran</span>
          <span className="text-xl font-black text-primary">{formatPrice(rental.total_harga)}</span>
        </div>
      </div>

      {/* Kartu Bayar Sekarang */}
      {canPay && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-slate-800">Bayar via Midtrans</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih metode pembayaran favoritmu: QRIS, Virtual Account (BCA/Mandiri/BNI/BRI),
                GoPay, ShopeePay, atau kartu kredit.
              </p>
            </div>
          </div>

          {/* Metode tersedia — daftar informatif, pemilihan sebenarnya ada di popup Snap */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Metode tersedia
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500 select-none">
              {["QRIS", "GoPay", "ShopeePay", "BCA VA", "Mandiri VA", "BNI VA", "BRI VA", "Kartu Kredit"].map(m => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 font-medium cursor-default"
                >
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic pt-1">
              Pilih metode di popup yang muncul setelah klik <span className="font-semibold">Bayar Sekarang</span>.
            </p>
          </div>

          <button
            onClick={handlePayNow}
            disabled={paying}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {paying
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Membuka Popup...</>
              : <><CreditCard className="w-4 h-4" /> Bayar Sekarang</>
            }
          </button>

          {/* Sync jika webhook telat */}
          {payment?.midtrans_order_id && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full text-xs font-semibold text-slate-500 hover:text-primary flex items-center justify-center gap-1.5 py-1 disabled:opacity-50"
            >
              {syncing
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Menyinkronkan...</>
                : <><RefreshCw className="w-3 h-3" /> Sudah bayar tapi status belum update?</>
              }
            </button>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center pt-1">
            <Shield className="w-3 h-3" />
            <span>Transaksi diproses aman oleh Midtrans (sandbox)</span>
          </div>
        </div>
      )}

      {/* Konfirmasi lunas */}
      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-green-700">Pembayaran Terkonfirmasi</p>
            <p className="text-sm text-green-600 mt-0.5">
              {payment?.payment_channel
                ? <>Dibayar via <span className="font-semibold capitalize">{payment.payment_channel.replace(/_/g, " ")}</span>. Silakan ambil barang sesuai jadwal.</>
                : <>Silakan ambil barang sesuai jadwal.</>}
            </p>
          </div>
        </div>
      )}

      {/* Pickup map */}
      {(isPaid || isRunning) && pickupInfo && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="font-black text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              {isRunning ? "Lokasi Pengembalian Barang" : "Lokasi Pengambilan Barang"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRunning ? "Kembalikan barang ke lokasi berikut" : "Ambil barang di lokasi berikut sesuai jadwal"}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
            {pickupInfo.pickup_nama_usaha && <p className="font-bold text-slate-700">{pickupInfo.pickup_nama_usaha}</p>}
            {pickupInfo.pickup_alamat      && <p className="text-sm text-slate-600">{pickupInfo.pickup_alamat}</p>}
            {pickupInfo.pickup_telepon     && <p className="text-sm text-slate-500">📞 {pickupInfo.pickup_telepon}</p>}
          </div>

          <PickupMap
            lat={pickupInfo.pickup_latitude}
            lng={pickupInfo.pickup_longitude}
            label={pickupInfo.pickup_nama_usaha || "Lokasi Pickup"}
          />

          <a
            href={`https://www.google.com/maps?q=${pickupInfo.pickup_latitude},${pickupInfo.pickup_longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <Navigation className="w-4 h-4" />
            Buka di Google Maps
          </a>
        </div>
      )}

      {/* Pickup info tidak tersedia */}
      {isPaid && !pickupInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Koordinat Lokasi Belum Tersedia</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Admin belum mengisi koordinat lokasi usaha. Hubungi penyedia untuk konfirmasi pickup.
            </p>
            {adminInfo?.nomor_telepon && (
              <p className="text-xs font-semibold text-amber-700 mt-1">📞 {adminInfo.nomor_telepon}</p>
            )}
          </div>
        </div>
      )}

      {/* Info kontak admin (opsional, tetap ditampilkan) */}
      {adminInfo?.nomor_telepon && (
        <p className="text-center text-xs text-slate-400">
          Butuh bantuan? Hubungi penyedia: <span className="font-semibold text-slate-600">{adminInfo.nomor_telepon}</span>
        </p>
      )}
    </div>
  )
}
