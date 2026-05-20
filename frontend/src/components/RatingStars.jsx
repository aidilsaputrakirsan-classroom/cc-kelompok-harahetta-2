/**
 * RatingStars — display dan input mode untuk rating bintang.
 *
 * Props:
 * - value         : number (0..5, boleh desimal untuk display)
 * - onChange      : (n) => void   (kalau interactive)
 * - size          : "sm" | "md" | "lg"
 * - interactive   : boolean
 * - showValue     : tampilkan angka di samping bintang
 */
import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "../lib/utils"

const SIZE_CLASS = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-7 h-7",
}

export default function RatingStars({
  value = 0,
  onChange,
  size = "md",
  interactive = false,
  showValue = false,
  className = "",
}) {
  const [hover, setHover] = useState(0)
  const cls = SIZE_CLASS[size] || SIZE_CLASS.md
  const display = hover || value

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(display)
        const half = !filled && display > n - 1 && display < n
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(n)}
            className={cn(
              "relative transition-transform",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default",
            )}
            aria-label={`${n} bintang`}
          >
            <Star
              className={cn(
                cls,
                filled || half
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40",
              )}
              strokeWidth={1.75}
            />
            {half && (
              <Star
                className={cn(
                  cls,
                  "absolute inset-0 fill-amber-400 text-amber-400",
                )}
                strokeWidth={1.75}
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}
          </button>
        )
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-bold tabular-nums">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  )
}
