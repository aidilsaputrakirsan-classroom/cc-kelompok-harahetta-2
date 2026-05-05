/**
 * Shared public Navbar — digunakan oleh LandingPage, AboutPage, CatalogPage
 *
 * Props:
 *  links       – array nav links tengah: { label, href?, to?, primary? }
 *  breadcrumb  – tampilkan breadcrumb alih-alih links: [{ label, to? }]
 */
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import ThemeToggle from "../ui/ThemeToggle"
import { AnimatePresence, motion } from "framer-motion"
import {
  Menu, X, LayoutDashboard, LogOut, BookOpen, ChevronRight, Package,
} from "lucide-react"
import { cn } from "../../lib/utils"

export default function Navbar({ links = [], breadcrumb = null, className }) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const homeRoute = isAdmin || isSuperAdmin ? "/dashboard" : "/home"

  const handleLogout = () => { logout(); navigate("/"); setOpen(false) }

  const defaultLinks = [
    { label: "Katalog", to: "/catalog", primary: true },
    { label: "Tentang",  to: "/about" },
  ]
  const navLinks = links.length > 0 ? links : defaultLinks

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60 shadow-sm",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <motion.div whileHover={{ rotate: -8, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
            <img
              src="/sewainLogo.webp"
              alt="Sewain"
              className="w-9 h-9 rounded-xl object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
            <div
              className="hidden w-9 h-9 rounded-xl bg-primary items-center justify-center"
            >
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
          </motion.div>
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            Sewain
          </span>
        </Link>

        {/* Center — breadcrumb atau nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {breadcrumb ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {navLinks.map((link, i) => {
                const inner = link.primary ? (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> {link.label}
                  </span>
                ) : link.label

                const cls = link.primary
                  ? "text-sm font-semibold text-primary hover:text-primary/80"
                  : "text-sm text-muted-foreground hover:text-foreground"

                return link.href ? (
                  <a key={i} href={link.href} className={cn(cls, "px-3 py-1.5 rounded-lg transition-colors hover:bg-muted/50")}>
                    {inner}
                  </a>
                ) : (
                  <Link key={i} to={link.to} className={cn(cls, "px-3 py-1.5 rounded-lg transition-colors hover:bg-muted/50")}>
                    {inner}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — theme toggle + auth */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden lg:block">
                Halo, <span className="font-semibold text-foreground">{user?.nama?.split(" ")[0]}</span>
              </span>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to={homeRoute}>
                  <Button size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
                  </Button>
                </Link>
              </motion.div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login"><Button>Masuk / Daftar</Button></Link>
            </motion.div>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-1.5">
          <ThemeToggle />
          <button
            className="p-1.5 rounded-lg text-foreground hover:bg-muted/60 transition-colors"
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
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-card border-b"
          >
            <div className="px-4 pb-4 pt-2 space-y-1">
              {navLinks.map((link, i) =>
                link.href ? (
                  <a
                    key={i}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={i}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                      link.primary
                        ? "font-semibold text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {link.primary && <BookOpen className="w-4 h-4" />}
                    {link.label}
                  </Link>
                )
              )}

              <div className="pt-2 border-t border-border/50 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link to={homeRoute} onClick={() => setOpen(false)}>
                      <Button className="w-full mt-1">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </Button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full mt-1">Masuk / Daftar</Button>
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
