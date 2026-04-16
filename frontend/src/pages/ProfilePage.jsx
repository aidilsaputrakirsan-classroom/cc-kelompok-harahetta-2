import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchProfile, updateProfile } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { StatusBadge } from "../components/ui/Badge"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import { User, Clock, CheckCircle, XCircle, Save, CreditCard, ImageIcon, X } from "lucide-react"

export default function ProfilePage({ addToast }) {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [form, setForm] = useState({
    nama_orang_tua: "", alamat: "", nomor_telepon: "",
    foto_ktp: "", foto_selfie_ktp: "",
  })

  useEffect(() => {
    fetchProfile()
      .then(p => {
        setProfile(p)
        setForm({
          nama_orang_tua: p.nama_orang_tua || "",
          alamat: p.alamat || "",
          nomor_telepon: p.nomor_telepon || "",
          foto_ktp: p.foto_ktp || "",
          foto_selfie_ktp: p.foto_selfie_ktp || "",
        })
      })
      .catch(() => addToast?.("Gagal memuat profil", "error"))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const compressAndSet = (file, fieldName) => {
    if (file.size > 5 * 1024 * 1024) {
      addToast?.("Ukuran file maksimal 5MB", "error")
      return
    }
    setUploading(p => ({ ...p, [fieldName]: true }))
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        setForm(p => ({ ...p, [fieldName]: canvas.toDataURL("image/jpeg", 0.8) }))
        setUploading(p => ({ ...p, [fieldName]: false }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
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

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Nomor Telepon</Label>
              <Input id="profile-phone" name="nomor_telepon" type="tel" placeholder="08123456789" value={form.nomor_telepon} onChange={handleChange} maxLength={20} />
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

            {/* Foto KTP */}
            <div className="space-y-2">
              <Label>Foto KTP</Label>
              {form.foto_ktp ? (
                <div className="relative inline-block w-full">
                  <img src={form.foto_ktp} alt="Foto KTP" className="w-full max-h-44 object-contain rounded-lg border bg-muted" />
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, foto_ktp: "" }))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${uploading.foto_ktp ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    {uploading.foto_ktp ? <span className="text-sm">Memproses...</span> : (
                      <>
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-sm font-medium">Klik untuk upload Foto KTP</span>
                        <span className="text-xs">JPG, PNG, WEBP · maks 5MB</span>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) compressAndSet(f, "foto_ktp"); e.target.value = "" }}
                    disabled={uploading.foto_ktp} />
                </label>
              )}
            </div>

            {/* Selfie dengan KTP */}
            <div className="space-y-2">
              <Label>Selfie dengan KTP</Label>
              {form.foto_selfie_ktp ? (
                <div className="relative inline-block w-full">
                  <img src={form.foto_selfie_ktp} alt="Selfie KTP" className="w-full max-h-44 object-contain rounded-lg border bg-muted" />
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, foto_selfie_ktp: "" }))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${uploading.foto_selfie_ktp ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    {uploading.foto_selfie_ktp ? <span className="text-sm">Memproses...</span> : (
                      <>
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-sm font-medium">Klik untuk upload Selfie + KTP</span>
                        <span className="text-xs">JPG, PNG, WEBP · maks 5MB</span>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) compressAndSet(f, "foto_selfie_ktp"); e.target.value = "" }}
                    disabled={uploading.foto_selfie_ktp} />
                </label>
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
