/**
 * ReviewList — daftar review dengan loading/empty state.
 *
 * Props:
 * - reviews    : ReviewResponse[]
 * - loading    : boolean
 * - showItem   : boolean
 * - emptyText  : string
 */
import ReviewCard from "./ReviewCard"
import { Skeleton } from "./ui/Skeleton"
import { MessageSquare } from "lucide-react"

export default function ReviewList({
  reviews = [],
  loading = false,
  showItem = false,
  emptyText = "Belum ada ulasan",
  className = "",
}) {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-border bg-card p-8 text-center ${className}`}>
        <div className="inline-flex w-12 h-12 rounded-2xl bg-secondary items-center justify-center mb-2">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((rv) => (
        <ReviewCard key={rv.id} review={rv} showItem={showItem} />
      ))}
    </div>
  )
}
