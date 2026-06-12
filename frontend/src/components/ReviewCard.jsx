/**
 * ReviewCard — kartu satu review/testimoni.
 *
 * Props:
 * - review : ReviewResponse
 * - showItem : boolean — tampilkan info barang (untuk daftar di profil toko)
 */
import { Link } from "react-router-dom"
import RatingStars from "./RatingStars"
import { Package } from "lucide-react"

function formatDate(d) {
  if (!d) return ""
  try {
    const date = new Date(d)
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

export default function ReviewCard({ review, showItem = false }) {
  if (!review) return null
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_nama || "U")}&background=0a6e4a&color=fff&size=80&bold=true`

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <img
          src={review.user_foto_profil || fallback}
          alt={review.user_nama || "User"}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-border flex-shrink-0"
          onError={(e) => { e.currentTarget.src = fallback }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold truncate">
              {review.user_nama || "Pengguna Sewain"}
            </span>
            <span className="text-xs text-muted-foreground">
              · {formatDate(review.created_at)}
            </span>
          </div>
          <RatingStars value={review.rating} size="sm" className="mt-1" />
        </div>
      </header>

      {review.komentar && (
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
          {review.komentar}
        </p>
      )}

      {showItem && review.item_nama && (
        <Link
          to={`/items/${review.item_id}`}
          className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          <span className="font-medium truncate">Untuk: {review.item_nama}</span>
        </Link>
      )}
    </article>
  )
}
