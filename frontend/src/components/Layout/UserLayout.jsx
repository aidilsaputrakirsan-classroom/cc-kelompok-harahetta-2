import { useState } from "react"
import { Link, useLocation, useNavigate, Routes } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, User, LogOut, Menu, X, ShoppingCart, BookOpen,
  ChevronDown, Bell, Package,
} from "lucide-react"

const NAV_LINKS = [
  { path: "/home",    label: "Beranda", icon: Home },
  { path: "/catalog", label: "Katalog",  icon: BookOpen },
  { path: "/profile", label: "Profil",   icon: User },
]

function UserNavbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate("/"); setOpen(false); setUserMenuOpen(false) }

  const initial = (user?.nama || "U")[0].toUpperCase()

  const isActive = (path) => {
    if (path === "/catalog") return location.pathname.startsWith("/catalog") || location.pathname.startsWith("/items")
    return location.pathname === path
  }

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm"
    >
      {/* Thin accent bar at top */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-4" style={{ height: "60px" }}>

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 flex-shrink-0 group">
          <motion.div whileHover={{ rotate: -8, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
            <img
              src="/sewainLogo.webp"
              alt="Sewain"
              className="w-8 h-8 rounded-xl object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                const fb = document.createElement("div")
                fb.className = "w-8 h-8 rounded-xl bg-primary flex items-center justify-center"
                e.target.parentNode.appendChild(fb)
              }}
            />
          </motion.div>
          <span className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">Sewain</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "text-primary bg-primary/8"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="active-underline"
                    className="absolute bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* Sewa cepat */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/rentals/new")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Sewa Sekarang
          </motion.button>

          {/* User chip with dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <span className="text-sm text-slate-700 font-medium max-w-[110px] truncate">
                {user?.nama?.split(" ")[0]}
              </span>
              <motion.span
                animate={{ rotate: userMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.nama}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4" /> Profil Saya
                    </Link>
                    <Link
                      to="/rentals/my"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      <Package className="w-4 h-4" /> Riwayat Sewa
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "open"}
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

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-white border-t border-slate-100"
          >
            <div className="px-4 py-3 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.nama}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
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
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}

              <button
                onClick={() => { navigate("/rentals/new"); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition mt-1"
              >
                <ShoppingCart className="w-4 h-4" /> Sewa Sekarang
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-red-50 transition"
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
    <div className="min-h-screen bg-[#f5f5f0]">
      <UserNavbar />
      <main className="pt-[60px] max-w-7xl mx-auto px-4 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
