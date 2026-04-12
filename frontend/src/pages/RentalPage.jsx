import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchItem, createRental } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import { ArrowLeft, ShoppingCart, AlertTriangle, Calendar } from "lucide-react"

export default function RentalPage({ addToast }) {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get("item")
  const navigate = useNavigate()
  const { isVerified } = useAuth()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ tanggal_mulai: "", tanggal_selesai: "", catatan: "" })

  useEffect(() => {
    if (!itemId) { navigate("/dashboard"); return }
    fetchItem(itemId)
      .then((data) => { setItem(data); setLoading(false) })
      .catch(() => navigate("/dashboard"))
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
      await createRental({
        item_id: parseInt(itemId),
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        catatan: form.catatan || undefined,
      })
      addToast?.("Permintaan sewa berhasil dikirim!", "success")
      navigate("/rentals/my")
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
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const imgFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.nama || "Item")}&background=1b7e6a&color=fff&size=400&bold=true`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
      </button>

      <h1 className="text-2xl font-bold text-foreground">Ajukan Sewa</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Item info */}
        <Card>
          <CardContent className="p-4">
            <img
              src={item?.foto_url || imgFallback}
              alt={item?.nama}
              className="w-full aspect-video object-cover rounded-lg mb-4"
              onError={(e) => { e.target.src = imgFallback }}
            />
            <h3 className="text-lg font-bold text-foreground">{item?.nama}</h3>
            {item?.deskripsi && <p className="text-sm text-muted-foreground mt-1">{item?.deskripsi}</p>}
            <div className="flex justify-between items-center mt-4">
              <div>
                <div className="text-xl font-extrabold text-primary">{formatPrice(item?.harga_per_hari)}</div>
                <div className="text-xs text-muted-foreground">per hari</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">Stok: {item?.stok}</div>
              </div>
            </div>
            {item?.category && (
              <div className="mt-3 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                {item.category.nama}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardContent className="p-4">
            {!isVerified && (
              <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
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
                  type="date"
                  min={today}
                  value={form.tanggal_mulai}
                  onChange={(e) => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  min={form.tanggal_mulai || today}
                  value={form.tanggal_selesai}
                  onChange={(e) => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Permintaan khusus, kondisi barang, dll."
                  value={form.catatan}
                  onChange={(e) => setForm(p => ({ ...p, catatan: e.target.value }))}
                />
              </div>

              {days > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
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
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={submitting} disabled={!isVerified}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Kirim Permintaan Sewa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
