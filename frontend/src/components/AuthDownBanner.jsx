import { useState } from "react"
import { AlertTriangle, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * AuthDownBanner
 * --------------
 * Banner sticky di bagian atas halaman yang tampil ketika layanan autentikasi
 * sedang tidak tersedia. Memberitahu user bahwa beberapa fitur mungkin terbatas.
 *
 * Props:
 *  - show        : boolean   — apakah banner harus ditampilkan
 *  - onDismiss   : function  — callback ketika user menutup banner
 *  - onRetry     : function  — callback ketika user klik "Coba Hubungkan Ulang"
 *  - services    : string[]  — daftar nama service yang down (opsional, untuk detail)
 */
export default function AuthDownBanner({ show, onDismiss, onRetry, services = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // Jika belum pernah show dan sekarang pun tidak show, tidak perlu render apapun
  if (!show) return null

  const handleDismiss = () => {
    setTimeout(() => onDismiss?.(), 200)
  }

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await onRetry?.()
    } finally {
      setRetrying(false)
    }
  }

  const serviceLabels = {
    auth: "Autentikasi",
    payment: "Pembayaran",
    items: "Katalog Barang",
    rentals: "Penyewaan",
    chat: "Chat",
    notification: "Notifikasi",
  }

  const downNames = services.map((s) => serviceLabels[s] || s).filter(Boolean)

  return (
    <div
      role="alert"
      aria-live="polite"
      id="auth-down-banner"
      className="w-full z-50"
    >
      <div className="bg-amber-500 dark:bg-amber-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-100" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white leading-snug">
                  ⚠️ Some features temporarily unavailable
                </p>
                <span className="text-amber-100 text-xs hidden sm:inline">·</span>
                <p className="text-amber-100 text-xs hidden sm:block">
                  Beberapa fitur mungkin tidak berfungsi sementara.
                </p>
              </div>

              {/* Mobile: expandable detail */}
              {expanded && (
                <div className="mt-2 text-xs text-amber-100 space-y-1">
                  <p>
                    Layanan berikut sedang mengalami gangguan dan tim kami sedang bekerja memulihkannya:
                  </p>
                  {downNames.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      {downNames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1">
                    Fitur yang memerlukan login atau transaksi mungkin terbatas untuk sementara.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {onRetry && (
                  <button
                    id="auth-banner-retry-btn"
                    onClick={handleRetry}
                    disabled={retrying}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold",
                      "underline underline-offset-2 text-white hover:text-amber-100",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      "transition-colors duration-150"
                    )}
                  >
                    <RefreshCw className={cn("w-3 h-3", retrying && "animate-spin")} />
                    {retrying ? "Menghubungkan..." : "Coba Hubungkan Ulang"}
                  </button>
                )}

                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="inline-flex items-center gap-1 text-xs text-amber-100 hover:text-white transition-colors duration-150"
                >
                  {expanded ? (
                    <>Sembunyikan <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Detail <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              id="auth-banner-dismiss-btn"
              onClick={handleDismiss}
              aria-label="Tutup banner"
              className="flex-shrink-0 p-0.5 rounded hover:bg-amber-400/40 transition-colors duration-150"
            >
              <X className="w-4 h-4 text-amber-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
