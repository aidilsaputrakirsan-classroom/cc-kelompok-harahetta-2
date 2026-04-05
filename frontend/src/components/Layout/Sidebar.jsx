import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const NAV_USER = [
  { path: "/dashboard", icon: "🏠", label: "Beranda" },
  { path: "/rentals/my", icon: "📋", label: "Sewa Saya" },
  { path: "/profile", icon: "👤", label: "Profil & KTP" },
]

const NAV_ADMIN = [
  { path: "/dashboard", icon: "🏠", label: "Beranda" },
  { path: "/admin/dashboard", icon: "📦", label: "Kelola Barang" },
  { path: "/admin/rentals", icon: "📋", label: "Permintaan Sewa" },
  { path: "/admin/profile", icon: "🏪", label: "Profil Usaha" },
]

const NAV_SUPER_ADMIN = [
  { path: "/dashboard", icon: "🏠", label: "Beranda" },
  { path: "/superadmin", icon: "📊", label: "Dashboard" },
  { path: "/superadmin/users", icon: "👥", label: "Kelola User" },
  { path: "/superadmin/categories", icon: "📂", label: "Kategori" },
  { path: "/superadmin/verifications", icon: "🔍", label: "Verifikasi KTP" },
  { path: "/superadmin/rentals", icon: "💳", label: "Semua Transaksi" },
]

const ROLE_COLORS = {
  super_admin: { text: "#a78bfa", bg: "rgba(167,139,250,0.15)", label: "Super Admin" },
  admin: { text: "#6366f1", bg: "rgba(99,102,241,0.15)", label: "Admin" },
  user: { text: "#3b82f6", bg: "rgba(59,130,246,0.15)", label: "User" },
}

export default function Sidebar() {
  const { user, logout, isSuperAdmin, isAdmin, isUser } = useAuth()
  const navigate = useNavigate()

  const navItems = isSuperAdmin ? NAV_SUPER_ADMIN : isAdmin ? NAV_ADMIN : NAV_USER
  const roleInfo = ROLE_COLORS[user?.role] || ROLE_COLORS.user

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: "var(--sidebar-width)",
      background: "rgba(15,23,42,0.95)",
      backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(148,163,184,0.08)",
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
      boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 42, height: 42, borderRadius: "12px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}>🛵</div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f1f5f9" }}>Sewain</div>
            <div style={{ fontSize: "0.72rem", color: "#475569" }}>Platform Sewa Online</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div style={{
          background: "rgba(30,41,59,0.6)", borderRadius: "12px",
          padding: "12px 14px",
          border: "1px solid rgba(148,163,184,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleInfo.text}, #475569)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {user?.nama?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{user?.nama}</div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "1px 7px", borderRadius: "9999px",
                background: roleInfo.bg, color: roleInfo.text,
                fontSize: "0.68rem", fontWeight: 700, marginTop: "3px",
                border: `1px solid ${roleInfo.text}25`,
              }}>
                {roleInfo.label}
                {user?.is_verified && " ✓"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        <div style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: "8px" }}>
          Menu
        </div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "10px",
              marginBottom: "2px",
              fontSize: "0.875rem", fontWeight: isActive ? 600 : 500,
              color: isActive ? "#f1f5f9" : "#64748b",
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
              textDecoration: "none",
              transition: "all 0.15s ease",
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "rgba(51,65,85,0.5)"
                e.currentTarget.style.color = "#e2e8f0"
              }
            }}
            onMouseLeave={e => {
              const isActive = e.currentTarget.getAttribute("data-active")
              if (!isActive) {
                e.currentTarget.style.background = ""
                e.currentTarget.style.color = ""
              }
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Logout */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(148,163,184,0.08)" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px 14px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px", color: "#ef4444",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            justifyContent: "center", transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  )
}
