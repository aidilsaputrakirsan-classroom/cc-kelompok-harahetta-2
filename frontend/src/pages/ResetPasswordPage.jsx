import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { resetPassword } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import { Card, CardContent, CardTitle, CardDescription } from "../components/ui/Card"
import { CheckCircle2, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage({ addToast }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 8) {
      addToast?.("Password minimal 8 karakter", "error")
      return
    }
    if (password !== confirmPassword) {
      addToast?.("Password dan konfirmasi tidak cocok", "error")
      return
    }
    // Validasi: huruf besar, kecil, angka
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pattern.test(password)) {
      addToast?.("Password harus mengandung huruf besar, huruf kecil, dan angka", "error")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      addToast?.("Password berhasil direset!", "success")
    } catch (err) {
      addToast?.(err.message || "Gagal reset password", "error")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <CardTitle className="text-xl text-red-600">Link Tidak Valid</CardTitle>
              <CardDescription>Token reset password tidak ditemukan di URL.</CardDescription>
              <Link to="/forgot-password">
                <Button variant="outline" className="w-full mt-4">Request Reset Baru</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl text-green-700 dark:text-green-400">Password Berhasil Direset!</CardTitle>
              <CardDescription className="text-base">
                Silakan login dengan password baru Anda.
              </CardDescription>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="w-full">Masuk ke Akun</Button>
                </Link>
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
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="text-center space-y-2">
              <CardTitle className="text-xl">Buat Password Baru</CardTitle>
              <CardDescription className="text-base">
                Masukkan password baru untuk akun Anda.
              </CardDescription>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 8 karakter (huruf besar, kecil, angka)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
