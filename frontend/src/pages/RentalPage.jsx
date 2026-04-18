import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItem, createRental, createPaymentForRental, fetchAdminPaymentInfo } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import {
  ArrowLeft, AlertTriangle, Calendar,
  CreditCard, Building2, QrCode, Copy, CheckCircle,
} from "lucide-react"

export default function RentalPage({ addToast }) {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get("item")
  const navigate = useNavigate()
  const { isVerified } = useAuth()

  const [item, setItem]               = useState(null)
  const [adminPayment, setAdminPayment] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [copied, setCopied]           = useState(false)
  const [form, setForm] = useState({ tanggal_mulai: "", tanggal_selesai: "", catatan: "" })

  useEffect(() => {
    if (!itemId) { navigate("/catalog"); return }
    fetchItem(itemId)
      .then(async (data) => {
        setItem(data)
        // load admin payment info using admin_id from item
        if (data.admin_id) {
          const info = await fetchAdminPaymentInfo(data.admin_id).catch(() => null)
          setAdminPayment(info)
        }
      })
      .catch(() => navigate("/catalog"))
      .finally(() => setLoading(false))
  }, [itemId, navigate])

  const days = form.tanggal_mulai && form.tanggal_selesai
    ? Math.max(0, Math.ceil((new Date(form.tanggal_selesai) - new Date(form.tanggal_mulai)) / 86400000))
    : 0
  const totalPrice = item ? item.harga_per_hari * days : 0
  const today = new Date().toISOString().split("T")[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isVerified) {
      addToast?.("Profil Anda belum terverifikasi", "warning")
      navigate("/profile")
      return
    }
    if (days <= 0) { addToast?.("Pilih tanggal yang valid", "error"); return }
    setSubmitting(true)
    try {
      const rental = await createRental({
        item_id: parseInt(itemId),
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        catatan: form.catatan || undefined,
      })
      // Auto-buat tagihan agar user bisa langsung upload bukti
      await createPaymentForRental(rental.id).catch(() => {})
      addToast?.("Permintaan dibuat! Silakan upload bukti pembayaran.", "success")
      navigate(`/payment/${rental.id}`)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  const copyRekening = () => {
    if (!adminPayment?.nomor_rekening) return
    navigator.clipboard.writeText(adminPayment.nomor_rekening).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    )
  }

  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=1b7e6a&color=fff&size=400&bold=true`
  const hasPaymentInfo = adminPayment?.nomor_rekening || adminPayment?.foto_qris

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <h1 className="text-2xl font-bold text-foreground">Ajukan Sewa</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left col: item info + payment info */}
        <div className="space-y-4">
          {/* Item card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="aspect-video overflow-hidden bg-slate-50">
              <img
                src={item?.foto_url || imgFallback}
                alt={item?.nama}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = imgFallback }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-foreground">{item?.nama}</h3>
              {item?.deskripsi && <p className="text-sm text-muted-foreground mt-1">{item?.deskripsi}</p>}
              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="text-xl font-extrabold text-primary">{formatPrice(item?.harga_per_hari)}</div>
                  <div className="text-xs text-muted-foreground">per hari</div>
                </div>
                <span className="text-sm font-semibold text-foreground">Stok: {item?.stok}</span>
              </div>
              {item?.category && (
                <span className="mt-2 inline-block text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {item.category.nama}
                </span>
              )}
            </div>
          </div>

          {/* Payment info card */}
          {hasPaymentInfo && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 text-white space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <p className="font-bold text-sm">Info Pembayaran Penyedia</p>
              </div>
              <p className="text-xs text-slate-400">
                Setelah pengajuan disetujui, transfer ke rekening berikut dan upload buktinya.
              </p>

              {adminPayment.nomor_rekening && (
                <div className="bg-white/10 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5" /> Nomor Rekening / Bank
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white text-sm">{adminPayment.nomor_rekening}</p>
                    <button
                      onClick={copyRekening}
                      className="flex items-center gap-1 text-xs text-primary bg-primary/20 px-2 py-1 rounded-lg hover:bg-primary/30 transition flex-shrink-0"
                    >
                      {copied
                        ? <><CheckCircle className="w-3 h-3" /> Tersalin</>
                        : <><Copy className="w-3 h-3" /> Salin</>
                      }
                    </button>
                  </div>
                </div>
              )}

              {adminPayment.foto_qris && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <QrCode className="w-3.5 h-3.5" /> Scan QRIS
                  </div>
                  <div className="bg-white rounded-2xl p-3 flex justify-center">
                    <img
                      src={adminPayment.foto_qris}
                      alt="QRIS"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                </div>
              )}

              {adminPayment.nomor_telepon && (
                <p className="text-xs text-slate-400">
                  Konfirmasi: {adminPayment.nomor_telepon}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right col: form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          {!isVerified && (
            <div className="mb-4 p-3 rounded-2xl bg-warning/10 border border-warning/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-warning">Profil belum terverifikasi</span>
                <br />
                <button onClick={() => navigate("/profile")} className="text-warning underline text-xs">
                  Verifikasi Dulu
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date" min={today} value={form.tanggal_mulai}
                onChange={(e) => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input
                type="date" min={form.tanggal_mulai || today} value={form.tanggal_selesai}
                onChange={(e) => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-2xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Permintaan khusus, kondisi barang, dll."
                value={form.catatan}
                onChange={(e) => setForm(p => ({ ...p, catatan: e.target.value }))}
              />
            </div>

            {days > 0 && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Durasi</span>
                  <span>{days} hari</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Harga/Hari</span>
                  <span>{formatPrice(item?.harga_per_hari)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            {days > 0 && (
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-700 space-y-0.5">
                <strong className="block mb-1">Alur Pembayaran:</strong>
                <span className="block">1. Isi form sewa &amp; klik "Lanjut ke Pembayaran"</span>
                <span className="block">2. Transfer ke rekening penyedia</span>
                <span className="block">3. Upload foto bukti transfer</span>
                <span className="block">4. Admin akan memverifikasi &amp; menyetujui sewa kamu</span>
              </div>
            )}

            <Button type="submit" className="w-full rounded-2xl" size="lg" loading={submitting} disabled={!isVerified}>
              <CreditCard className="w-4 h-4 mr-2" /> Lanjut ke Pembayaran
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
