import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { fetchProfile, updateProfile } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { User, Upload, CheckCircle, ArrowRight, ArrowLeft, Clock } from "lucide-react"

export default function OnboardingPage({ addToast }) {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    nama_orang_tua: "",
    alamat: "",
    nomor_telepon: "",
    foto_ktp: "",
    foto_selfie_ktp: "",
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
        
        // Cek progress: jika sudah lengkap, skip ke step yang sesuai
        if (p.foto_ktp && p.foto_selfie_ktp && p.alamat) {
          setCurrentStep(3) // Langsung ke step menunggu verifikasi
        } else if (p.alamat && p.nomor_telepon) {
          setCurrentStep(2) // Ke step upload KTP
        }
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validasi step 1
      if (!form.alamat || !form.nomor_telepon) {
        addToast?.("Harap lengkapi alamat dan nomor telepon", "error")
        return
      }
      
      // Save step 1 data
      setSaving(true)
      try {
        const payload = {
          nama_orang_tua: form.nama_orang_tua,
          alamat: form.alamat,
          nomor_telepon: form.nomor_telepon,
        }
        const updated = await updateProfile(payload)
        setProfile(updated)
        addToast?.("Data diri berhasil disimpan", "success")
        setCurrentStep(2)
      } catch (err) {
        addToast?.(err.message, "error")
      } finally {
        setSaving(false)
      }
    } else if (currentStep === 2) {
      // Validasi step 2
      if (!form.foto_ktp || !form.foto_selfie_ktp) {
        addToast?.("Harap upload foto KTP dan selfie dengan KTP", "error")
        return
      }
      
      // Save step 2 data
      setSaving(true)
      try {
        const payload = {
          foto_ktp: form.foto_ktp,
          foto_selfie_ktp: form.foto_selfie_ktp,
        }
        const updated = await updateProfile(payload)
        setProfile(updated)
        await refreshUser()
        addToast?.("Dokumen berhasil diunggah", "success")
        setCurrentStep(3)
      } catch (err) {
        addToast?.(err.message, "error")
      } finally {
        setSaving(false)
      }
    } else if (currentStep === 3) {
      // Selesai onboarding, redirect ke dashboard
      navigate("/home")
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    navigate("/home")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
            <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Data Diri</span>
            <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>Upload KTP</span>
            <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>Verifikasi</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <><User className="w-6 h-6" /> Lengkapi Data Diri</>}
              {currentStep === 2 && <><Upload className="w-6 h-6" /> Upload Dokumen Identitas</>}
              {currentStep === 3 && <><CheckCircle className="w-6 h-6" /> Menunggu Verifikasi</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Data Diri */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Lengkapi data diri Anda untuk memulai. Informasi ini akan digunakan untuk proses verifikasi.
                </p>
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nama_orang_tua">Nama Orang Tua / Wali (Opsional)</Label>
                    <Input
                      id="nama_orang_tua"
                      name="nama_orang_tua"
                      value={form.nama_orang_tua}
                      onChange={handleChange}
                      placeholder="Nama lengkap orang tua/wali"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alamat">Alamat Lengkap <span className="text-red-500">*</span></Label>
                    <Input
                      id="alamat"
                      name="alamat"
                      value={form.alamat}
                      onChange={handleChange}
                      placeholder="Jl. Contoh No.123, Kota, Provinsi"
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
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload KTP */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Upload foto KTP dan foto selfie Anda bersama KTP untuk verifikasi identitas.
                </p>
                <Separator />

                <div className="space-y-4">
                  {/* Foto KTP */}
                  <div>
                    <Label>Foto KTP <span className="text-red-500">*</span></Label>
                    <div className="mt-2">
                      {form.foto_ktp ? (
                        <div className="relative">
                          <img 
                            src={form.foto_ktp} 
                            alt="KTP" 
                            className="w-full max-w-md rounded-lg border-2 border-gray-300" 
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setForm(p => ({ ...p, foto_ktp: "" }))}
                          >
                            Hapus
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Upload foto KTP Anda</p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && compressAndSet(e.target.files[0], "foto_ktp")}
                            disabled={uploading.foto_ktp}
                          />
                          {uploading.foto_ktp && <p className="text-sm text-blue-600 mt-2">Memproses...</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Foto Selfie dengan KTP */}
                  <div>
                    <Label>Foto Selfie dengan KTP <span className="text-red-500">*</span></Label>
                    <div className="mt-2">
                      {form.foto_selfie_ktp ? (
                        <div className="relative">
                          <img 
                            src={form.foto_selfie_ktp} 
                            alt="Selfie dengan KTP" 
                            className="w-full max-w-md rounded-lg border-2 border-gray-300" 
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setForm(p => ({ ...p, foto_selfie_ktp: "" }))}
                          >
                            Hapus
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Upload foto selfie dengan KTP</p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && compressAndSet(e.target.files[0], "foto_selfie_ktp")}
                            disabled={uploading.foto_selfie_ktp}
                          />
                          {uploading.foto_selfie_ktp && <p className="text-sm text-blue-600 mt-2">Memproses...</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Menunggu Verifikasi */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center py-8">
                <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Dokumen Anda Sedang Diverifikasi</h3>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Terima kasih telah melengkapi profil Anda! Dokumen identitas Anda sedang dalam proses verifikasi 
                  oleh tim Super Admin. Proses ini biasanya memakan waktu 1-2 hari kerja.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-xl mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-2">Status Verifikasi:</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Data diri telah dilengkapi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Dokumen identitas telah diunggah</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span>Menunggu verifikasi dari Super Admin</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Anda bisa mulai browsing katalog barang, namun untuk mengajukan sewa Anda perlu menunggu 
                  hingga verifikasi disetujui.
                </p>
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
                disabled={saving || uploading.foto_ktp || uploading.foto_selfie_ktp}
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
