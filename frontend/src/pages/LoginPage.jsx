import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Info } from "lucide-react"

export default function LoginPage({ addToast }) {
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", nama: "", role: "user" })
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
      addToast?.(err.message === "UNAUTHORIZED" ? "Email atau password salah" : err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(registerForm)
      addToast?.("Registrasi berhasil! Selamat datang", "success")
      navigate("/dashboard")
    } catch (err) {
      addToast?.(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email) => {
    setLoginForm({ email, password: "Password123" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/sewainLogo.webp" alt="Sewain" className="w-12 h-12 rounded-xl object-cover mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Sewain</h1>
          <p className="text-sm text-muted-foreground">Platform sewa barang terpercaya</p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
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
                    <Label htmlFor="login-password">Password</Label>
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

                <div className="mt-4 p-3 rounded-lg bg-muted border text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-2">
                    <Info className="w-3.5 h-3.5" /> Demo Akun:
                  </div>
                  <button onClick={() => fillDemo("user@sewain.id")} className="block w-full text-left hover:text-primary transition-colors">
                    User: <span className="font-medium">user@sewain.id</span>
                  </button>
                  <button onClick={() => fillDemo("admin@sewain.id")} className="block w-full text-left hover:text-primary transition-colors">
                    Admin: <span className="font-medium">admin@sewain.id</span>
                  </button>
                  <button onClick={() => fillDemo("super@sewain.id")} className="block w-full text-left hover:text-primary transition-colors">
                    Super Admin: <span className="font-medium">super@sewain.id</span>
                  </button>
                  <p className="text-muted-foreground">Password: apapun</p>
                </div>
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
