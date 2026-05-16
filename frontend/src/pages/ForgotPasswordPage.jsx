import { useState } from "react"
import { Link } from "react-router-dom"
import { forgotPassword } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardTitle, CardDescription } from "../components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage({ addToast }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      addToast?.("Masukkan email Anda", "error")
      return
    }
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      addToast?.(err.message || "Terjadi kesalahan", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-4">
            {!sent ? (
              <>
                <div className="text-center space-y-2">
                  <CardTitle className="text-xl">Lupa Password?</CardTitle>
                  <CardDescription className="text-base">
                    Masukkan email Anda dan kami akan mengirim link untuk reset password.
                  </CardDescription>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" loading={loading}>
                    Kirim Link Reset
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Cek Email Anda</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Jika email <strong className="text-foreground">{email}</strong> terdaftar,
                  kami telah mengirim link untuk reset password.
                </CardDescription>
                <p className="text-sm text-muted-foreground">
                  Link berlaku selama 1 jam.
                </p>
                <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-amber-900 dark:text-amber-200 text-left">
                  💡 <strong>Tidak ada email masuk?</strong> Cek folder <strong>Spam</strong> atau <strong>Promotions</strong> di inbox Anda.
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setSent(false); setEmail("") }}
                  >
                    Kirim Ulang
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
