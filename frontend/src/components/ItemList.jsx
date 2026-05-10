import ItemCard from './ItemCard'
import { Package } from 'lucide-react'

/**
 * ItemList – menampilkan daftar item atau empty state.
 *
 * Props:
 *   items    – array item [{ id, name, description, price, quantity }]
 *   onEdit   – callback (item) => void
 *   onDelete – callback (id) => void
 *   loading  – tampilkan skeleton saat loading
 *   emptyMessage – pesan yang ditampilkan saat kosong
 */
export default function ItemList({
  items = [],
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'Belum ada barang yang ditambahkan.',
}) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="item-list-loading"
        aria-label="Memuat daftar barang"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 space-y-3 animate-pulse"
            aria-hidden="true"
          >
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        data-testid="item-list-empty"
        role="status"
        aria-live="polite"
      >
        <Package className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground" data-testid="empty-title">
          Tidak ada barang
        </h3>
        <p className="text-sm text-muted-foreground mt-1" data-testid="empty-message">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="item-list"
      aria-label={`Daftar barang (${items.length} item)`}
    >
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
