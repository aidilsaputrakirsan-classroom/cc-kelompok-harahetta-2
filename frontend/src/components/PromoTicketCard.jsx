/**
 * PromoTicketCard — Komponen tiket diskon untuk hero section.
 * Mengikuti Design.md: promo ticket card dengan tiket hijau miring,
 * badge kuning, info kanan, dan tombol salin kode.
 */
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Copy, CheckCircle2 } from "lucide-react"
import { fetchFeaturedPromos } from "../services/api"
import { formatPrice } from "../lib/utils"

const ELIGIBILITY_LABEL = {
  new_user: "UNTUK\nPENGGUNA\nBARU",
  all: "UNTUK\nSEMUA",
  specific_users: "PROMO\nEKSKLUSIF",
}

export default function PromoTicketCard() {
  const [promo, setPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchFeaturedPromos()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPromo(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = async () => {
    if (!promo?.code) return
    try {
      await navigator.clipboard.writeText(promo.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (loading || !promo) return null

  const isPercent = promo.discount_type === "percentage"
  const discountLabel = isPercent
    ? `${Math.round(promo.discount_value)}%`
    : formatPrice(promo.discount_value)
  const eligibilityText =
    ELIGIBILITY_LABEL[promo.eligibility] || "PROMO\nSPESIAL"

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      className="relative w-full max-w-[760px]"
    >
      {/* ── Promo Card ─────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-7"
        style={{
          background: "#f1fbf6",
          border: "1.5px dashed #b8e3d2",
          borderRadius: "22px",
          padding: "24px 28px",
          boxShadow: "0 12px 30px rgba(0, 122, 77, 0.08)",
        }}
      >
        {/* ── Kiri: Tiket hijau miring ─────────────────────── */}
        <div className="relative flex-shrink-0">
          <div
            className="relative flex flex-col items-center justify-center text-white text-center w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #00875a, #006b45)",
              borderRadius: "14px",
              padding: "22px 28px",
              transform: "rotate(-5deg)",
              boxShadow: "0 12px 24px rgba(0, 122, 77, 0.25)",
              width: "180px",
              height: "140px",
            }}
          >
            {/* Jahitan dashed */}
            <div
              className="absolute rounded-[10px] pointer-events-none"
              style={{
                inset: "8px",
                border: "1.5px dashed rgba(255,255,255,0.4)",
              }}
            />
            <p
              className="relative z-10"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                marginBottom: "4px",
              }}
            >
              KODE DISKON
            </p>
            <p
              className="relative z-10"
              style={{
                fontSize: "52px",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              {discountLabel}
            </p>
          </div>

          {/* Badge kuning */}
          <div
            className="absolute z-10 flex items-center justify-center text-center"
            style={{
              top: "-16px",
              right: "-16px",
              width: "72px",
              height: "72px",
              background: "#ffd95a",
              borderRadius: "999px",
              transform: "rotate(5deg)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <span
              className="whitespace-pre-line"
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#063b2a",
                lineHeight: 1.2,
                letterSpacing: "-0.2px",
              }}
            >
              {eligibilityText}
            </span>
          </div>
        </div>

        {/* ── Kanan: Info + tombol ──────────────────────────── */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3
            style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 700,
              color: "#063b2a",
              lineHeight: 1.25,
            }}
          >
            Diskon {isPercent ? `${Math.round(promo.discount_value)}%` : formatPrice(promo.discount_value)} untuk pengguna baru!
          </h3>
          <p
            style={{
              fontSize: "15px",
              color: "#6b7c75",
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            Sewa lebih hemat, pengalaman pertama lebih menyenangkan.
          </p>

          {/* Kode + tombol */}
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center sm:items-center gap-2.5">
            <span
              style={{
                background: "#ffffff",
                border: "1.5px solid #7bc9ad",
                borderRadius: "10px",
                color: "#007a4d",
                fontWeight: 700,
                padding: "12px 18px",
                fontSize: "15px",
                fontFamily: "monospace",
              }}
            >
              KODE: {promo.code}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{
                background: copied ? "#006b45" : "#007a4d",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "12px 20px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Salin Kode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer keterangan ──────────────────────────────── */}
      <p
        style={{
          fontSize: "12px",
          color: "#6b7c75",
          marginTop: "10px",
          marginLeft: "4px",
        }}
      >
        *Berlaku untuk semua kategori
        {promo.max_discount ? ` • Maks. diskon ${formatPrice(promo.max_discount)}` : ""}
      </p>
    </motion.div>
  )
}
