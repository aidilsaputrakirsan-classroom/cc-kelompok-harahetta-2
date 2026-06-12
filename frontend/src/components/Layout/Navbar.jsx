/**
 * Public Navbar — Sewain
 * Minimal modern · transparan dengan blur, pill nav, dan CTA hijau pekat.
 *
 * Props:
 *   links       – [{ label, to | href, primary? }]
 *   breadcrumb  – [{ label, to? }] (alternatif links)
 *   variant     – "transparent" (overlay, hero gelap) | "solid" (default putih)
 */
import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import ThemeToggle from "../ui/ThemeToggle"
import { AnimatePresence, motion } from "framer-motion"
import {
  Menu, X, LayoutDashboard, LogOut, ChevronRight, Package,
} from "lucide-react"
import { cn } from "../../lib/utils"

/* ─── NavPills: sliding active indicator ──────────────────── */
const PILL_STORAGE_KEY = "sewain-nav-pill"

function NavPills({ links, isLinkActive, isOverlay, mutedTone }) {
  const containerRef = useRef(null)
  const itemRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [animate, setAnimate] = useState(false)

  const activeIdx = links.findIndex(l => isLinkActive(l))

  // On mount: read previous position from sessionStorage to animate FROM there
  useLayoutEffect(() => {
    if (activeIdx < 0 || !containerRef.current) return
    const el = itemRefs.current[activeIdx]
    if (!el) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const newLeft = elRect.left - containerRect.left
    const newWidth = elRect.width

    // Read previous indicator position
    const prev = sessionStorage.getItem(PILL_STORAGE_KEY)
    if (prev) {
      try {
        const parsed = JSON.parse(prev)
        // Set initial position to previous, then animate to new
        setIndicator({ left: parsed.left, width: parsed.width })
        // Small delay to trigger animation
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
    sessionStorage.setItem(PILL_STORAGE_KEY, JSON.stringify({ left: newLeft, width: newWidth }))
  }, [activeIdx])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center gap-0.5 rounded-full p-1 border",
        isOverlay
          ? "bg-white/10 border-white/15 backdrop-blur-md"
          : "bg-muted/40 border-border/60"
      )}
    >
      {/* Sliding green pill */}
      {activeIdx >= 0 && indicator.width > 0 && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-full bg-primary shadow-sm"
          initial={{ left: indicator.left, width: indicator.width }}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={animate ? { type: "spring", stiffness: 300, damping: 28 } : { duration: 0 }}
        />
      )}

      {links.map((link, i) => {
        const active = i === activeIdx
        const cls = active
          ? "text-primary-foreground"
          : cn(mutedTone, "hover:bg-foreground/5")

        return (
          <Link
            key={i}
            to={link.to || "#"}
            ref={(el) => { itemRefs.current[i] = el }}
            className={cn(
              "relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              cls
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function Navbar({
  links = [],
  breadcrumb = null,
  variant = "solid",
  className,
}) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const homeRoute = isAdmin || isSuperAdmin ? "/dashboard" : "/home"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = () => { logout(); navigate("/"); setOpen(false) }

  const defaultLinks = [
    { label: "Beranda", to: "/" },
    { label: "Katalog", to: "/catalog" },
    { label: "Tentang", to: "/about" },
    { label: "Mulai",   to: "/login" },
  ]

  // Jika user sudah login, hilangkan "Mulai" dari pill nav
  const publicLinks = isAuthenticated
    ? defaultLinks.filter(l => l.to !== "/login")
    : defaultLinks

  const navLinks = links.length > 0
    ? (isAuthenticated ? links.filter(l => l.to !== "/login") : links)
    : publicLinks

  // Determine which link is "active" based on current route
  const isLinkActive = (link) => {
    if (!link.to) return false
    if (link.to === "/") return location.pathname === "/"
    return location.pathname.startsWith(link.to)
  }

  const isOverlay = variant === "transparent" && !scrolled && !open
  const baseBg = isOverlay
    ? "bg-transparent border-transparent"
    : "bg-background/80 backdrop-blur-xl border-border/60"

  const textTone = isOverlay
    ? "text-white"
    : "text-foreground"

  const mutedTone = isOverlay
    ? "text-white/70 hover:text-white"
    : "text-muted-foreground hover:text-foreground"

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300",
        baseBg,
        textTone,
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="relative"
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

        {/* ── Center: breadcrumb / nav ── */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {breadcrumb ? (
            <div className={cn("flex items-center gap-1.5 text-sm", mutedTone)}>
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:opacity-100 link-underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn("font-semibold", isOverlay ? "text-white" : "text-foreground")}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <NavPills links={navLinks} isLinkActive={isLinkActive} isOverlay={isOverlay} mutedTone={mutedTone} />
          )}
        </div>

        {/* ── Right ── */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className={cn("text-sm hidden lg:block", mutedTone)}>
                Halo,{" "}
                <span className={cn("font-semibold", isOverlay ? "text-white" : "text-foreground")}>
                  {user?.nama?.split(" ")[0]}
                </span>
              </span>
              <Link to={homeRoute}>
                <Button size="sm" className="rounded-full px-4">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isOverlay
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/login">
              <Button className="rounded-full px-5">Masuk</Button>
            </Link>
          )}
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden flex items-center gap-1.5">
          <ThemeToggle />
          <button
            className={cn(
              "p-2 rounded-full transition-colors",
              isOverlay ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/60"
            )}
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
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background border-t border-border"
          >
            <div className="px-4 pb-4 pt-3 space-y-1 text-foreground">
              {navLinks.map((link, i) => {
                const active = isLinkActive(link)
                return link.href ? (
                  <a
                    key={i}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={i}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-3 py-2.5 rounded-xl text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link to={homeRoute} onClick={() => setOpen(false)}>
                      <Button className="w-full rounded-full">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </Button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full rounded-full">Masuk / Daftar</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
