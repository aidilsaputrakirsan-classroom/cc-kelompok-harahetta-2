import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext"

export default function LoginPage({ addToast }) {
  const [mode, setMode] = useState("login") // "login" | "register"
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", nama: "", role: "user" })
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === "login") {
        await login(form.email, form.password)
        addToast?.("Selamat datang kembali! 👋", "success")
      } else {
        await register({ email: form.email, password: form.password, nama: form.nama, role: form.role })
        addToast?.("Registrasi berhasil! Selamat datang 🎉", "success")
      }
      navigate("/dashboard")
    } catch (err) {
      addToast?.(err.message || "Terjadi kesalahan", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1a1040 50%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(99,102,241,0.07)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "rgba(139,92,246,0.06)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "rgba(99,102,241,0.03)", filter: "blur(100px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "440px", animation: "scaleIn 0.4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>🛵</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "6px" }}>
            <span style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sewain</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Platform Sewa Barang Online — Kelompok Harahetta</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(30,41,59,0.8)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(148,163,184,0.12)", borderRadius: "24px",
          padding: "32px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {/* Tab */}
          <div style={{
            display: "flex", background: "rgba(15,23,42,0.6)", borderRadius: "12px",
            padding: "4px", marginBottom: "28px",
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px",
                background: mode === m ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                border: "none", borderRadius: "10px",
                color: mode === m ? "#fff" : "#64748b",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: mode === m ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
              }}>
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input id="reg-nama" name="nama" className="form-input" placeholder="Masukkan nama lengkap" value={form.nama} onChange={handleChange} required minLength={2} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Daftar Sebagai</label>
                  <select id="reg-role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                    <option value="user">👤 User (Penyewa)</option>
                    <option value="admin">🏪 Admin (Penyedia Barang)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email</label>
              <input id="auth-email" name="email" type="email" className="form-input" placeholder="nama@email.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password</label>
              <input id="auth-password" name="password" type="password" className="form-input" placeholder="Minimal 8 karakter (huruf besar, kecil, angka)" value={form.password} onChange={handleChange} required minLength={8} />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: "8px" }}>
              {mode === "login" ? "Masuk" : "Buat Akun"}
            </Button>
          </form>

          {mode === "login" && (
            <div style={{
              marginTop: "20px", padding: "12px 14px",
              background: "rgba(99,102,241,0.08)", borderRadius: "10px",
              border: "1px solid rgba(99,102,241,0.15)", fontSize: "0.8rem", color: "#6366f1",
            }}>
              💡 <strong>Demo:</strong> Gunakan akun yang tersedia di backend atau daftar akun baru
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.78rem", color: "#334155" }}>
          Kelompok Harahetta-2 · Komputasi Awan · ITK
        </div>
      </div>
    </div>
  )
}
