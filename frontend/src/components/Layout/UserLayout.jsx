import { useState } from "react"
import { Link, useLocation, useNavigate, Routes } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import {
  Home, User, LogOut, Menu, X, Package, ShoppingCart,
} from "lucide-react"

const NAV_LINKS = [
  { path: "/home",    label: "Beranda", icon: Home },
  { path: "/profile", label: "Profil",  icon: User },
]

function UserNavbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate("/"); setOpen(false) }

  const initial = (user?.nama || "U")[0].toUpperCase()
  const isActive = (path) => {
    if (path === "/catalog") return location.pathname.startsWith("/catalog")
    return location.pathname === path
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
          <img src="/sewainLogo.webp" alt="Sewain" className="w-8 h-8 rounded-xl object-cover" onError={(e) => { e.target.style.display="none" }} />
          <span className="font-bold text-lg text-slate-800">Sewain</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                isActive(path)
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right: sewa cepat + user chip + logout */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate("/rentals/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Sewa Sekarang
          </button>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initial}
            </div>
            <span className="text-sm text-slate-700 font-medium max-w-[120px] truncate">
              {user?.nama?.split(" ")[0]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                isActive(path)
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-50"
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
      )}
    </nav>
  )
}

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <UserNavbar />
      {/* pt-16 for fixed navbar height */}
      <main className="pt-16 max-w-7xl mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
