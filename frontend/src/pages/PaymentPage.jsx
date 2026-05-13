import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchMyRentals, fetchMyPayments, createPaymentForRental,
  uploadPaymentProof, fetchAdminPaymentInfo, fetchRentalPickupInfo,
} from "../services/api"
import { formatPrice } from "../lib/utils"
import { Skeleton } from "../components/ui/skeleton"
import PickupMap from "../components/PickupMap"
import {
  ArrowLeft, Upload, CreditCard, Building2, QrCode, Copy,
  CheckCircle, Loader2, ImageIcon, X, Calendar, Package,
  Clock, AlertTriangle, BadgeCheck, MapPin, Navigation,
} from "lucide-react"

// ── Compress image helper
function compressImg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.78))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const STATUS_LABEL = {
  pending:   { label: "Menunggu",    cls: "bg-amber-100 text-amber-700",  icon: Clock },
  completed: { label: "Lunas",       cls: "bg-green-100 text-green-700",  icon: CheckCircle },
  failed:    { label: "Ditolak",     cls: "bg-red-100 text-red-700",      icon: AlertTriangle },
  cancelled: { label: "Dibatalkan",  cls: "bg-slate-100 text-slate-500",  icon: X },
}

export default function PaymentPage({ addToast }) {
  const { rentalId } = useParams()
  const navigate     = useNavigate()

  const [rental, setRental]         = useState(null)
  const [payment, setPayment]       = useState(null)
  const [adminInfo, setAdminInfo]   = useState(null)
  const [pickupInfo, setPickupInfo] = useState(null)  // info pickup dari API
  const [loading, setLoading]       = useState(true)

  const [buktiPreview, setBuktiPreview] = useState(null) // new file preview
  const [catatan, setCatatan]           = useState("")
  const [submitting, setSubmitting]     = useState(false)
  const [copied, setCopied]             = useState(false)
  const fileRef = useRef()

  // ── Load data
  useEffect(() => {
    if (!rentalId) { navigate("/home"); return }
    const id = parseInt(rentalId, 10)

    fetchMyRentals({ limit: 100 })
      .then(async (rentalsData) => {
        const rentals = Array.isArray(rentalsData)
          ? rentalsData
          : (rentalsData?.rentals || rentalsData?.items || [])
        const r = rentals.find(x => x.id === id)
        if (!r) {
          addToast?.("Data sewa tidak ditemukan", "error")
          navigate("/home")
          return
        }
        setRental(r)

        // ── payments (opsional)
        fetchMyPayments({ limit: 100 }).then(paymentsData => {
          const pays = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])
          const pay = pays.find(x => x.rental_id === id) || null
          setPayment(pay)

          // ── Jika sudah lunas, coba fetch pickup info dari API (ada fallback ke profil admin)
          if (pay?.status === "completed" || ["sedang_disewa", "selesai"].includes(r.status)) {
            fetchRentalPickupInfo(id)
              .then(info => setPickupInfo(info))
              .catch(() => {/* koordinat tidak tersedia */})
          }
        }).catch(() => {})

        // ── admin payment info
        if (r.item?.admin_id) {
          const info = await fetchAdminPaymentInfo(r.item.admin_id).catch(() => null)
          setAdminInfo(info)
        }
      })
      .catch(err => {
        console.error("PaymentPage rentals error:", err)
        addToast?.("Gagal memuat data sewa", "error")
        navigate("/home")
      })
      .finally(() => setLoading(false))
  }, [rentalId, navigate])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setBuktiPreview(await compressImg(file)) }
    catch { addToast?.("Gagal memproses gambar", "error") }
  }

  const copyRek = () => {
    if (!adminInfo?.nomor_rekening) return
    navigator.clipboard.writeText(adminInfo.nomor_rekening).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleSubmit = async () => {
    if (!buktiPreview) { addToast?.("Pilih foto bukti terlebih dahulu", "warning"); return }
    setSubmitting(true)
    try {
      let pay = payment
      if (!pay) pay = await createPaymentForRental(rentalId)
      const updated = await uploadPaymentProof(pay.id, {
        bukti_pembayaran: buktiPreview,
        catatan: catatan || undefined,
      })
      setPayment(updated)
      setBuktiPreview(null)
      if (fileRef.current) fileRef.current.value = ""
      addToast?.("Bukti pembayaran berhasil dikirim! Admin akan segera mengkonfirmasi.", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal mengirim bukti", "error")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading
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
  const payStatus = payment ? (STATUS_LABEL[payment.status] || STATUS_LABEL.pending) : null
  const PayIcon = payStatus?.icon || Clock
  const isPaid = payment?.status === "completed"
  const hasBukti = !!payment?.bukti_pembayaran
  const hasPayInfo = adminInfo?.nomor_rekening || adminInfo?.foto_qris
  // Bisa upload kapan saja selama belum confirmed
  const canUpload = !isPaid && rental?.status !== "selesai" && rental?.status !== "ditolak"

  const rentalStatusLabel = {
    pending:      { label: "Menunggu Verifikasi Admin", cls: "bg-amber-100 text-amber-700" },
    disetujui:    { label: "Disetujui Admin",           cls: "bg-blue-100 text-blue-700" },
    sedang_disewa:{ label: "Sedang Disewa",             cls: "bg-teal-100 text-teal-700" },
    selesai:      { label: "Selesai",                  cls: "bg-green-100 text-green-700" },
    ditolak:      { label: "Ditolak",                  cls: "bg-red-100 text-red-700" },
  }
  const rs = rentalStatusLabel[rental?.status] || rentalStatusLabel.pending

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Back */}
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-black text-slate-800">Pembayaran Sewa</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* rental status */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rs.cls}`}>{rs.label}</span>
          {/* payment status */}
          {payStatus && (
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${payStatus.cls}`}>
              <PayIcon className="w-3.5 h-3.5" /> {payStatus.label}
            </span>
          )}
        </div>
      </div>

      {/* Pending guide banner */}
      {rental?.status === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
          <p className="font-bold">📋 Langkah Pembayaran</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Transfer ke rekening penyedia di bawah</li>
            <li>Upload foto bukti transfer</li>
            <li>Admin akan memverifikasi bukti &amp; menyetujui pesananmu</li>
          </ol>
        </div>
      )}

      {/* ── Rental summary card */}
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

      {/* ── Paid confirmation */}
      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-green-700">Pembayaran Terkonfirmasi</p>
            <p className="text-sm text-green-600 mt-0.5">Admin telah mengkonfirmasi bukti transfermu. Silakan ambil barang sesuai jadwal.</p>
          </div>
        </div>
      )}

      {/* ── Pickup location (tampil setelah bayar, pakai pickupInfo dari API) */}
      {isPaid && pickupInfo && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="font-black text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Lokasi Pengambilan Barang
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ambil barang di lokasi berikut sesuai jadwal sewa
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
            {pickupInfo.pickup_nama_usaha && (
              <p className="font-bold text-slate-700">{pickupInfo.pickup_nama_usaha}</p>
            )}
            {pickupInfo.pickup_alamat && (
              <p className="text-sm text-slate-600">{pickupInfo.pickup_alamat}</p>
            )}
            {pickupInfo.pickup_telepon && (
              <p className="text-sm text-slate-500">📞 {pickupInfo.pickup_telepon}</p>
            )}
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
            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm
                       flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <Navigation className="w-4 h-4" />
            Buka di Google Maps
          </a>
        </div>
      )}

      {/* Banner jika sudah bayar tapi pickup info tidak tersedia (admin belum isi koordinat) */}
      {isPaid && !pickupInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Koordinat Lokasi Belum Tersedia</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Admin belum mengisi koordinat lokasi usaha. Hubungi penyedia langsung untuk konfirmasi lokasi pengambilan.
            </p>
            {adminInfo?.nomor_telepon && (
              <p className="text-xs font-semibold text-amber-700 mt-1">📞 {adminInfo.nomor_telepon}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Admin payment info */}
      {hasPayInfo && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
          <div>
            <p className="text-slate-800 font-bold text-sm">Transfer ke</p>
            <p className="text-slate-500 text-xs mt-0.5">{adminInfo.nama_usaha}</p>
          </div>

          {adminInfo.nomor_rekening && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <Building2 className="w-3.5 h-3.5" /> Nomor Rekening / Bank
              </div>
              <div className="flex items-center gap-3">
                <p className="font-black text-slate-800 text-base flex-1">{adminInfo.nomor_rekening}</p>
                <button
                  onClick={copyRek}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition flex-shrink-0"
                >
                  {copied
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Tersalin!</>
                    : <><Copy className="w-3.5 h-3.5" /> Salin</>
                  }
                </button>
              </div>
            </div>
          )}

          {adminInfo.foto_qris && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <QrCode className="w-3.5 h-3.5" /> QRIS — Scan dengan app pembayaranmu
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-center">
                <img
                  src={adminInfo.foto_qris}
                  alt="QRIS"
                  className="max-w-[220px] w-full object-contain"
                />
              </div>
            </div>
          )}

          {adminInfo.nomor_telepon && (
            <p className="text-slate-500 text-xs">
              Konfirmasi ke penyedia: {adminInfo.nomor_telepon}
            </p>
          )}
        </div>
      )}

      {/* ── Upload / view bukti */}
      {canUpload && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="font-black text-slate-800">Upload Bukti Pembayaran</p>
            <p className="text-xs text-slate-400 mt-0.5">Foto struk transfer / screenshot konfirmasi</p>
          </div>

          {/* Current uploaded bukti */}
          {hasBukti && !buktiPreview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
                <Clock className="w-3.5 h-3.5" /> Bukti sudah dikirim · menunggu konfirmasi admin
              </div>
              <img
                src={payment.bukti_pembayaran}
                alt="Bukti"
                className="w-full rounded-2xl object-cover max-h-56 border border-slate-200"
              />
            </div>
          )}

          {/* New file preview */}
          {buktiPreview ? (
            <div className="relative">
              <img src={buktiPreview} alt="preview" className="w-full rounded-2xl object-cover max-h-56 border border-slate-200" />
              <button
                onClick={() => { setBuktiPreview(null); if (fileRef.current) fileRef.current.value = "" }}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-7 flex flex-col items-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-semibold">{hasBukti ? "Ganti Foto Bukti" : "Pilih Foto Bukti"}</span>
              <span className="text-xs">JPG, PNG, WEBP</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Catatan (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Transfer BCA 15:30, ref 1234..."
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-slate-50"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !buktiPreview}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              : <><Upload className="w-4 h-4" /> Kirim Bukti Pembayaran</>
            }
          </button>
        </div>
      )}

      {/* ── If no payment info configured yet */}
      {!hasPayInfo && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Info Rekening Belum Diisi</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Penyedia barang belum mengisi nomor rekening. Hubungi penyedia untuk konfirmasi cara pembayaran.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
