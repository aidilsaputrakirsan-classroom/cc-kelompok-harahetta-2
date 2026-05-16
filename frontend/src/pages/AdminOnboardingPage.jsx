import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Store, ArrowRight, ArrowLeft, CheckCircle, MapPin } from "lucide-react"
import MapPicker from "../components/MapPicker"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function AdminOnboardingPage({ addToast }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    nama_usaha: "",
    alamat_usaha: "",
    nomor_telepon: "",
    latitude: null,
    longitude: null,
  })

  useEffect(() => {
    fetch(`${API_URL}/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("Profil belum dibuat")
      })
      .then((p) => {
        setProfile(p)
        setForm({
          nama_usaha: p.nama_usaha || "",
          alamat_usaha: p.alamat_usaha || "",
          nomor_telepon: p.nomor_telepon || "",
          latitude: p.latitude || null,
          longitude: p.longitude || null,
        })
      })
      .catch(() => {
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!form.nama_usaha || !form.alamat_usaha || !form.nomor_telepon) {
        addToast?.("Harap lengkapi semua informasi usaha", "error")
        return
      }
      if (!form.latitude || !form.longitude) {
        addToast?.("Harap pilih lokasi usaha di peta", "error")
        return
      }
      setSaving(true)
      try {
        const payload = {
          nama_usaha: form.nama_usaha,
          alamat_usaha: form.alamat_usaha,
          nomor_telepon: form.nomor_telepon,
          latitude: form.latitude,
          longitude: form.longitude,
        }
        const method = profile ? "PUT" : "POST"
        const res = await fetch(`${API_URL}/admin/profile`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Gagal menyimpan profil usaha")
        const updated = await res.json()
        setProfile(updated)
        addToast?.("Profil usaha berhasil disimpan", "success")
        setCurrentStep(2)
      } catch (err) {
        addToast?.(err.message, "error")
      } finally {
        setSaving(false)
      }
    } else if (currentStep === 2) {
      navigate("/admin/dashboard")
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    navigate("/admin/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Selamat Datang di Sewain!
          </h1>
          <p className="text-muted-foreground">
            Mari setup profil usaha Anda dalam beberapa langkah mudah
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                {step < 2 && (
                  <div
                    className={`w-24 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-4 text-sm text-muted-foreground">
            <span
              className={
                currentStep === 1 ? "font-semibold text-primary" : ""
              }
            >
              Info Usaha
            </span>
            <span
              className={
                currentStep === 2 ? "font-semibold text-primary" : ""
              }
            >
              Selesai
            </span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && (
                <>
                  <Store className="w-6 h-6" /> Informasi Usaha
                </>
              )}
              {currentStep === 2 && (
                <>
                  <CheckCircle className="w-6 h-6" /> Setup Selesai
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Lengkapi informasi usaha Anda. Informasi ini akan ditampilkan
                  kepada penyewa.
                </p>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_usaha">
                      Nama Usaha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nama_usaha"
                      name="nama_usaha"
                      value={form.nama_usaha}
                      onChange={handleChange}
                      placeholder="Toko Sewa Jaya"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamat_usaha">
                      Alamat Usaha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="alamat_usaha"
                      name="alamat_usaha"
                      value={form.alamat_usaha}
                      onChange={handleChange}
                      placeholder="Jl. Soekarno-Hatta No.1, Balikpapan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomor_telepon">
                      Nomor Telepon <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nomor_telepon"
                      name="nomor_telepon"
                      value={form.nomor_telepon}
                      onChange={handleChange}
                      placeholder="08123456789"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Nomor ini akan digunakan penyewa untuk konfirmasi
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      Titik Lokasi Usaha{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Klik pada peta untuk menandai lokasi usaha Anda.
                    </p>
                    <MapPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={({ latitude, longitude }) =>
                        setForm((p) => ({ ...p, latitude, longitude }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 - Selesai */}
            {currentStep === 2 && (
              <div className="space-y-6 text-center py-8">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Setup Berhasil!
                </h3>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Profil usaha Anda sudah siap. Sekarang Anda bisa mulai
                  menambahkan barang dan mengelola pesanan. Pembayaran dari
                  penyewa akan otomatis masuk ke wallet Anda lewat payment
                  gateway.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-left max-w-xl mx-auto">
                  <h4 className="font-semibold text-foreground mb-2">
                    Langkah Selanjutnya:
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Tambahkan barang pertama ke katalog</li>
                    <li>Atur harga sewa per hari dan stok</li>
                    <li>Kelola pesanan yang masuk dari penyewa</li>
                    <li>Tarik saldo wallet ke rekening Anda</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <div className="flex gap-2">
                {currentStep > 1 && currentStep < 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={handlePrevStep}
                    disabled={saving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Kembali
                  </Button>
                )}
                {currentStep < 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                  >
                    Lewati
                  </Button>
                )}
              </div>
              <Button
                type="button"
                className="rounded-full"
                onClick={handleNextStep}
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : currentStep === 2
                  ? "Ke Dashboard"
                  : "Lanjut"}
                {!saving && currentStep < 2 && (
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
