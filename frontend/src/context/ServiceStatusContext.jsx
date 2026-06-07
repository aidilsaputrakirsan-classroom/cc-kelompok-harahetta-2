import { createContext, useContext, useState, useCallback } from "react"

/**
 * ServiceStatusContext
 * --------------------
 * Global store untuk status service microservices.
 * Komponen yang mendeteksi error 503/504 bisa melapor ke sini
 * sehingga seluruh aplikasi bisa menampilkan UI yang sesuai.
 */
const ServiceStatusContext = createContext(null)

export function ServiceStatusProvider({ children }) {
  // Set of service names yang sedang down, e.g. "auth", "items", "rentals"
  const [downServices, setDownServices] = useState(new Set())

  /**
   * Tandai sebuah service sebagai tidak tersedia.
   * @param {string} serviceName - nama service (misal "auth", "payment")
   */
  const markServiceDown = useCallback((serviceName) => {
    setDownServices((prev) => {
      const next = new Set(prev)
      next.add(serviceName)
      return next
    })
  }, [])

  /**
   * Tandai sebuah service kembali normal (misalnya setelah retry berhasil).
   * @param {string} serviceName
   */
  const markServiceUp = useCallback((serviceName) => {
    setDownServices((prev) => {
      const next = new Set(prev)
      next.delete(serviceName)
      return next
    })
  }, [])

  /** Apakah service auth sedang down? */
  const isAuthDown = downServices.has("auth")

  /** Apakah ada service apapun yang sedang down? */
  const hasAnyServiceDown = downServices.size > 0

  /** Daftar nama service yang down (array) */
  const downServiceList = Array.from(downServices)

  const value = {
    downServices,
    downServiceList,
    isAuthDown,
    hasAnyServiceDown,
    markServiceDown,
    markServiceUp,
  }

  return (
    <ServiceStatusContext.Provider value={value}>
      {children}
    </ServiceStatusContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useServiceStatus() {
  const ctx = useContext(ServiceStatusContext)
  if (!ctx) throw new Error("useServiceStatus must be used within ServiceStatusProvider")
  return ctx
}
