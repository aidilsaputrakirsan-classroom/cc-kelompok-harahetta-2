/**
 * UserLayout — Sewain
 * Top navbar khusus user yang sudah login.
 * Modern minimalist · konsisten dengan halaman publik.
 */
import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import ThemeToggle from "../ui/ThemeToggle"
import {
  Home, User, LogOut, Menu, X, ShoppingCart, BookOpen,
  ChevronDown, Package,
} from "lucide-react"

const NAV_LINKS = [
  { path: "/home",    label: "Dashboard", icon: Home },
  { path: "/catalog", label: "Katalog",   icon: BookOpen },
  { path: "/profile", label: "Profil",    icon: User },
]

function UserNavbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (!e.target.closest?.("[data-user-menu]")) setUserMenuOpen(false)
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [userMenuOpen])

  const handleLogout = () => {
    logout()
    navigate("/")
    setOpen(false)
    setUserMenuOpen(false)
  }

  const initial = (user?.nama || "U")[0].toUpperCase()

  const isActive = (path) => {
    if (path === "/catalog")
      return location.pathname.startsWith("/catalog") || location.pathname.startsWith("/items")
    return location.pathname === path
  }

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300",
        scrolled || open
          ? "bg-background/85 backdrop-blur-xl border-border/60"
          : "bg-background border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link to="/home" className="flex items-center gap-2.5 flex-shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            <img
              src="/sewainLogo.webp"
              alt="Sewain"
              className="w-9 h-9 rounded-xl object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
            <div className="hidden w-9 h-9 rounded-xl bg-primary items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
          </motion.div>
          <span className="font-bold text-lg tracking-tight">Sewain</span>
        </Link>

        {/* ── Desktop nav pills ── */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 rounded-full p-1 bg-muted/40 border border-border/60">
            {NAV_LINKS.map(({ path, label, icon: Icon }) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="user-active-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative w-3.5 h-3.5" />
                  <span className="relative">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Right cluster ── */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          <button
            onClick={() => navigate("/rentals/new")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Sewa baru
          </button>

          {/* User chip */}
          <div className="relative" data-user-menu>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="inline-flex items-center gap-2 bg-muted/40 hover:bg-muted border border-border/60 rounded-full px-2.5 py-1.5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <span className="text-sm font-medium max-w-[110px] truncate">
                {user?.nama?.split(" ")[0]}
              </span>
              <motion.span
                animate={{ rotate: userMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-soft overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold tracking-tight truncate">{user?.nama}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <User className="w-4 h-4" /> Profil saya
                    </Link>
                    <Link
                      to="/rentals/my"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Package className="w-4 h-4" /> Riwayat sewa
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden flex items-center gap-1.5">
          <ThemeToggle />
          <button
            className="p-2 rounded-full text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "m"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background border-t border-border"
          >
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-muted/40 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight truncate">{user?.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {NAV_LINKS.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive(path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}

              <button
                onClick={() => { navigate("/rentals/new"); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition mt-1"
              >
                <ShoppingCart className="w-4 h-4" /> Sewa baru
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-page text-foreground">
      <UserNavbar />
      <main className="pt-28 max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
