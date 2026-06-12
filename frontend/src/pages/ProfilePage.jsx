import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchProfile, updateProfile, updateMe } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { StatusBadge } from "../components/ui/Badge"
import { Separator } from "../components/ui/Separator"
import { Skeleton } from "../components/ui/Skeleton"
import Avatar from "../components/ui/Avatar"
import { User, Clock, CheckCircle, Save, CreditCard, ImageIcon, X, Camera, Trash2, Loader2 } from "lucide-react"
import { useTour } from "../hooks/useTour"
import TourButton from "../components/TourButton"
import { TOUR_KEYS } from "../lib/tour"
import { profileSteps } from "../lib/tourSteps"

export default function ProfilePage({ addToast }) {
  const { user, refreshUser } = useAuth()

  const { startTour } = useTour({
    tourKey:   TOUR_KEYS.profile,
    steps:     profileSteps,
    autoStart: false,
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [savingPhoto, setSavingPhoto] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    nama_orang_tua: "", alamat: "", nomor_telepon: "",
    foto_ktp: "", foto_selfie_ktp: "",
  })

  const isUserRole = user?.role === "user"

  useEffect(() => {
    if (!isUserRole) {
      // Admin/Super admin tidak punya UserProfile (KTP). Cukup atur foto profil.
      setLoading(false)
      return
    }
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
  }, [isUserRole])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const compressToDataUrl = (file, { maxSize = 512, quality = 0.85 } = {}) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Gagal membaca file"))
      reader.onload = (ev) => {
        const img = new Image()
        img.onerror = () => reject(new Error("File bukan gambar yang valid"))
        img.onload = () => {
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
            else { width = Math.round(width * maxSize / height); height = maxSize }
          }
          const canvas = document.createElement("canvas")
          canvas.width = width; canvas.height = height
          canvas.getContext("2d").drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", quality))
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    })

  const handleSelectAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      addToast?.("File harus berupa gambar", "error")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast?.("Ukuran file maksimal 5MB", "error")
      return
    }
    setSavingPhoto(true)
    try {
      const dataUrl = await compressToDataUrl(file, { maxSize: 512, quality: 0.85 })
      await updateMe({ foto_profil: dataUrl })
      await refreshUser()
      addToast?.("Foto profil berhasil diperbarui", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal mengubah foto profil", "error")
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user?.foto_profil) return
    if (!window.confirm("Hapus foto profil saat ini?")) return
    setSavingPhoto(true)
    try {
      await updateMe({ foto_profil: "" })
      await refreshUser()
      addToast?.("Foto profil dihapus", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal menghapus foto", "error")
    } finally {
      setSavingPhoto(false)
    }
  }

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
      if (updated.status_verifikasi === "disetujui") {
        addToast?.("Profil lengkap! Anda sekarang bisa menyewa barang.", "success")
      } else {
        addToast?.("Profil berhasil disimpan", "success")
      }
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
  const isVerified = verifStatus === "disetujui"
  const bothPhotosUploaded = !!form.foto_ktp && !!form.foto_selfie_ktp

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profil Saya</h1>
        <p className="text-muted-foreground mt-1">
          {isUserRole
            ? "Lengkapi data diri dan upload KTP untuk mulai menyewa"
            : "Atur foto profil dan info akun"}
        </p>
      </div>

      {/* User info + foto profil */}
      <Card id="profile-avatar-section">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={user?.foto_profil}
              name={user?.nama}
              size={72}
              className="ring-2 ring-primary/20"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingPhoto}
              title="Ubah foto profil"
              aria-label="Ubah foto profil"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-60"
            >
              {savingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleSelectAvatar}
              disabled={savingPhoto}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{user?.nama}</h3>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <StatusBadge status={user?.role} />
              {isUserRole && <StatusBadge status={verifStatus} />}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingPhoto}
                className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5" /> Ganti foto
              </button>
              {user?.foto_profil && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={savingPhoto}
                  className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification banners + KTP form khusus role user */}
      {isUserRole && (
        <>
          {isVerified && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-success">Profil Lengkap & Terverifikasi</div>
                <div className="text-sm text-muted-foreground">Anda dapat menyewa barang di platform.</div>
              </div>
            </div>
          )}
          {!isVerified && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-600 dark:text-amber-400">Lengkapi Profil</div>
                <div className="text-sm text-muted-foreground">Isi data diri, upload KTP dan selfie untuk bisa menyewa barang.</div>
              </div>
            </div>
          )}

      {/* Profile form */}
      <Card id="profile-info-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Data Diri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-parent">Nama Orang Tua</Label>
                <Input id="profile-parent" name="nama_orang_tua" placeholder="Masukkan nama orang tua" value={form.nama_orang_tua} onChange={handleChange} disabled={isVerified} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-address">Alamat Lengkap</Label>
                <Input id="profile-address" name="alamat" placeholder="Alamat lengkap" value={form.alamat} onChange={handleChange} disabled={isVerified} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Nomor Telepon</Label>
              <Input id="profile-phone" name="nomor_telepon" type="tel" placeholder="08123456789" value={form.nomor_telepon} onChange={handleChange} maxLength={20} disabled={isVerified} />
            </div>

            <Separator />

            <div id="profile-verification-section">
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
                  {!isVerified && (
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, foto_ktp: "" }))}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg ${isVerified ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"} transition-colors ${uploading.foto_ktp ? "opacity-50 pointer-events-none" : ""}`}>
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
                    disabled={uploading.foto_ktp || isVerified} />
                </label>
              )}
            </div>

            {/* Selfie dengan KTP */}
            <div className="space-y-2">
              <Label>Selfie dengan KTP</Label>
              {form.foto_selfie_ktp ? (
                <div className="relative inline-block w-full">
                  <img src={form.foto_selfie_ktp} alt="Selfie KTP" className="w-full max-h-44 object-contain rounded-lg border bg-muted" />
                  {!isVerified && (
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, foto_selfie_ktp: "" }))}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg ${isVerified ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"} transition-colors ${uploading.foto_selfie_ktp ? "opacity-50 pointer-events-none" : ""}`}>
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
                    disabled={uploading.foto_selfie_ktp || isVerified} />
                </label>
              )}
            </div>

            {/* Info message jika belum lengkap */}
            {!bothPhotosUploaded && !isVerified && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                📸 Upload kedua foto (KTP dan Selfie dengan KTP) lalu simpan untuk bisa menyewa
              </div>
            )}

            {/* Tombol simpan — muncul jika belum verified */}
            {!isVerified && (
              <Button type="submit" size="lg" loading={saving} disabled={!bothPhotosUploaded || !form.alamat || !form.nomor_telepon} className="mt-2">
                <Save className="w-4 h-4 mr-2" /> Simpan Profil
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
        </>
      )}

      {/* Tour button */}
      <TourButton onClick={startTour} />
    </div>
  )
}
