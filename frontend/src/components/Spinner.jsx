export default function Spinner({ size = "md", color = "#6366f1", center = false }) {
  const sizes = { sm: 20, md: 32, lg: 48, xl: 64 }
  const px = sizes[size] || sizes.md

  const el = (
    <div style={{
      width: px, height: px,
      borderRadius: "50%",
      border: `${px / 10}px solid rgba(99,102,241,0.2)`,
      borderTopColor: color,
      animation: "spin 0.75s linear infinite",
    }} />
  )

  if (center) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px" }}>
      {el}
    </div>
  )
  return el
}
