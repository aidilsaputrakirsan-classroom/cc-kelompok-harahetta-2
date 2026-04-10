import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useCallback } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { Toaster, toast } from "sonner"
import Sidebar from "./components/Layout/Sidebar"
import { Loader2 } from "lucide-react"

import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import RentalPage from "./pages/RentalPage"
import MyRentalsPage from "./pages/MyRentalsPage"
import ProfilePage from "./pages/ProfilePage"
import AdminDashboard from "./pages/AdminDashboard"
import SuperAdminPanel from "./pages/SuperAdminPanel"

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
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { isSuperAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

function AppLayout({ addToast }) {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage addToast={addToast} />} />
            <Route path="/rentals/new" element={<RequireAuth><RentalPage addToast={addToast} /></RequireAuth>} />
            <Route path="/rentals/my" element={<RequireAuth><MyRentalsPage addToast={addToast} /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage addToast={addToast} /></RequireAuth>} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
            <Route path="/admin/rentals" element={<RequireAdmin><AdminDashboard addToast={addToast} /></RequireAdmin>} />
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

function AppContent() {
  const { addToast } = useToastHelper()
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage addToast={addToast} />
        } />
        <Route path="/404" element={<RedirectToStatic404 />} />
        <Route path="/*" element={
          isAuthenticated
            ? <AppLayout addToast={addToast} />
            : <Navigate to="/404" replace />
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
