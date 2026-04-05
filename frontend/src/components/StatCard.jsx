export default function StatCard({ icon, label, value, color = "#6366f1", trend, sub }) {
  return (
    <div style={{
      background: "rgba(30,41,59,0.8)",
      border: "1px solid rgba(148,163,184,0.1)",
      borderRadius: "16px",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.25s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)"
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}30`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)"
      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)"
    }}
    >
      {/* Glow accent */}
      <div style={{
        position: "absolute", top: "-20px", right: "-20px",
        width: "80px", height: "80px", borderRadius: "50%",
        background: color, opacity: 0.08, filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "12px",
          background: `${color}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.35rem",
          border: `1px solid ${color}30`,
        }}>{icon}</div>
        {trend && (
          <span style={{
            fontSize: "0.75rem", fontWeight: 600,
            color: trend > 0 ? "#10b981" : "#ef4444",
            background: trend > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            padding: "3px 8px", borderRadius: "9999px",
          }}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "4px" }}>{label}</div>
        {sub && <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "2px" }}>{sub}</div>}
      </div>
    </div>
  )
}
