/**
 * TourButton — Tombol "Panduan" floating yang muncul di pojok kanan bawah.
 * Sesuai design system Sewain (emerald + white).
 */
import { HelpCircle } from "lucide-react"

export default function TourButton({ onClick, label = "Panduan" }) {
  return (
    <button
      id="tour-trigger-btn"
      onClick={onClick}
      aria-label="Mulai panduan penggunaan"
      className="
        fixed bottom-6 right-6 z-40
        flex items-center gap-2
        px-4 py-2.5
        rounded-full
        bg-primary text-primary-foreground
        shadow-lg hover:shadow-xl
        text-sm font-semibold
        transition-all duration-300
        hover:scale-105 hover:bg-primary/90
        border border-primary/20
      "
    >
      <HelpCircle className="w-4 h-4" />
      {label}
    </button>
  )
}
