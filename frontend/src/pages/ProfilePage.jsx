import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchProfile, updateProfile } from "../services/api"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { StatusBadge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import { User, Clock, CheckCircle, XCircle, Save, CreditCard, MapPin } from "lucide-react"

export default function ProfilePage({ addToast }) {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nama_orang_tua: "", alamat: "", latitude: "", longitude: "",
    foto_ktp: "", foto_selfie_ktp: "",
  })

  useEffect(() => {
    fetchProfile()
      .then(p => {
        setProfile(p)
        setForm({
          nama_orang_tua: p.nama_orang_tua || "",
          alamat: p.alamat || "",
          latitude: p.latitude || "",
          longitude: p.longitude || "",
          foto_ktp: p.foto_ktp || "",
          foto_selfie_ktp: p.foto_selfie_ktp || "",
        })
      })
      .catch(() => addToast?.("Gagal memuat profil", "error"))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude)
      else delete payload.latitude
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude)
      else delete payload.longitude
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      const updated = await updateProfile(payload)
      setProfile(updated)
      await refreshUser()
      addToast?.("Profil berhasil disimpan", "success")
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const verifStatus = profile?.status_verifikasi || "menunggu"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profil Saya</h1>
        <p className="text-muted-foreground mt-1">Lengkapi data diri dan upload KTP untuk mulai menyewa</p>
      </div>

      {/* User info card */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground flex-shrink-0">
            {user?.nama?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground">{user?.nama}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <StatusBadge status={user?.role} />
              <StatusBadge status={verifStatus} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification status banners */}
      {verifStatus === "menunggu" && form.foto_ktp && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
          <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning">Menunggu Verifikasi</div>
            <div className="text-sm text-muted-foreground">KTP Anda sedang direview oleh admin. Proses biasanya 1×24 jam.</div>
          </div>
        </div>
      )}
      {verifStatus === "disetujui" && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-success">Identitas Terverifikasi</div>
            <div className="text-sm text-muted-foreground">Anda dapat menyewa barang di platform.</div>
          </div>
        </div>
      )}
      {verifStatus === "ditolak" && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-destructive">Verifikasi Ditolak</div>
            <div className="text-sm text-muted-foreground">Upload ulang foto KTP yang lebih jelas.</div>
          </div>
        </div>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Data Diri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-parent">Nama Orang Tua</Label>
                <Input id="profile-parent" name="nama_orang_tua" placeholder="Masukkan nama orang tua" value={form.nama_orang_tua} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-address">Alamat Lengkap</Label>
                <Input id="profile-address" name="alamat" placeholder="Alamat lengkap" value={form.alamat} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-lat">Latitude</Label>
                <Input id="profile-lat" name="latitude" type="number" step="any" placeholder="-1.2654" value={form.latitude} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lon">Longitude</Label>
                <Input id="profile-lon" name="longitude" type="number" step="any" placeholder="116.8312" value={form.longitude} onChange={handleChange} />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4" /> Verifikasi KTP
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Upload KTP dan selfie memegang KTP
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-ktp">Foto KTP</Label>
              <Input id="profile-ktp" name="foto_ktp" type="url" placeholder="https://..." value={form.foto_ktp} onChange={handleChange} />
              {form.foto_ktp && (
                <img src={form.foto_ktp} alt="Foto KTP" className="max-h-36 object-contain rounded-lg border" onError={(e) => { e.target.style.display = "none" }} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-selfie">Selfie dengan KTP</Label>
              <Input id="profile-selfie" name="foto_selfie_ktp" type="url" placeholder="https://..." value={form.foto_selfie_ktp} onChange={handleChange} />
              {form.foto_selfie_ktp && (
                <img src={form.foto_selfie_ktp} alt="Selfie KTP" className="max-h-36 object-contain rounded-lg border" onError={(e) => { e.target.style.display = "none" }} />
              )}
            </div>

            <Button type="submit" size="lg" loading={saving} className="mt-2">
              <Save className="w-4 h-4 mr-2" /> Simpan & Ajukan Verifikasi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
