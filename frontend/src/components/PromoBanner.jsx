/**
 * PromoBanner — Banner promo untuk landing page.
 * Fetch promo featured dari /promos/featured, tampilkan card dengan
 * kode bisa di-click-to-copy.
 */
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Tag, Copy, CheckCircle2, Sparkles } from "lucide-react"
import { fetchFeaturedPromos } from "../services/api"
import { formatPrice } from "../lib/utils"

export default function PromoBanner() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    fetchFeaturedPromos()
      .then((data) => setPromos(Array.isArray(data) ? data : []))
      .catch(() => setPromos([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // ignore — clipboard API tidak tersedia
    }
  }

  if (loading) return null
  if (!promos.length) return null

  return (
    <section className="py-16 md:py-20 bg-section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <span className="chip mb-4 inline-flex">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Promo aktif
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Hemat di transaksi pertamamu
          </h2>
          <p className="text-muted-foreground mt-3">
            Pakai kode di bawah saat checkout. Diskon otomatis terpotong dari total sewa.
          </p>
        </motion.div>

        <div className={`grid gap-5 ${promos.length === 1 ? "max-w-xl mx-auto" : promos.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3"}`}>
          {promos.map((promo, i) => (
            <motion.div
              key={promo.code}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6"
            >
              {/* Decorative dots */}
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-2xl bg-primary/15">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  {promo.eligibility === "new_user" && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Khusus pengguna baru
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold tracking-tight">{promo.nama}</h3>
                {promo.deskripsi && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {promo.deskripsi}
                  </p>
                )}

                <div className="mt-4 flex items-baseline gap-1.5">
                  {promo.discount_type === "percentage" ? (
                    <>
                      <span className="text-3xl font-bold text-primary">
                        {Math.round(promo.discount_value)}%
                      </span>
                      <span className="text-sm text-muted-foreground">OFF</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(promo.discount_value)}
                    </span>
                  )}
                  {promo.max_discount && (
                    <span className="text-xs text-muted-foreground ml-1">
                      hingga {formatPrice(promo.max_discount)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(promo.code)}
                  className="mt-5 w-full group flex items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-background/60 hover:bg-primary/5 px-4 py-3 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kode promo</span>
                    <span className="font-mono font-bold text-base text-primary">{promo.code}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    {copiedCode === promo.code ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Salin
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
