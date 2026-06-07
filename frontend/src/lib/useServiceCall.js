import { useState, useCallback } from "react"
import { isServiceUnavailableError } from "../services/api"
import { useServiceStatus } from "../context/ServiceStatusContext"

/**
 * useServiceCall
 * --------------
 * Custom hook untuk memanggil API dengan penanganan error 503/504 yang terintegrasi.
 * Secara otomatis:
 *  1. Mendeteksi ServiceUnavailableError
 *  2. Menandai service yang down ke ServiceStatusContext (global banner)
 *  3. Menyimpan state error dan loading secara lokal
 *  4. Menyediakan fungsi retry
 *
 * @param {Function} apiFn   - async function yang memanggil API
 * @param {string}   service - nama service untuk pelaporan (misal "auth", "items")
 * @returns {object} { data, loading, error, isUnavailable, execute, retry }
 *
 * Contoh penggunaan:
 * ```jsx
 * const { data, loading, error, isUnavailable, execute } = useServiceCall(fetchItems, "items")
 *
 * useEffect(() => { execute() }, [])
 *
 * if (isUnavailable) return <ServiceUnavailableError onRetry={retry} />
 * ```
 */
export function useServiceCall(apiFn, service = "unknown") {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUnavailable, setIsUnavailable] = useState(false)

  const { markServiceDown, markServiceUp } = useServiceStatus()

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      setIsUnavailable(false)

      try {
        const result = await apiFn(...args)
        setData(result)
        markServiceUp(service)   // berhasil — tandai service normal
        return result
      } catch (err) {
        if (isServiceUnavailableError(err)) {
          setIsUnavailable(true)
          markServiceDown(service) // tandai service down ke global context
        }
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFn, service, markServiceDown, markServiceUp]
  )

  /** Alias untuk re-run execute dengan argumen terakhir (atau tanpa argumen) */
  const retry = useCallback(() => execute(), [execute])

  return { data, loading, error, isUnavailable, execute, retry, setData }
}

export default useServiceCall
