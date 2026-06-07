import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useCallback, useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { ServiceStatusProvider, useServiceStatus } from "./context/ServiceStatusContext"
import { Toaster, toast } from "sonner"
import Sidebar from "./components/Layout/Sidebar"
import UserLayout from "./components/Layout/UserLayout"
import Navbar from "./components/Layout/Navbar"
import { Loader2 } from "lucide-react"
import ChatbotWidget from "./components/ChatbotWidget"
import PresenceManager from "./components/PresenceManager"
import AuthDownBanner from "./components/AuthDownBanner"
import { checkAuthHealth } from "./services/api"

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
import ShopProfilePage from "./pages/ShopProfilePage"
import AdminOnboardingPage from "./pages/AdminOnboardingPage"
import AdminPaymentsPage from "./pages/AdminPaymentsPage"
import AboutPage from "./pages/AboutPage"
import VerifyEmailPage from "./pages/VerifyEmailPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ChatPage from "./pages/ChatPage"

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

/**
 * AppBanner
 * Membaca status service dan menampilkan AuthDownBanner jika diperlukan.
 * Dipisah ke komponen sendiri agar tidak re-render AppContent.
 */
function AppBanner() {
  const { isAuthDown, markServiceUp, downServiceList } = useServiceStatus()
  const [dismissed, setDismissed] = useState(false)

  const handleRetry = async () => {
    const result = await checkAuthHealth()
    if (result.healthy) {
      markServiceUp("auth")
      setDismissed(false)
      toast.success("Layanan berhasil terhubung kembali!", { id: "auth-restored" })
    } else {
      toast.warning("Layanan masih tidak tersedia, coba lagi nanti.", { id: "auth-still-down" })
    }
  }

  const showBanner = isAuthDown && !dismissed

  return (
    <AuthDownBanner
      show={showBanner}
      services={downServiceList}
      onDismiss={() => setDismissed(true)}
      onRetry={handleRetry}
    />
  )
}

// ── Shared layout for public pages: persistent Navbar ────────
const PUBLIC_NAV_LINKS = [
  { label: "Beranda", to: "/" },
  { label: "Katalog", to: "/catalog" },
  { label: "Tentang", to: "/about" },
  { label: "Mulai", to: "/login" },
]

function PublicLayout() {
  return (
    <>
      <Navbar links={PUBLIC_NAV_LINKS} />
      <Outlet />
    </>
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
            <Route path="/chat" element={<RequireAuth><ChatPage addToast={addToast} /></RequireAuth>} />
            <Route path="/chat/:roomId" element={<RequireAuth><ChatPage addToast={addToast} /></RequireAuth>} />
            <Route path="/items/:itemId" element={<ItemDetailPage addToast={addToast} />} />
            <Route path="/shops/:adminId" element={<ShopProfilePage addToast={addToast} />} />
            <Route path="/catalog" element={<CatalogPage addToast={addToast} />} />
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
        <Route path="/catalog" element={<CatalogPage addToast={addToast} />} />
        <Route path="/items/:itemId" element={<ItemDetailPage addToast={addToast} />} />
        <Route path="/shops/:adminId" element={<ShopProfilePage addToast={addToast} />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage addToast={addToast} /></RequireAuth>} />
        <Route path="/rentals/new" element={<RequireAuth><RentalPage addToast={addToast} /></RequireAuth>} />
        <Route path="/rentals/my" element={<RequireAuth><MyRentalsPage addToast={addToast} /></RequireAuth>} />
        <Route path="/payment/:rentalId" element={<RequireAuth><PaymentPage addToast={addToast} /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage addToast={addToast} /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><ChatPage addToast={addToast} /></RequireAuth>} />
        <Route path="/chat/:roomId" element={<RequireAuth><ChatPage addToast={addToast} /></RequireAuth>} />
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
      {/* Banner untuk service unavailable — sticky di atas semua konten */}
      <AppBanner />
      <Routes>
        {/* 
          Public layout: Landing, About, Login
          Catalog/Items: only shown here for guests; logged-in users get it in their own layout
        */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          {!isAuthenticated && (
            <>
              <Route path="catalog" element={<CatalogPage addToast={addToast} />} />
              <Route path="items/:itemId" element={<ItemDetailPage addToast={addToast} />} />
              <Route path="shops/:adminId" element={<ShopProfilePage addToast={addToast} />} />
            </>
          )}
          <Route path="login" element={
            isAuthenticated ? <Navigate to={homeRoute} replace /> : <LoginPage addToast={addToast} />
          } />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage addToast={addToast} />} />
          <Route path="reset-password" element={<ResetPasswordPage addToast={addToast} />} />
        </Route>
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

      {/* Floating Chatbot Widget — tampil di semua halaman */}
      {isAuthenticated && <ChatbotWidget />}

      {/* Presence WebSocket — kabari server bahwa user online di mana pun */}
      {isAuthenticated && <PresenceManager />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {/* ServiceStatusProvider harus di luar AuthProvider karena AuthProvider menggunakannya */}
        <ServiceStatusProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ServiceStatusProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
