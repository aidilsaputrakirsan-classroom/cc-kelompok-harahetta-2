import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItem, createRental, createPaymentForRental } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import { Separator } from "../components/ui/Separator"
import { Skeleton } from "../components/ui/Skeleton"
import {
  ArrowLeft, AlertTriangle, Calendar,
  CreditCard, CheckCircle,
} from "lucide-react"

export default function RentalPage({ addToast }) {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get("item")
  const navigate = useNavigate()
  const { isVerified } = useAuth()

  const [item, setItem]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ tanggal_mulai: "", tanggal_selesai: "", catatan: "" })

  useEffect(() => {
    if (!itemId) { navigate("/catalog"); return }
    fetchItem(itemId)
      .then((data) => setItem(data))
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
      await createPaymentForRental(rental.id).catch(() => {})
      addToast?.("Permintaan sewa dibuat!", "success")
      navigate(`/payment/${rental.id}`)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    )
  }

  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=0a6e4a&color=fff&size=400&bold=true`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <h1 className="text-2xl font-bold tracking-tight">Ajukan Sewa</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: item info */}
        <div className="rounded-3xl overflow-hidden border border-border bg-card">
          <div className="aspect-video overflow-hidden bg-secondary">
            <img
              src={item?.foto_url || imgFallback}
              alt={item?.nama}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = imgFallback }}
            />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold tracking-tight">{item?.nama}</h3>
            {item?.deskripsi && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.deskripsi}</p>}
            <div className="flex justify-between items-center mt-4">
              <div>
                <div className="text-xl font-bold text-primary">{formatPrice(item?.harga_per_hari)}</div>
                <div className="text-xs text-muted-foreground">per hari</div>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Stok: {item?.stok}</span>
            </div>
            {item?.category && (
              <span className="mt-3 inline-block text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {item.category.nama}
              </span>
            )}
          </div>
        </div>

        {/* Right: form */}
        <div className="rounded-3xl border border-border bg-card p-6">
          {!isVerified && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-amber-600 dark:text-amber-400">Profil belum terverifikasi</span>
                <br />
                <button onClick={() => navigate("/profile")} className="text-amber-600 dark:text-amber-400 underline text-xs mt-0.5">
                  Verifikasi dulu →
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal mulai</Label>
              <Input
                type="date" min={today} value={form.tanggal_mulai}
                onChange={(e) => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal selesai</Label>
              <Input
                type="date" min={form.tanggal_mulai || today} value={form.tanggal_selesai}
                onChange={(e) => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Permintaan khusus, kondisi barang, dll."
                value={form.catatan}
                onChange={(e) => setForm(p => ({ ...p, catatan: e.target.value }))}
              />
            </div>

            {days > 0 && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Durasi</span>
                  <span className="font-semibold text-foreground">{days} hari</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Harga/hari</span>
                  <span className="font-semibold text-foreground">{formatPrice(item?.harga_per_hari)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            {days > 0 && (
              <div className="p-3 rounded-2xl bg-secondary border border-border text-xs text-muted-foreground space-y-0.5">
                <strong className="block mb-1 text-foreground">Alur pembayaran:</strong>
                <span className="block">1. Isi form sewa & klik "Lanjut ke Pembayaran"</span>
                <span className="block">2. Bayar via Midtrans (transfer/e-wallet/QRIS)</span>
                <span className="block">3. Admin verifikasi & setujui sewa kamu</span>
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
