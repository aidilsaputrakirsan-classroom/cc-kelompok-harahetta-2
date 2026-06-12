/**
 * useTour — React hook untuk Driver.js
 * Menangani inisialisasi, auto-start, dan cleanup tour.
 */
import { useEffect, useRef, useCallback } from "react"
import { createTour, markTourDone, isTourDone } from "../lib/tour"

/**
 * @param {object} options
 * @param {string}   options.tourKey    - localStorage key (dari TOUR_KEYS)
 * @param {Array}    options.steps      - array step Driver.js
 * @param {boolean}  [options.autoStart=false]  - mulai otomatis saat halaman dibuka pertama kali
 * @param {number}   [options.delay=600]         - delay sebelum auto-start (ms)
 */
export function useTour({ tourKey, steps, autoStart = false, delay = 600 }) {
  const driverRef = useRef(null)

  const startTour = useCallback(() => {
    // Destroy existing tour if any
    if (driverRef.current) {
      try { driverRef.current.destroy() } catch {}
    }
    const d = createTour(steps, () => markTourDone(tourKey))
    driverRef.current = d
    d.drive()
  }, [steps, tourKey])

  // Auto-start sekali saja
  useEffect(() => {
    if (!autoStart) return
    if (isTourDone(tourKey)) return

    const timer = setTimeout(startTour, delay)
    return () => clearTimeout(timer)
  }, [autoStart, delay, tourKey, startTour])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { driverRef.current?.destroy() } catch {}
    }
  }, [])

  return { startTour }
}
