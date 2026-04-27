import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchProfile } from "../services/api"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/Badge"
import { Separator } from "../components/ui/separator"
import { 
  ArrowLeft, Package, DollarSign, Tag, CheckCircle, 
  XCircle, AlertCircle, User, Store 
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function ItemDetailPage({ addToast }) {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [item, setItem] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch item detail - publik, tidak perlu auth
        const itemRes = await fetch(`${API_URL}/items/${itemId}`)
        if (!itemRes.ok) {
          throw new Error("Barang tidak ditemukan")
        }
        const itemData = await itemRes.json()
        setItem(itemData)

        // Fetch user profile jika sudah login
        if (isAuthenticated) {
          try {
            const profileData = await fetchProfile()
            setProfile(profileData)
          } catch (err) {
            console.error("Gagal memuat profil:", err)
          }
        }
      } catch (err) {
        addToast?.(err.message, "error")
        navigate("/catalog")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [itemId, isAuthenticated])

  const handleRentClick = () => {
    if (!isAuthenticated) {
      addToast?.("Silakan login terlebih dahulu", "info")
      navigate("/login")
      return
    }

    // Cek apakah user sudah diverifikasi
    if (!profile || profile.status_verifikasi !== "disetujui") {
      addToast?.(
        "Anda perlu melengkapi profil dan menunggu verifikasi identitas sebelum dapat menyewa barang",
        "warning"
      )
      navigate("/profile")
      return
    }

    // Redirect ke form ajukan sewa
    navigate(`/rentals/new?itemId=${itemId}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800"
      case "rented": return "bg-red-100 text-red-800"
      case "unavailable": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "available": return "Tersedia"
      case "rented": return "Sedang Disewa"
      case "unavailable": return "Tidak Tersedia"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail barang...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Barang Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-4">Barang yang Anda cari tidak tersedia.</p>
            <Button onClick={() => navigate("/catalog")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Katalog
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <Card className="overflow-hidden">
              {item.foto_url ? (
                <img
                  src={item.foto_url}
                  alt={item.nama}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{item.nama}</CardTitle>
                    {item.category && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>{item.category.nama}</span>
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Harga */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">Harga Sewa</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">
                        Rp {item.harga_per_hari?.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-blue-700">per hari</p>
                    </div>
                  </div>
                </div>

                {/* Stok */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Stok Tersedia</span>
                  <span className="font-semibold text-gray-900">{item.stok} unit</span>
                </div>

                {/* Deskripsi */}
                {item.deskripsi && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Deskripsi</h3>
                      <p className="text-gray-700 leading-relaxed">{item.deskripsi}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Verification Warning */}
                {isAuthenticated && profile && profile.status_verifikasi !== "disetujui" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Verifikasi Diperlukan</p>
                      <p>
                        Untuk menyewa barang ini, Anda perlu melengkapi profil dan menunggu 
                        verifikasi identitas dari admin.
                      </p>
                      <Link to="/profile" className="text-yellow-900 underline font-medium mt-2 inline-block">
                        Lengkapi Profil
                      </Link>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleRentClick}
                  disabled={item.status !== "available" || item.stok === 0}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  {item.status !== "available" || item.stok === 0 ? (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      Tidak Tersedia
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Ajukan Sewa Sekarang
                    </>
                  )}
                </Button>

                {!isAuthenticated && (
                  <p className="text-center text-sm text-gray-600">
                    Belum punya akun? <Link to="/login" className="text-blue-600 hover:underline font-medium">Login atau Daftar</Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Informasi Penyedia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Barang ini disediakan oleh mitra terpercaya kami. 
                  Semua transaksi dijamin aman oleh platform Sewain.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
