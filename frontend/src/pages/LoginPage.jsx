import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { resendVerification } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs"
import { Mail, CheckCircle2 } from "lucide-react"

export default function LoginPage({ addToast }) {
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", nama: "", role: "user" })
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resending, setResending] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      addToast?.("Email dan password harus diisi", "error")
      return
    }
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      addToast?.("Selamat datang kembali!", "success")
      navigate("/dashboard")
    } catch (err) {
      const msg = err.message
      if (msg.includes("Sesi habis") || msg === "SESSION_EXPIRED") {
        addToast?.("Email atau password salah", "error")
      } else if (msg.includes("belum diverifikasi")) {
        addToast?.("Email belum diverifikasi. Cek inbox email Anda.", "error")
      } else {
        addToast?.(msg, "error")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(registerForm)
      setRegisteredEmail(registerForm.email)
      setRegisterSuccess(true)
      addToast?.("Registrasi berhasil! Cek inbox & folder Spam untuk verifikasi email.", "success")
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      await resendVerification(registeredEmail)
      addToast?.("Email verifikasi dikirim ulang. Cek inbox & folder Spam.", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal mengirim ulang", "error")
    } finally {
      setResending(false)
    }
  }


  // Tampilan setelah register berhasil
  if (registerSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Cek Email Anda</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Kami telah mengirim link verifikasi ke<br />
                <strong className="text-foreground">{registeredEmail}</strong>
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                Klik link di email untuk mengaktifkan akun Anda. Link berlaku selama 24 jam.
              </p>
              <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-amber-900 dark:text-amber-200">
                💡 <strong>Tidak ada email masuk?</strong> Cek folder <strong>Spam</strong> atau <strong>Promotions</strong> di inbox Anda.
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendVerification}
                  loading={resending}
                >
                  Kirim Ulang Email Verifikasi
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setRegisterSuccess(false); setRegisterForm({ email: "", password: "", nama: "", role: "user" }) }}
                >
                  Kembali ke Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              {/* Logo Sewain */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <img
                  src="/logo-sewain.png"
                  alt="Sewain"
                  className="h-12 w-auto object-contain"
                />
                <span className="font-bold text-xl tracking-tight text-primary">Sewain</span>
              </div>

              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Masuk</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Daftar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <CardTitle className="text-lg mb-1">Selamat Datang!</CardTitle>
                <CardDescription className="mb-4">Masuk ke akun Sewain Anda</CardDescription>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Lupa password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" loading={loading}>Masuk</Button>
                </form>

              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-0">
                <CardTitle className="text-lg mb-1">Buat Akun Baru</CardTitle>
                <CardDescription className="mb-4">Daftar dan mulai sewa barang</CardDescription>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nama">Nama Lengkap</Label>
                    <Input
                      id="reg-nama"
                      placeholder="Masukkan nama lengkap"
                      value={registerForm.nama}
                      onChange={(e) => setRegisterForm(p => ({ ...p, nama: e.target.value }))}
                      required
                      minLength={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min 8 karakter (huruf besar, kecil, angka)"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" loading={loading}>Buat Akun</Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Kelompok Harahetta-2 &middot; Komputasi Awan &middot; ITK
        </p>
      </div>
    </div>
  )
}
