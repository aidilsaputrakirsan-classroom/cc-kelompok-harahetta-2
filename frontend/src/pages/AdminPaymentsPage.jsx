import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Separator } from "../components/ui/Separator"
import { Input } from "../components/ui/Input"
import { 
  CreditCard, CheckCircle, XCircle, Clock, Search, 
  Eye, AlertTriangle, Calendar, Package, User as UserIcon
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function AdminPaymentsPage({ addToast }) {
  const { token } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, pending, completed, failed
  const [search, setSearch] = useState("")
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [viewingProof, setViewingProof] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/admin/payments?limit=100`
      if (filter !== "all") {
        url += `&status=${filter}`
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error("Gagal memuat pembayaran")
      }
      
      const data = await res.json()
      setPayments(data.payments || data || [])
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm("Konfirmasi pembayaran ini? Status rental akan diubah menjadi 'Sedang Disewa'.")) {
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "completed"
        })
      })

      if (!res.ok) {
        throw new Error("Gagal mengonfirmasi pembayaran")
      }

      addToast?.("Pembayaran berhasil dikonfirmasi", "success")
      loadPayments()
      setViewingProof(null)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectPayment = async (paymentId) => {
    const alasan = window.prompt("Alasan penolakan pembayaran:")
    if (!alasan) return

    setProcessing(true)
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "failed",
          catatan: `Ditolak: ${alasan}`
        })
      })

      if (!res.ok) {
        throw new Error("Gagal menolak pembayaran")
      }

      addToast?.("Pembayaran ditolak", "success")
      loadPayments()
      setViewingProof(null)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Lunas</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> Dibatalkan</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredPayments = payments.filter(payment => {
    const searchLower = search.toLowerCase()
    const userName = payment.user?.nama?.toLowerCase() || ""
    const itemName = payment.rental?.item?.nama?.toLowerCase() || ""
    const paymentId = payment.id.toString()
    
    return userName.includes(searchLower) || 
           itemName.includes(searchLower) || 
           paymentId.includes(searchLower)
  })

  const pendingCount = payments.filter(p => p.status === "pending" && p.bukti_pembayaran).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pembayaran</h1>
          <p className="text-gray-600 mt-1">Verifikasi bukti pembayaran dari penyewa</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
            <p className="text-sm font-semibold text-yellow-800">
              {pendingCount} pembayaran menunggu verifikasi
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama penyewa atau barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => { setFilter("all"); loadPayments() }}
                size="sm"
              >
                Semua
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => { setFilter("pending"); loadPayments() }}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                onClick={() => { setFilter("completed"); loadPayments() }}
                size="sm"
              >
                Lunas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada pembayaran</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Payment #{payment.id}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Penyewa */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>
                          <span className="font-medium">Penyewa:</span>{" "}
                          {payment.user?.nama || "Unknown"}
                        </span>
                      </div>

                      {/* Barang */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>
                          <span className="font-medium">Barang:</span>{" "}
                          {payment.rental?.item?.nama || "Unknown"}
                        </span>
                      </div>

                      {/* Jumlah */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>
                          <span className="font-medium">Jumlah:</span>{" "}
                          Rp {payment.jumlah?.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Metode */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>
                          <span className="font-medium">Metode:</span>{" "}
                          {payment.metode_pembayaran}
                        </span>
                      </div>
                    </div>

                    {payment.catatan && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        Catatan: {payment.catatan}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {payment.bukti_pembayaran && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingProof(payment)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat Bukti
                      </Button>
                    )}
                    
                    {payment.status === "pending" && payment.bukti_pembayaran && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(payment.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Konfirmasi
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={processing}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Proof Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProof(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bukti Pembayaran #{viewingProof.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingProof(null)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Penyewa:</span>
                  <span className="font-medium">{viewingProof.user?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Barang:</span>
                  <span className="font-medium">{viewingProof.rental?.item?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium">Rp {viewingProof.jumlah?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>{getStatusBadge(viewingProof.status)}</span>
                </div>
                {viewingProof.catatan && (
                  <div>
                    <span className="text-gray-600">Catatan:</span>
                    <p className="mt-1 text-gray-800 italic">{viewingProof.catatan}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Proof Image */}
              {viewingProof.bukti_pembayaran ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Foto Bukti Transfer:</p>
                  <img
                    src={viewingProof.bukti_pembayaran}
                    alt="Bukti Pembayaran"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Penyewa belum mengupload bukti pembayaran
                  </p>
                </div>
              )}

              {/* Actions */}
              {viewingProof.status === "pending" && viewingProof.bukti_pembayaran && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleConfirmPayment(viewingProof.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing ? "Memproses..." : "Konfirmasi Pembayaran"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectPayment(viewingProof.id)}
                    disabled={processing}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tolak Pembayaran
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
