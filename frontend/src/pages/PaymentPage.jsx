import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchMyRentals, fetchMyPayments,
  fetchAdminPaymentInfo, fetchRentalPickupInfo,
  chargeDirectMidtrans, syncMidtransPayment,
} from "../services/api"
import { formatPrice } from "../lib/utils"
import { Skeleton } from "../components/ui/Skeleton"
import PickupMap from "../components/PickupMap"
import {
  ArrowLeft, CreditCard, CheckCircle, Loader2, Clock,
  AlertTriangle, BadgeCheck, MapPin, Navigation,
  Calendar, RefreshCw, Shield, XCircle, QrCode, Building2, Smartphone,
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

/* Payment method options */
const PAYMENT_METHODS = [
  {
    id: "qris",
    label: "QRIS",
    description: "Scan QR — GoPay, OVO, DANA, ShopeePay, dll",
    icon: QrCode,
    type: "qris",
    bank: null,
  },
  {
    id: "gopay",
    label: "GoPay",
    description: "Bayar langsung via GoPay",
    icon: Smartphone,
    type: "gopay",
    bank: null,
  },
  {
    id: "shopeepay",
    label: "ShopeePay",
    description: "Bayar langsung via ShopeePay",
    icon: Smartphone,
    type: "shopeepay",
    bank: null,
  },
  {
    id: "bca_va",
    label: "BCA Virtual Account",
    description: "Transfer via ATM/Mobile Banking BCA",
    icon: Building2,
    type: "bank_transfer",
    bank: "bca",
  },
  {
    id: "bni_va",
    label: "BNI Virtual Account",
    description: "Transfer via ATM/Mobile Banking BNI",
    icon: Building2,
    type: "bank_transfer",
    bank: "bni",
  },
  {
    id: "bri_va",
    label: "BRI Virtual Account",
    description: "Transfer via ATM/Mobile Banking BRI",
    icon: Building2,
    type: "bank_transfer",
    bank: "bri",
  },
  {
    id: "mandiri_va",
    label: "Mandiri Bill Payment",
    description: "Transfer via ATM/Mobile Banking Mandiri",
    icon: Building2,
    type: "bank_transfer",
    bank: "mandiri",
  },
  {
    id: "permata_va",
    label: "Permata Virtual Account",
    description: "Transfer via ATM/Mobile Banking Permata",
    icon: Building2,
    type: "bank_transfer",
    bank: "permata",
  },
]


export default function PaymentPage({ addToast }) {
  const { rentalId } = useParams()
  const navigate     = useNavigate()

  const [rental, setRental]         = useState(null)
  const [payment, setPayment]       = useState(null)
  const [adminInfo, setAdminInfo]   = useState(null)
  const [pickupInfo, setPickupInfo] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [charging, setCharging]     = useState(null) // id of method being charged
  const [syncing, setSyncing]       = useState(false)
  const [chargeResult, setChargeResult] = useState(null) // result from direct charge

  const loadAll = async () => {
    const id = parseInt(rentalId, 10)
    if (Number.isNaN(id)) { navigate("/home"); return }

    const rentalsData = await fetchMyRentals({ limit: 100 }).catch(() => ({ rentals: [] }))
    const rentals = Array.isArray(rentalsData) ? rentalsData : (rentalsData?.rentals || [])
    const r = rentals.find(x => x.id === id)
    if (!r) {
      addToast?.("Data sewa tidak ditemukan", "error")
      navigate("/home"); return
    }
    setRental(r)

    const paymentsData = await fetchMyPayments({ limit: 100 }).catch(() => ({ payments: [] }))
    const pays = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])
    const pay = pays.find(x => x.rental_id === id) || null
    setPayment(pay)

    if (pay?.status === "completed" || ["sedang_disewa", "selesai"].includes(r.status)) {
      fetchRentalPickupInfo(id).then(setPickupInfo).catch(() => {})
    }

    if (r.item?.admin_id) {
      fetchAdminPaymentInfo(r.item.admin_id).then(setAdminInfo).catch(() => {})
    }
  }

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
  }, [rentalId])

  // Handle direct charge
  const handleCharge = async (method) => {
    setCharging(method.id)
    try {
      const result = await chargeDirectMidtrans(rentalId, {
        payment_type: method.type,
        bank: method.bank,
      })
      setChargeResult(result)
      addToast?.("Pembayaran berhasil dibuat! Ikuti instruksi di bawah.", "success")
      await loadAll()
    } catch (err) {
      addToast?.(err.message || "Gagal membuat pembayaran", "error")
    } finally {
      setCharging(null)
    }
  }

  // Manual sync
  const handleSync = async () => {
    if (!payment?.id) return
    setSyncing(true)
    try {
      await syncMidtransPayment(payment.id)
      await loadAll()
      setChargeResult(null)
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

  // Extract payment info from charge result
  const midResp = chargeResult?.midtrans_response
  const vaNumbers = midResp?.va_numbers || []
  const qrUrl = midResp?.actions?.find(a => a.name === "generate-qr-code")?.url
    || midResp?.actions?.find(a => a.name === "deeplink-redirect")?.url
  const billKey = midResp?.bill_key
  const billerCode = midResp?.biller_code

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
              Admin sedang meninjau permintaan sewamu. Pilihan pembayaran akan muncul setelah disetujui.
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

      {/* Pilih Metode Pembayaran */}
      {canPay && !chargeResult && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-slate-800">Pilih Metode Pembayaran</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik metode yang kamu inginkan untuk langsung membuat pembayaran.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(method => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  onClick={() => handleCharge(method)}
                  disabled={charging !== null}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {charging === method.id ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{method.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{method.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center pt-1">
            <Shield className="w-3 h-3" />
            <span>Transaksi diproses aman oleh Midtrans</span>
          </div>
        </div>
      )}

      {/* Instruksi Pembayaran (setelah charge) */}
      {canPay && chargeResult && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-black text-slate-800">Instruksi Pembayaran</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Selesaikan pembayaran sebelum batas waktu berakhir.
              </p>
            </div>
          </div>

          {/* VA Numbers */}
          {vaNumbers.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              {vaNumbers.map((va, i) => (
                <div key={i}>
                  <p className="text-xs text-slate-500 uppercase font-semibold">{va.bank} Virtual Account</p>
                  <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider mt-1 select-all">{va.va_number}</p>
                </div>
              ))}
              <p className="text-xs text-slate-500">
                Transfer tepat <span className="font-bold text-slate-700">{formatPrice(rental.total_harga)}</span> ke nomor VA di atas.
              </p>
            </div>
          )}

          {/* Mandiri Bill Payment */}
          {billerCode && billKey && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Biller Code</p>
                <p className="text-xl font-mono font-bold text-slate-800 select-all">{billerCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Bill Key</p>
                <p className="text-xl font-mono font-bold text-slate-800 select-all">{billKey}</p>
              </div>
              <p className="text-xs text-slate-500">
                Transfer tepat <span className="font-bold text-slate-700">{formatPrice(rental.total_harga)}</span> menggunakan Mandiri Bill Payment.
              </p>
            </div>
          )}

          {/* QR Code / Deeplink */}
          {qrUrl && (
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-3">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
              <p className="text-xs text-slate-500 text-center">
                Scan QR code di atas menggunakan aplikasi e-wallet kamu.
              </p>
            </div>
          )}

          {/* GoPay/ShopeePay deeplink */}
          {midResp?.actions && !qrUrl && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              {midResp.actions.filter(a => a.name === "deeplink-redirect" || a.name === "get-status").map((action, i) => (
                action.name === "deeplink-redirect" && (
                  <a
                    key={i}
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm text-center hover:bg-primary/90 transition"
                  >
                    Buka Aplikasi untuk Bayar
                  </a>
                )
              ))}
            </div>
          )}

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {syncing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengecek status...</>
              : <><RefreshCw className="w-4 h-4" /> Sudah bayar? Cek status</>
            }
          </button>

          {/* Pilih metode lain */}
          <button
            onClick={() => setChargeResult(null)}
            className="w-full text-xs font-semibold text-slate-500 hover:text-primary py-1"
          >
            ← Pilih metode pembayaran lain
          </button>
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

      {adminInfo?.nomor_telepon && (
        <p className="text-center text-xs text-slate-400">
          Butuh bantuan? Hubungi penyedia: <span className="font-semibold text-slate-600">{adminInfo.nomor_telepon}</span>
        </p>
      )}
    </div>
  )
}
