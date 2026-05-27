/**
 * PromoTicketCard — Komponen tiket diskon untuk hero section.
 * Menampilkan promo featured secara bergantian dengan animasi slide.
 */
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchFeaturedPromos } from "../services/api"
import { formatPrice } from "../lib/utils"

const ELIGIBILITY_LABEL = {
  new_user: "UNTUK\nPENGGUNA\nBARU",
  all: "UNTUK\nSEMUA",
  specific_users: "PROMO\nEKSKLUSIF",
}

const AUTO_ROTATE_MS = 5000 // bergantian setiap 5 detik

export default function PromoTicketCard() {
  const [promos, setPromos] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    fetchFeaturedPromos()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPromos(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (promos.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setActiveIdx((prev) => (prev + 1) % promos.length)
    }, AUTO_ROTATE_MS)
    return () => clearInterval(timer)
  }, [promos.length])

  const goNext = useCallback(() => {
    setDirection(1)
    setActiveIdx((prev) => (prev + 1) % promos.length)
  }, [promos.length])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setActiveIdx((prev) => (prev - 1 + promos.length) % promos.length)
  }, [promos.length])

  const handleCopy = async (code) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading || promos.length === 0) return null

  const promo = promos[activeIdx]
  const isPercent = promo.discount_type === "percentage"
  const discountLabel = isPercent
    ? `${Math.round(promo.discount_value)}%`
    : formatPrice(promo.discount_value)
  const eligibilityText =
    ELIGIBILITY_LABEL[promo.eligibility] || "PROMO\nSPESIAL"

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      className="relative w-full max-w-[760px]"
    >
      {/* ── Promo Card ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "#f1fbf6",
          border: "1.5px dashed #b8e3d2",
          borderRadius: "22px",
          padding: "24px 28px",
          boxShadow: "0 12px 30px rgba(0, 122, 77, 0.08)",
          minHeight: "200px",
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeIdx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-7"
          >
            {/* ── Kiri: Tiket hijau miring ─────────────────── */}
            <div className="relative flex-shrink-0">
              <div
                className="relative flex flex-col items-center justify-center text-white text-center"
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
                <div
                  className="absolute rounded-[10px] pointer-events-none"
                  style={{ inset: "8px", border: "1.5px dashed rgba(255,255,255,0.4)" }}
                />
                <p className="relative z-10" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", marginBottom: "4px" }}>
                  KODE DISKON
                </p>
                <p className="relative z-10" style={{ fontSize: "52px", fontWeight: 800, lineHeight: 1, letterSpacing: "-2px" }}>
                  {discountLabel}
                </p>
              </div>

              {/* Badge kuning */}
              <div
                className="absolute z-10 flex items-center justify-center text-center"
                style={{
                  top: "-16px", right: "-16px", width: "72px", height: "72px",
                  background: "#ffd95a", borderRadius: "999px", transform: "rotate(5deg)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <span className="whitespace-pre-line" style={{ fontSize: "11px", fontWeight: 800, color: "#063b2a", lineHeight: 1.2 }}>
                  {eligibilityText}
                </span>
              </div>
            </div>

            {/* ── Kanan: Info + tombol ──────────────────────── */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="line-clamp-1" style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 700, color: "#063b2a", lineHeight: 1.25 }}>
                {promo.nama}
              </h3>
              <p className="line-clamp-2" style={{ fontSize: "14px", color: "#6b7c75", marginTop: "6px", lineHeight: 1.5 }}>
                {promo.deskripsi || "Sewa lebih hemat dengan kode promo ini."}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center sm:items-center gap-2.5">
                <span style={{
                  background: "#ffffff", border: "1.5px solid #7bc9ad", borderRadius: "10px",
                  color: "#007a4d", fontWeight: 700, padding: "12px 18px", fontSize: "15px", fontFamily: "monospace",
                }}>
                  KODE: {promo.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(promo.code)}
                  className="inline-flex items-center gap-1.5 transition-colors"
                  style={{
                    background: copied ? "#006b45" : "#007a4d", color: "#ffffff", border: "none",
                    borderRadius: "10px", padding: "12px 20px", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                  }}
                >
                  {copied ? (<><CheckCircle2 className="w-4 h-4" /> Tersalin!</>) : (<><Copy className="w-4 h-4" /> Salin Kode</>)}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation arrows (hanya jika > 1 promo) ───── */}
        {promos.length > 1 && (
          <>
            <button
              type="button" onClick={goPrev} aria-label="Promo sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition"
            >
              <ChevronLeft className="w-4 h-4 text-[#063b2a]" />
            </button>
            <button
              type="button" onClick={goNext} aria-label="Promo berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition"
            >
              <ChevronRight className="w-4 h-4 text-[#063b2a]" />
            </button>
          </>
        )}
      </div>

      {/* ── Footer + dots indicator ────────────────────────── */}
      <div className="flex items-center justify-between mt-2.5 px-1">
        <p style={{ fontSize: "12px", color: "#6b7c75" }}>
          *Berlaku untuk semua kategori
          {promo.max_discount ? ` • Maks. diskon ${formatPrice(promo.max_discount)}` : ""}
        </p>
        {promos.length > 1 && (
          <div className="flex gap-1.5">
            {promos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setDirection(i > activeIdx ? 1 : -1); setActiveIdx(i) }}
                className={`w-2 h-2 rounded-full transition-colors ${i === activeIdx ? "bg-[#007a4d]" : "bg-[#b8e3d2]"}`}
                aria-label={`Promo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
