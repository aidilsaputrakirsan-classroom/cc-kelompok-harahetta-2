/**
 * ReviewSummary — kartu ringkasan: rata-rata + total + bar distribusi 5..1.
 *
 * Props:
 * - summary : { average, total, distribution: { "1": n, ..., "5": n } }
 */
import RatingStars from "./RatingStars"

export default function ReviewSummary({ summary, className = "" }) {
  const avg = Number(summary?.average ?? 0)
  const total = Number(summary?.total ?? 0)
  const dist = summary?.distribution || {}

  return (
    <div
      className={`rounded-3xl border border-border bg-card p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 ${className}`}
    >
      {/* Avg block */}
      <div className="flex flex-col items-center justify-center text-center md:border-r md:border-border md:pr-6">
        <span className="text-5xl font-bold tracking-tight tabular-nums">
          {avg.toFixed(1)}
        </span>
        <RatingStars value={avg} size="md" className="mt-2" />
        <span className="text-xs text-muted-foreground mt-1.5">
          {total} ulasan
        </span>
      </div>

      {/* Distribution */}
      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = Number(dist?.[String(star)] ?? 0)
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={star} className="grid grid-cols-[28px_1fr_44px] items-center gap-3 text-xs">
              <span className="font-semibold inline-flex items-center gap-1">
                {star}
              </span>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="tabular-nums text-muted-foreground text-right">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
