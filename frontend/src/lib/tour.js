/**
 * tour.js — Konfigurasi utama Driver.js untuk Sewain
 * Tema disesuaikan dengan design system emerald hijau.
 */
import { driver } from "driver.js"

/** Buat instance driver dengan tema Sewain */
export function createTour(steps, onDestroy) {
  return driver({
    showProgress:       true,
    showButtons:        ["next", "previous", "close"],
    nextBtnText:        "Lanjut →",
    prevBtnText:        "← Kembali",
    doneBtnText:        "Selesai ✓",
    progressText:       "{{current}} dari {{total}}",
    allowClose:         true,
    overlayOpacity:     0.55,
    smoothScroll:       true,
    animate:            true,
    stagePadding:       8,
    stageRadius:        14,
    popoverClass:       "sewain-tour-popover",
    onDestroyed:        () => { onDestroy?.() },
    steps,
  })
}

/** Kunci localStorage per halaman */
export const TOUR_KEYS = {
  landing:   "sewain_tour_landing_done",
  catalog:   "sewain_tour_catalog_done",
  dashboard: "sewain_tour_dashboard_done",
  rental:    "sewain_tour_rental_done",
  profile:   "sewain_tour_profile_done",
  itemDetail:"sewain_tour_item_detail_done",
}

export function markTourDone(key) {
  try { localStorage.setItem(key, "1") } catch {}
}

export function isTourDone(key) {
  try { return !!localStorage.getItem(key) } catch { return false }
}

export function resetTour(key) {
  try { localStorage.removeItem(key) } catch {}
}
