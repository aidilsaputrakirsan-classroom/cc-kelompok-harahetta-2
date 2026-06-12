/**
 * UserLayout — Sewain
 * Top navbar khusus user yang sudah login.
 * Modern minimalist · konsisten dengan halaman publik.
 */
import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import ThemeToggle from "../ui/ThemeToggle"
import {
  Home, User, LogOut, Menu, X, ShoppingCart, BookOpen,
  ChevronDown, Package, MessageCircle,
} from "lucide-react"
import Avatar from "../ui/Avatar"
import { fetchChatUnreadCount } from "../../services/chat"

const NAV_LINKS = [
  { path: "/home",    label: "Dashboard", icon: Home },
  { path: "/catalog", label: "Katalog",   icon: BookOpen },
  { path: "/chat",    label: "Pesan",     icon: MessageCircle },
  { path: "/profile", label: "Profil",    icon: User },
]

/* ─── Pill storage key for cross-page animation ───────────── */
const USER_PILL_KEY = "sewain-user-nav-pill"

/* ─── UserNavPills: horizontal-only sliding indicator ─────── */
function UserNavPills({ isActive, unread = 0 }) {
  const containerRef = useRef(null)
  const itemRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [animate, setAnimate] = useState(false)

  const activeIdx = NAV_LINKS.findIndex(l => isActive(l.path))

  useLayoutEffect(() => {
    if (activeIdx < 0 || !containerRef.current) return
    const el = itemRefs.current[activeIdx]
    if (!el) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const newLeft = elRect.left - containerRect.left
    const newWidth = elRect.width

    // Read previous indicator position from sessionStorage
    const prev = sessionStorage.getItem(USER_PILL_KEY)
    if (prev) {
      try {
        const parsed = JSON.parse(prev)
        // Start from previous position, then animate to new
        setIndicator({ left: parsed.left, width: parsed.width })
        requestAnimationFrame(() => {
          setIndicator({ left: newLeft, width: newWidth })
          setAnimate(true)
        })
      } catch {
        setIndicator({ left: newLeft, width: newWidth })
        setAnimate(true)
      }
    } else {
      setIndicator({ left: newLeft, width: newWidth })
      setAnimate(true)
    }

    // Save current position for next navigation
    sessionStorage.setItem(USER_PILL_KEY, JSON.stringify({ left: newLeft, width: newWidth }))
  }, [activeIdx])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1 rounded-full p-1 bg-muted/40 border border-border/60"
    >
      {/* Sliding green pill — only animates left & width (horizontal) */}
      {activeIdx >= 0 && indicator.width > 0 && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-full bg-primary shadow-sm"
          initial={{ left: indicator.left, width: indicator.width }}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={animate ? { type: "spring", stiffness: 380, damping: 30 } : { duration: 0 }}
        />
      )}

      {NAV_LINKS.map(({ path, label, icon: Icon }, i) => {
        const showBadge = path === "/chat" && unread > 0
        return (
          <Link
            key={path}
            to={path}
            ref={(el) => { itemRefs.current[i] = el }}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive(path)
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative inline-flex">
              <Icon className="w-3.5 h-3.5" />
              {showBadge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </span>
            <span>{label}</span>
            {showBadge && (
              <span className="ml-1 bg-rose-500 text-white text-[9px] font-bold rounded-full px-1.5 min-w-[16px] h-[16px] inline-flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

function UserNavbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unread, setUnread] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Poll unread count
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
    if (path === "/chat")
      return location.pathname.startsWith("/chat")
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
              src="/logo-sewain.png"
              alt="Sewain"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
            <div className="hidden h-9 items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">Sewain</span>
            </div>
          </motion.div>
          <span className="font-bold text-lg tracking-tight text-primary">Sewain</span>
        </Link>

        {/* ── Desktop nav pills (horizontal-only slide) ── */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <UserNavPills isActive={isActive} unread={unread} />
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
              <Avatar src={user?.foto_profil} name={user?.nama} size={28} />
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
                <Avatar src={user?.foto_profil} name={user?.nama} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight truncate">{user?.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {NAV_LINKS.map(({ path, label, icon: Icon }) => {
                const showBadge = path === "/chat" && unread > 0
                return (
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
                    {showBadge && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </Link>
                )
              })}

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
