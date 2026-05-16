import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { verifyEmail } from "../services/api"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardTitle, CardDescription } from "../components/ui/card"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("loading") // loading | success | error
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setMessage("Token verifikasi tidak ditemukan di URL.")
      return
    }

    verifyEmail(token)
      .then((data) => {
        setStatus("success")
        setMessage(data.message || "Email berhasil diverifikasi!")
      })
      .catch((err) => {
        setStatus("error")
        setMessage(err.message || "Token tidak valid atau sudah expired.")
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <CardTitle className="text-xl">Memverifikasi Email...</CardTitle>
                <CardDescription>Mohon tunggu sebentar.</CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl text-green-700 dark:text-green-400">Verifikasi Berhasil!</CardTitle>
                <CardDescription className="text-base">{message}</CardDescription>
                <div className="pt-4">
                  <Link to="/login">
                    <Button className="w-full">Masuk ke Akun</Button>
                  </Link>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl text-red-700 dark:text-red-400">Verifikasi Gagal</CardTitle>
                <CardDescription className="text-base">{message}</CardDescription>
                <div className="pt-4 space-y-3">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">Kembali ke Login</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
