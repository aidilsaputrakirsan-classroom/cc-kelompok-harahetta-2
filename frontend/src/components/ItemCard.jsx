export default function ItemCard({ item, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4 flex flex-col gap-2">
      <h3 className="font-semibold text-foreground">{item.name}</h3>
      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}
      <p className="text-sm font-medium">
        Rp {item.price.toLocaleString('id-ID')}
      </p>
      {item.quantity !== undefined && (
        <p className="text-xs text-muted-foreground">Stok: {item.quantity}</p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onEdit(item)}
          className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}
