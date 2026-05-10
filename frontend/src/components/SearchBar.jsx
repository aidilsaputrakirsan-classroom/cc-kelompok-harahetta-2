import { Search, X } from 'lucide-react'

/**
 * SearchBar – komponen pencarian reusable.
 *
 * Props:
 *   value       – nilai input saat ini (controlled)
 *   onChange    – callback (newValue: string) => void
 *   onSubmit    – callback () => void, dipanggil saat form disubmit
 *   onClear     – callback () => void, dipanggil saat tombol clear diklik
 *   placeholder – placeholder text (default: "Cari barang...")
 *   disabled    – nonaktifkan input & tombol
 */
export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Cari barang...',
  disabled = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.()
  }

  const handleClear = () => {
    onChange?.('')
    onClear?.()
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex gap-2 w-full"
      data-testid="search-form"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          role="searchbox"
          aria-label="Cari barang"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-50"
          data-testid="search-input"
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="search-clear-btn"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition disabled:opacity-50"
        data-testid="search-submit-btn"
      >
        Cari
      </button>
    </form>
  )
}
