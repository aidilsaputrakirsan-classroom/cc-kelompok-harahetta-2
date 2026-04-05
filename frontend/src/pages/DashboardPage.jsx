import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import ItemCard from "../components/ItemCard"
import Spinner from "../components/Spinner"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import { fetchItems, fetchCategories } from "../services/api"

export default function DashboardPage({ addToast }) {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const LIMIT = 12

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { search, skip: page * LIMIT, limit: LIMIT }
      if (categoryId) params.category_id = categoryId
      if (statusFilter) params.status = statusFilter
      const data = await fetchItems(params)
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, statusFilter, page, addToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}) }, [])

  const handleSearch = (e) => { e.preventDefault(); setPage(0); load() }

  const isAdminRole = isAdmin || isSuperAdmin

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="page-title">
              {isAdminRole ? "📦 Katalog Barang" : "🔍 Temukan Barang"}
            </h1>
            <p className="page-subtitle">
              {isAdminRole ? `Total ${total} barang di platform` : `Hallo, ${user?.nama}! Cari barang yang ingin disewa`}
            </p>
          </div>
          {isAdminRole && (
            <Button variant="primary" onClick={() => navigate("/admin/dashboard")}>
              ➕ Kelola Barang
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "rgba(30,41,59,0.6)", border: "1px solid rgba(148,163,184,0.1)",
        borderRadius: "16px", padding: "16px 20px", marginBottom: "24px",
        backdropFilter: "blur(12px)", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
      }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "200px" }}>
          <input
            id="search-items"
            className="form-input"
            placeholder="🔍 Cari nama atau deskripsi barang..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" variant="primary" size="md">Cari</Button>
        </form>

        <select id="filter-category" className="form-select" value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0) }} style={{ width: "auto", minWidth: "160px" }}>
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
        </select>

        <select id="filter-status" className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} style={{ width: "auto", minWidth: "150px" }}>
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="rented">Disewa</option>
          <option value="unavailable">Tidak Tersedia</option>
        </select>

        {(search || categoryId || statusFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(""); setStatusFilter(""); setPage(0) }}>
            ✕ Reset
          </Button>
        )}
      </div>

      {/* Items grid */}
      {loading ? (
        <Spinner center size="lg" />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>Tidak ada barang ditemukan</h3>
          <p>Coba ubah filter pencarian atau kata kunci</p>
        </div>
      ) : (
        <>
          <div className="grid-auto">
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                role={user?.role}
                onRent={() => navigate(`/rentals/new?item=${item.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "32px" }}>
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                ← Sebelumnya
              </Button>
              <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
                Hal. {page + 1} / {Math.ceil(total / LIMIT)} ({total} barang)
              </span>
              <Button variant="secondary" size="sm" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
                Selanjutnya →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
