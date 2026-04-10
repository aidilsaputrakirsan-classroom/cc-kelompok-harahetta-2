import { useState, useEffect, useCallback } from "react"
import { fetchMyRentals } from "../services/api"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { StatusBadge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import { ClipboardList, ArrowLeft, ArrowRight, Calendar, Package } from "lucide-react"

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "disetujui", label: "Disetujui" },
  { value: "sedang_disewa", label: "Berlangsung" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
]

function RentalCard({ rental }) {
  const item = rental.item
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {item?.foto_url && (
            <img src={item.foto_url} alt={item.nama} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.target.style.display = "none" }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground">{item?.nama || `Item #${rental.item_id}`}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(rental.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(rental.tanggal_selesai).toLocaleDateString("id-ID")}
                </div>
              </div>
              <StatusBadge status={rental.status} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-primary">{formatPrice(rental.total_harga)}</span>
              {rental.catatan && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{rental.catatan}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyRentalsPage({ addToast }) {
  const [rentals, setRentals] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const LIMIT = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMyRentals({ status: statusFilter || undefined, skip: page * LIMIT, limit: LIMIT })
      setRentals(data.rentals)
      setTotal(data.total)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, addToast])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sewa Saya</h1>
        <p className="text-muted-foreground mt-1">Pantau semua transaksi penyewaan Anda</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(f.value); setPage(0) }}
            className="rounded-full"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Belum ada transaksi sewa</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter ? `Tidak ada sewa dengan status "${statusFilter}"` : "Mulai sewa barang dari katalog!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {rentals.map(r => <RentalCard key={r.id} rental={r} />)}
          </div>
          {total > LIMIT && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Hal. {page + 1} / {Math.ceil(total / LIMIT)}
              </span>
              <Button variant="outline" size="sm" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
                Selanjutnya <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
