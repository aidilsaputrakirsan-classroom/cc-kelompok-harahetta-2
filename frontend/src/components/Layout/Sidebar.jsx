/**
 * Sidebar — Admin & SuperAdmin layout
 * Forest dark · accent hijau emerald.
 */
import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, LayoutDashboard, User, Store, Crown,
  LogOut, ChevronLeft, Menu, X, Home, BookOpen, MessageCircle,
} from "lucide-react"
import ThemeToggle from "../ui/ThemeToggle"
import Avatar from "../ui/Avatar"
import { fetchChatUnreadCount } from "../../services/chat"

const NAV_USER = [
  { path: "/home",    label: "Beranda", icon: Home },
  { path: "/catalog", label: "Katalog", icon: BookOpen },
  { path: "/chat",    label: "Pesan",   icon: MessageCircle },
  { path: "/profile", label: "Profil",  icon: User },
]

const NAV_ADMIN = [
  { path: "/dashboard",       label: "Katalog",     icon: LayoutDashboard },
  { path: "/admin/dashboard", label: "Admin panel", icon: Store },
  { path: "/chat",            label: "Pesan",       icon: MessageCircle },
  { path: "/profile",         label: "Profil",      icon: User },
]

const NAV_SUPER = [
  { path: "/dashboard",  label: "Katalog",     icon: LayoutDashboard },
  { path: "/superadmin", label: "Super admin", icon: Crown },
  { path: "/chat",       label: "Pesan",       icon: MessageCircle },
  { path: "/profile",    label: "Profil",      icon: User },
]

export default function Sidebar() {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Poll unread count tiap 20 detik selagi user login
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await fetchChatUnreadCount()
        if (alive) setUnread(Number(data?.unread || 0))
      } catch { /* ignore */ }
    }
    load()
    const t = setInterval(load, 20000)
    return () => { alive = false; clearInterval(t) }
  }, [location.pathname])

  const nav = isSuperAdmin ? NAV_SUPER : isAdmin ? NAV_ADMIN : NAV_USER
  const initial = (user?.nama || "U")[0].toUpperCase()

  const handleNav = (path) => { navigate(path); setMobileOpen(false) }
  const handleLogout = () => { logout(); navigate("/") }

  const NavList = (
    <nav className="flex-1 p-3 space-y-1">
      {nav.map((item) => {
        const active = location.pathname === item.path ||
          (item.path === "/dashboard" && location.pathname.startsWith("/dashboard")) ||
          (item.path === "/chat" && location.pathname.startsWith("/chat"))
        const showBadge = item.path === "/chat" && unread > 0
        return (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <span className="relative inline-flex">
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {showBadge && collapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </span>
            {!collapsed && <span>{item.label}</span>}
            {showBadge && !collapsed && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  const SidebarBody = (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="p-4 pb-3">
        <Link to={isAdmin || isSuperAdmin ? "/dashboard" : "/home"} className="flex items-center gap-2.5 group">
          <img
            src="/sewainLogo.webp"
            alt="Sewain"
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
            onError={(e) => {
              e.target.style.display = "none"
              e.target.nextSibling.style.display = "flex"
            }}
          />
          <div className="hidden w-9 h-9 rounded-xl bg-sidebar-primary items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-tight text-sidebar-foreground">
              Sewain
            </span>
          )}
        </Link>
      </div>

      {/* User block */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-sidebar-accent border border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user?.foto_profil}
              name={user?.nama}
              size={36}
              className="ring-2 ring-sidebar-primary/30"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{user?.nama}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">
                {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "User"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      {!collapsed && (
        <div className="px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/45">
          Menu
        </div>
      )}

      {NavList}

      {/* Footer */}
      <div className="p-3 mt-auto border-t border-sidebar-border space-y-1">
        {!collapsed && (
          <div className="px-2 pb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/45">Tema</span>
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-2xl bg-card border border-border shadow-soft"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              aria-label="Tutup menu"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-72 h-full"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-sidebar-accent text-sidebar-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              {SidebarBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop */}
      <aside
        className={cn(
          "hidden md:block self-stretch border-r border-sidebar-border transition-[width] duration-200 relative flex-shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {SidebarBody}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center shadow-soft hover:bg-muted transition-colors"
          aria-label={collapsed ? "Perlebar sidebar" : "Ciutkan sidebar"}
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  )
}
