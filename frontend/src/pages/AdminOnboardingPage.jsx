import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Store, CreditCard, QrCode, ArrowRight, ArrowLeft, CheckCircle, Upload, MapPin } from "lucide-react"
import MapPicker from "../components/MapPicker"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function AdminOnboardingPage({ addToast }) {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    nama_usaha: "",
    alamat_usaha: "",
    nomor_telepon: "",
    nomor_rekening: "",
    foto_qris: "",
    latitude: null,
    longitude: null,
  })

  useEffect(() => {
    // Cek apakah admin sudah punya profil
    fetch(`${API_URL}/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error("Profil belum dibuat")
      })
      .then(p => {
        setProfile(p)
        setForm({
          nama_usaha: p.nama_usaha || "",
          alamat_usaha: p.alamat_usaha || "",
          nomor_telepon: p.nomor_telepon || "",
          nomor_rekening: p.nomor_rekening || "",
          foto_qris: p.foto_qris || "",
          latitude: p.latitude || null,
          longitude: p.longitude || null,
        })
        
        // Cek progress: jika sudah lengkap, skip ke step yang sesuai
        if (p.nomor_rekening || p.foto_qris) {
          setCurrentStep(2) // Sudah setup payment info
        }
      })
      .catch(() => {
        // Profil belum ada, mulai dari step 1
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const compressAndSetQRIS = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      addToast?.("Ukuran file maksimal 5MB", "error")
      return
    }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        setForm(p => ({ ...p, foto_qris: canvas.toDataURL("image/jpeg", 0.8) }))
        setUploading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validasi step 1
      if (!form.nama_usaha || !form.alamat_usaha || !form.nomor_telepon) {
        addToast?.("Harap lengkapi semua informasi usaha", "error")
        return
      }
      // Validasi koordinat wajib
      if (!form.latitude || !form.longitude) {
        addToast?.("Harap pilih lokasi usaha di peta", "error")
        return
      }
      
      // Save step 1 data
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
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        
        if (!res.ok) {
          throw new Error("Gagal menyimpan profil usaha")
        }
        
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
      // Validasi step 2
      if (!form.nomor_rekening && !form.foto_qris) {
        addToast?.("Harap isi minimal nomor rekening atau upload QRIS", "error")
        return
      }
      
      // Save step 2 data
      setSaving(true)
      try {
        const payload = {
          nomor_rekening: form.nomor_rekening,
          foto_qris: form.foto_qris || undefined,
        }
        
        const res = await fetch(`${API_URL}/admin/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        
        if (!res.ok) {
          throw new Error("Gagal menyimpan info pembayaran")
        }
        
        const updated = await res.json()
        setProfile(updated)
        addToast?.("Info pembayaran berhasil disimpan", "success")
        setCurrentStep(3)
      } catch (err) {
        addToast?.(err.message, "error")
      } finally {
        setSaving(false)
      }
    } else if (currentStep === 3) {
      // Selesai onboarding, redirect ke dashboard
      navigate("/admin/dashboard")
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    navigate("/admin/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang di Sewain!</h1>
          <p className="text-gray-600">Mari setup profil usaha Anda dalam beberapa langkah mudah</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                  ${currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'}
                `}>
                  {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-24 h-1 mx-2 transition-all
                    ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-4 text-sm text-gray-600">
            <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Info Usaha</span>
            <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>Pembayaran</span>
            <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>Selesai</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <><Store className="w-6 h-6" /> Informasi Usaha</>}
              {currentStep === 2 && <><CreditCard className="w-6 h-6" /> Info Pembayaran</>}
              {currentStep === 3 && <><CheckCircle className="w-6 h-6" /> Setup Selesai</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Info Usaha */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Lengkapi informasi usaha Anda. Informasi ini akan ditampilkan kepada penyewa.
                </p>
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nama_usaha">Nama Usaha <span className="text-red-500">*</span></Label>
                    <Input
                      id="nama_usaha"
                      name="nama_usaha"
                      value={form.nama_usaha}
                      onChange={handleChange}
                      placeholder="Toko Sewa Jaya"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="alamat_usaha">Alamat Usaha <span className="text-red-500">*</span></Label>
                    <Input
                      id="alamat_usaha"
                      name="alamat_usaha"
                      value={form.alamat_usaha}
                      onChange={handleChange}
                      placeholder="Jl. Soekarno-Hatta No.1, Balikpapan"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nomor_telepon">Nomor Telepon <span className="text-red-500">*</span></Label>
                    <Input
                      id="nomor_telepon"
                      name="nomor_telepon"
                      value={form.nomor_telepon}
                      onChange={handleChange}
                      placeholder="08123456789"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nomor ini akan digunakan penyewa untuk konfirmasi pembayaran
                    </p>
                  </div>

                  {/* Map Picker — Lokasi Usaha */}
                  <div>
                    <Label className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Titik Lokasi Usaha di Peta <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500 mb-3">
                      Klik pada peta untuk menandai lokasi usaha Anda. 
                      Koordinat ini digunakan penyewa untuk menemukan tempat pengambilan barang.
                    </p>
                    <MapPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={({ latitude, longitude }) =>
                        setForm(p => ({ ...p, latitude, longitude }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Info Pembayaran */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Setup metode pembayaran agar penyewa dapat melakukan transfer ke akun Anda.
                </p>
                <Separator />

                <div className="space-y-4">
                  {/* Nomor Rekening */}
                  <div>
                    <Label htmlFor="nomor_rekening">Nomor Rekening Bank</Label>
                    <Input
                      id="nomor_rekening"
                      name="nomor_rekening"
                      value={form.nomor_rekening}
                      onChange={handleChange}
                      placeholder="BCA 1234567890 a/n Toko Sewa Jaya"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: [Bank] [Nomor] a/n [Nama Pemilik]
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span>ATAU</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  {/* QRIS */}
                  <div>
                    <Label>Foto QRIS (Opsional)</Label>
                    <div className="mt-2">
                      {form.foto_qris ? (
                        <div className="relative">
                          <img 
                            src={form.foto_qris} 
                            alt="QRIS" 
                            className="w-full max-w-sm rounded-lg border-2 border-gray-300 mx-auto" 
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setForm(p => ({ ...p, foto_qris: "" }))}
                          >
                            Hapus
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Upload foto QRIS Anda</p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && compressAndSetQRIS(e.target.files[0])}
                            disabled={uploading}
                          />
                          {uploading && <p className="text-sm text-blue-600 mt-2">Memproses...</p>}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      QRIS memudahkan penyewa untuk scan dan bayar langsung dari aplikasi e-wallet
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Penting!</p>
                    <p>
                      Isi minimal satu metode pembayaran (rekening atau QRIS). 
                      Anda bisa menambahkan keduanya untuk memberikan lebih banyak opsi kepada penyewa.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Selesai */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center py-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Setup Berhasil!</h3>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Profil usaha Anda sudah siap. Sekarang Anda bisa mulai menambahkan barang yang akan disewakan 
                  dan mengelola pesanan dari penyewa.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-xl mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-2">Langkah Selanjutnya:</h4>
                  <ul className="space-y-1 text-sm text-blue-800 list-disc list-inside">
                    <li>Tambahkan barang pertama Anda ke katalog</li>
                    <li>Atur harga sewa per hari dan stok ketersediaan</li>
                    <li>Kelola pesanan yang masuk dari penyewa</li>
                    <li>Verifikasi pembayaran dari penyewa</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <div>
                {currentStep > 1 && currentStep < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={saving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                )}
                {currentStep < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="ml-2"
                  >
                    Lewati
                  </Button>
                )}
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                disabled={saving || uploading}
              >
                {saving ? (
                  "Menyimpan..."
                ) : currentStep === 3 ? (
                  <>Ke Dashboard</>
                ) : (
                  <>
                    Lanjut
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
