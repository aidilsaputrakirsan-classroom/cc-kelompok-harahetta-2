import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { login as apiLogin, register as apiRegister, getMe, clearToken, setToken } from "../services/api"
import { toast } from "sonner"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore from localStorage on mount, then refresh from server
  useEffect(() => {
    const savedToken = localStorage.getItem("sewain_token")
    const savedUser = localStorage.getItem("sewain_user")
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setTokenState(savedToken)
        setToken(savedToken)
        setUser(parsedUser) // set cached data first so UI loads fast
        // Refresh from server to get latest is_verified, role, etc.
        getMe()
          .then((me) => {
            setUser(me)
            localStorage.setItem("sewain_user", JSON.stringify(me))
          })
          .catch(() => {
            // Token expired or invalid — logout
            clearToken()
            setTokenState(null)
            setUser(null)
            localStorage.removeItem("sewain_token")
            localStorage.removeItem("sewain_user")
            // Delay toast sedikit agar Toaster sudah mounted
            setTimeout(() => {
              toast.warning("Sesi habis, silakan login kembali", { id: "session-expired" })
            }, 100)
          })
          .finally(() => setLoading(false))
        return
      } catch {
        localStorage.removeItem("sewain_token")
        localStorage.removeItem("sewain_user")
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setUser(data.user)
    setTokenState(data.access_token)
    localStorage.setItem("sewain_token", data.access_token)
    localStorage.setItem("sewain_user", JSON.stringify(data.user))
    return data
  }, [])

  const handleRegister = useCallback(async (userData) => {
    const result = await apiRegister(userData)
    // Jangan auto-login — user harus verifikasi email dulu
    return result
  }, [])

  const handleLogout = useCallback(() => {
    clearToken()
    setUser(null)
    setTokenState(null)
    localStorage.removeItem("sewain_token")
    localStorage.removeItem("sewain_user")
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe()
      setUser(me)
      localStorage.setItem("sewain_user", JSON.stringify(me))
    } catch {
      handleLogout()
    }
  }, [handleLogout])

  // Role helpers
  const isAuthenticated = !!user && !!token
  const isSuperAdmin = user?.role === "super_admin"
  const isAdmin = user?.role === "admin" || user?.role === "super_admin"
  const isUser = user?.role === "user"
  const isVerified = user?.is_verified

  const value = {
    user, token, loading,
    isAuthenticated, isSuperAdmin, isAdmin, isUser, isVerified,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
