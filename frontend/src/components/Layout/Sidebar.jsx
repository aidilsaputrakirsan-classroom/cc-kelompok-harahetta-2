import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../lib/utils"
import {
  Package, LayoutDashboard, ShoppingCart, ClipboardList, User,
  Store, Crown, LogOut, ChevronLeft, Menu, Home, BookOpen,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Separator } from "../ui/separator"
import { useState } from "react"

const NAV_USER = [
  { path: "/home", label: "Beranda", icon: Home },
  { path: "/catalog", label: "Katalog", icon: BookOpen },
  { path: "/profile", label: "Profil", icon: User },
]

const NAV_ADMIN = [
  { path: "/dashboard", label: "Katalog", icon: LayoutDashboard },
  { path: "/admin/dashboard", label: "Admin Panel", icon: Store },
  { path: "/rentals/my", label: "Sewa Saya", icon: ClipboardList },
  { path: "/profile", label: "Profil", icon: User },
]

const NAV_SUPER = [
  { path: "/dashboard", label: "Katalog", icon: LayoutDashboard },
  { path: "/admin/dashboard", label: "Admin Panel", icon: Store },
  { path: "/superadmin", label: "Super Admin", icon: Crown },
  { path: "/rentals/my", label: "Sewa Saya", icon: ClipboardList },
  { path: "/profile", label: "Profil", icon: User },
]

export default function Sidebar() {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = isSuperAdmin ? NAV_SUPER : isAdmin ? NAV_ADMIN : NAV_USER

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-sidebar-foreground">Sewain</span>}
        </div>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="mb-2 px-5">
          <div className="text-xs font-medium text-sidebar-foreground truncate">{user?.nama}</div>
          <div className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((item) => {
          const active = location.pathname === item.path ||
            (item.path === "/catalog" && location.pathname === "/dashboard")
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 mt-auto">
        <Separator className="bg-sidebar-border mb-2" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-md bg-card border shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block h-svh border-r border-sidebar-border transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full border bg-card flex items-center justify-center shadow-sm hover:bg-muted"
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  )
}
