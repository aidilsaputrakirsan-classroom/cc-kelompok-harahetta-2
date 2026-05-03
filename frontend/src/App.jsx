import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useCallback } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { Toaster, toast } from "sonner"
import Sidebar from "./components/Layout/Sidebar"
import UserLayout from "./components/Layout/UserLayout"
import { Loader2 } from "lucide-react"

import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import UserDashboard from "./pages/UserDashboard"
import CatalogPage from "./pages/CatalogPage"
import RentalPage from "./pages/RentalPage"
import PaymentPage from "./pages/PaymentPage"
import MyRentalsPage from "./pages/MyRentalsPage"
import ProfilePage from "./pages/ProfilePage"
import AdminDashboard from "./pages/AdminDashboard"
import SuperAdminPanel from "./pages/SuperAdminPanel"
import OnboardingPage from "./pages/OnboardingPage"
import ItemDetailPage from "./pages/ItemDetailPage"
import AdminOnboardingPage from "./pages/AdminOnboardingPage"
import AdminPaymentsPage from "./pages/AdminPaymentsPage"
import AboutPage from "./pages/AboutPage"

function RedirectToStatic404() {
  if (typeof window !== "undefined") {
    window.location.replace("/404.html")
  }
  return <LoadingScreen />
}

function useToastHelper() {
  const addToast = useCallback((message, type = "info") => {
    if (type === "success") toast.success(message)
    else if (type === "error") toast.error(message)
    else if (type === "warning") toast.warning(message)
    else toast.info(message)
  }, [])
  return { addToast }
}

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isAdmin, isSuperAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/home" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { isSuperAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isSuperAdmin) return <Navigate to="/home" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

// ── Layout for admin/superadmin: sidebar ─────────────────────
function AdminLayout({ addToast }) {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage addToast={addToast} />} />
            <Route path="/rentals/my" element={<RequireAuth><MyRentalsPage addToast={addToast} /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage addToast={addToast} /></RequireAuth>} />
            <Route path="/admin/onboarding" element={<RequireAdmin><AdminOnboardingPage addToast={addToast} /></RequireAdmin>} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
            <Route path="/admin/rentals" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
            <Route path="/admin/payments" element={<RequireAdmin><AdminPaymentsPage addToast={addToast} /></RequireAdmin>} />
            <Route path="/admin/profile" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
            <Route path="/superadmin" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
            <Route path="/superadmin/*" element={<RequireSuperAdmin><SuperAdminPanel addToast={addToast} /></RequireSuperAdmin>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── Layout for regular users: top navbar ─────────────────────
function UserAppLayout({ addToast }) {
  return (
    <UserLayout>
      <Routes>
        <Route path="/home" element={<RequireAuth><UserDashboard addToast={addToast} /></RequireAuth>} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage addToast={addToast} /></RequireAuth>} />
        <Route path="/rentals/new" element={<RequireAuth><RentalPage addToast={addToast} /></RequireAuth>} />
        <Route path="/rentals/my" element={<RequireAuth><MyRentalsPage addToast={addToast} /></RequireAuth>} />
        <Route path="/payment/:rentalId" element={<RequireAuth><PaymentPage addToast={addToast} /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage addToast={addToast} /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </UserLayout>
  )
}

function AppContent() {
  const { addToast } = useToastHelper()
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />

  const homeRoute = isAdmin || isSuperAdmin ? "/dashboard" : "/home"
  const isStaff = isAdmin || isSuperAdmin

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/catalog" element={<CatalogPage addToast={addToast} />} />
        <Route path="/items/:itemId" element={<ItemDetailPage addToast={addToast} />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={homeRoute} replace /> : <LoginPage addToast={addToast} />
        } />
        <Route path="/404" element={<RedirectToStatic404 />} />

        {/* Authenticated routes — split by role */}
        <Route path="/*" element={
          !isAuthenticated
            ? <Navigate to="/login" replace />
            : isStaff
              ? <AdminLayout addToast={addToast} />
              : <UserAppLayout addToast={addToast} />
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
