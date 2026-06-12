import { AlertTriangle, RefreshCw, WifiOff, Clock } from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/utils"

/**
 * ServiceUnavailableError
 * -----------------------
 * Komponen error state yang ditampilkan ketika API mengembalikan status 503/504
 * atau saat terjadi network error yang menunjukkan service sedang down.
 *
 * Props:
 *  - title        : string   — judul error (default: "Layanan Tidak Tersedia")
 *  - message      : string   — pesan detail error
 *  - onRetry      : function — callback ketika user klik tombol "Coba Lagi"
 *  - retryLabel   : string   — teks tombol retry (default: "Coba Lagi")
 *  - compact      : boolean  — tampilan kecil untuk embedding di dalam section
 *  - className    : string   — tambahan class Tailwind
 *  - showIcon     : boolean  — tampilkan icon (default: true)
 *  - networkError : boolean  — jika true, tampilkan icon WiFi-off
 */
export default function ServiceUnavailableError({
  title = "Layanan Tidak Tersedia",
  message = "Server sedang tidak dapat diakses. Tim kami sedang bekerja untuk memulihkannya.",
  onRetry,
  retryLabel = "Coba Lagi",
  compact = false,
  className,
  showIcon = true,
  networkError = false,
}) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return
    setIsRetrying(true)
    setRetryCount((c) => c + 1)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 py-10 px-4 text-center",
          className
        )}
      >
        {/* Icon */}
        {showIcon && (
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-1">
            {networkError ? (
              <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        )}

        <div>
          <p className="font-semibold text-foreground text-sm">{title}</p>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">{message}</p>
        </div>

        {onRetry && (
          <button
            id="service-error-retry-compact"
            onClick={handleRetry}
            disabled={isRetrying}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <RefreshCw className={cn("w-3 h-3", isRetrying && "animate-spin")} />
            {isRetrying ? "Menghubungkan..." : retryLabel}
          </button>
        )}

        {retryCount > 0 && !isRetrying && (
          <p className="text-xs text-muted-foreground">
            <Clock className="inline w-3 h-3 mr-1" />
            Percobaan ke-{retryCount}
          </p>
        )}
      </div>
    )
  }

  /* ── Full-page / card variant ── */
  return (
    <div
      className={cn(
        "min-h-[420px] flex items-center justify-center p-6",
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        {/* Animated icon bubble */}
        {showIcon && (
          <div className="relative inline-flex mb-6">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shadow-lg">
              {networkError ? (
                <WifiOff className="w-9 h-9 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertTriangle className="w-9 h-9 text-amber-600 dark:text-amber-400" />
              )}
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Service Unavailable
          </span>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>

        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm mx-auto">
          {message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              id="service-error-retry-btn"
              onClick={handleRetry}
              disabled={isRetrying}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl",
                "bg-primary text-primary-foreground font-semibold text-sm",
                "hover:bg-primary/90 active:scale-95",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-md shadow-primary/20",
                "transition-all duration-200"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
              {isRetrying ? "Menghubungkan..." : retryLabel}
            </button>
          )}

          <button
            id="service-error-home-btn"
            onClick={() => (window.location.href = "/")}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl",
              "bg-secondary text-secondary-foreground font-semibold text-sm",
              "hover:bg-secondary/80 active:scale-95 border border-border",
              "transition-all duration-200"
            )}
          >
            🏠 Ke Beranda
          </button>
        </div>

        {retryCount > 0 && !isRetrying && (
          <p className="text-xs text-muted-foreground mt-4">
            <Clock className="inline w-3 h-3 mr-1" />
            Sudah dicoba {retryCount}× — jika masalah berlanjut, silakan hubungi tim Sewain.
          </p>
        )}
      </div>
    </div>
  )
}
