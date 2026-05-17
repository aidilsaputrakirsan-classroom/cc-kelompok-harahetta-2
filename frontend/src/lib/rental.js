/**
 * Util perhitungan deadline rental.
 *
 * Aturan:
 * 1. Jika rental punya `due_at` (sudah dikonfirmasi pickup oleh admin) →
 *    deadline aktual = due_at (datetime UTC presisi detik).
 * 2. Fallback untuk rental lama (sebelum kolom due_at ada) atau yang belum
 *    pickup: gunakan akhir hari `tanggal_selesai` di timezone lokal user.
 *    Hindari `new Date("YYYY-MM-DD")` karena di-parse sebagai UTC midnight
 *    dan menggeser deadline 7-8 jam untuk user Indonesia.
 */

/**
 * Konversi `tanggal_selesai` (string "YYYY-MM-DD") ke akhir hari lokal user.
 * Mengembalikan Date di 23:59:59.999 lokal.
 */
export function endOfLocalDay(dateStr) {
  if (!dateStr) return null
  // Pastikan format yyyy-mm-dd; abaikan kalau sudah datetime ISO.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!m) {
    const d = new Date(dateStr)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const [, y, mo, d] = m
  return new Date(Number(y), Number(mo) - 1, Number(d), 23, 59, 59, 999)
}

/**
 * Hitung Date deadline dari objek rental.
 * @param {{ due_at?: string|null, tanggal_selesai?: string|null }} rental
 * @returns {Date|null}
 */
export function getRentalDeadline(rental) {
  if (!rental) return null
  if (rental.due_at) {
    const d = new Date(rental.due_at)
    if (!Number.isNaN(d.getTime())) return d
  }
  if (rental.tanggal_selesai) return endOfLocalDay(rental.tanggal_selesai)
  return null
}

/**
 * Format ringkas Date deadline → "18 Mei 23:00" untuk subtitle UI.
 */
export function formatDeadline(date) {
  if (!date) return ""
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
