/**
 * Avatar — Sewain
 * Tampilkan foto_profil kalau ada, fallback ke inisial nama.
 */
import { cn } from "../../lib/utils"

export default function Avatar({
  src,
  name,
  size = 40,
  className,
  rounded = "rounded-full",
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?"
  const px = typeof size === "number" ? `${size}px` : size

  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className={cn(rounded, "object-cover flex-shrink-0", className)}
        style={{ width: px, height: px }}
        onError={(e) => {
          // Fallback ke avatar inisial kalau src error
          e.currentTarget.replaceWith(
            Object.assign(document.createElement("div"), {
              className: `${rounded} bg-primary/15 text-primary flex items-center justify-center font-bold flex-shrink-0`,
              textContent: initial,
              style: `width:${px};height:${px};font-size:${typeof size === "number" ? size * 0.4 : 16}px`,
            })
          )
        }}
      />
    )
  }
  return (
    <div
      className={cn(
        rounded,
        "bg-primary/15 text-primary flex items-center justify-center font-bold flex-shrink-0",
        className
      )}
      style={{
        width: px,
        height: px,
        fontSize: typeof size === "number" ? size * 0.4 : 16,
      }}
      aria-hidden
    >
      {initial}
    </div>
  )
}
