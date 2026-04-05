import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useCallback } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Sidebar from "./components/Layout/Sidebar"
import ToastContainer from "./components/Toast"
import Spinner from "./components/Spinner"

// Pages
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import RentalPage from "./pages/RentalPage"
import MyRentalsPage from "./pages/MyRentalsPage"
import ProfilePage from "./pages/ProfilePage"
import AdminDashboard from "./pages/AdminDashboard"
import SuperAdminPanel from "./pages/SuperAdminPanel"

// ==================== TOAST HOOK ====================
function useToast() {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  return { toasts, addToast, removeToast }
}

// ==================== PROTECTED ROUTES ====================
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Spinner center size="lg" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isAdmin, isSuperAdmin, loading } = useAuth()
  if (loading) return <Spinner center size="lg" />
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { isSuperAdmin, loading } = useAuth()
  if (loading) return <Spinner center size="lg" />
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

// ==================== APP LAYOUT ====================
function AppLayout({ addToast }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          {/* User routes */}
          <Route path="/dashboard" element={<DashboardPage addToast={addToast} />} />
          <Route path="/rentals/new" element={<RequireAuth><RentalPage addToast={addToast} /></RequireAuth>} />
          <Route path="/rentals/my" element={<RequireAuth><MyRentalsPage addToast={addToast} /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage addToast={addToast} /></RequireAuth>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
          <Route path="/admin/rentals" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
          <Route path="/admin/profile" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />

          {/* Super Admin routes */}
          <Route path="/superadmin" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
          <Route path="/superadmin/users" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
          <Route path="/superadmin/categories" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
          <Route path="/superadmin/verifications" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
          <Route path="/superadmin/rentals" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// ==================== ROOT ====================
function AppContent() {
  const { toasts, addToast, removeToast } = useToast()
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage addToast={addToast} />
        } />
        <Route path="/*" element={
          isAuthenticated
            ? <AppLayout addToast={addToast} />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
