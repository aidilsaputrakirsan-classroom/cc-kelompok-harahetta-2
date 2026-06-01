/**
 * PromoTicketCard — Komponen tiket diskon untuk hero section.
 * Mengikuti Design.md: promo ticket card dengan tiket hijau miring,
 * badge kuning, info kanan, dan tombol salin kode.
 *
 * Mendukung banyak promo featured sekaligus dalam bentuk slider infinite
 * (auto-slide + navigasi panah & dot). Memakai sliding track dengan kartu
 * "clone" di kedua ujung supaya transisi dari kartu terakhir ke kartu awal
 * (atau sebaliknya) tetap menggeser ke arah yang sama — tidak mundur cepat.
 * Panah navigasi berada di luar track sehingga posisinya tetap (tidak ikut
 * tergeser saat slide).
 */
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Copy, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchFeaturedPromos } from "../services/api"
import { formatPrice } from "../lib/utils"

const ELIGIBILITY_LABEL = {
  new_user: "UNTUK\nPENGGUNA\nBARU",
  all: "UNTUK\nSEMUA",
  specific_users: "PROMO\nEKSKLUSIF",
}

const AUTO_SLIDE_MS = 5000

export default function PromoTicketCard() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)

  // Posisi pada track yang sudah ditambahi clone.
  // Posisi 0 = clone kartu terakhir, posisi 1..count = kartu asli,
  // posisi count+1 = clone kartu pertama.
  const [position, setPosition] = useState(1)
  const [enableTransition, setEnableTransition] = useState(true)

  useEffect(() => {
    fetchFeaturedPromos()
      .then((data) => {
        if (Array.isArray(data)) setPromos(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const count = promos.length
  const hasMultiple = count > 1

  const next = useCallback(() => setPosition((p) => p + 1), [])
  const prev = useCallback(() => setPosition((p) => p - 1), [])
  const goTo = useCallback((i) => setPosition(i + 1), [])

  // Auto-slide hanya jika ada lebih dari 1 promo
  useEffect(() => {
    if (!hasMultiple) return
    const t = setInterval(() => setPosition((p) => p + 1), AUTO_SLIDE_MS)
    return () => clearInterval(t)
  }, [hasMultiple])

  // Setelah jump instan (tanpa transisi) ke posisi asli, aktifkan lagi transisi.
  useEffect(() => {
    if (!enableTransition) {
      const id = requestAnimationFrame(() => setEnableTransition(true))
      return () => cancelAnimationFrame(id)
    }
  }, [enableTransition])

  // Saat animasi selesai di clone, lompat tanpa transisi ke kartu asli yang setara.
  const handleAnimComplete = () => {
    if (!hasMultiple) return
    if (position === count + 1) {
      setEnableTransition(false)
      setPosition(1)
    } else if (position === 0) {
      setEnableTransition(false)
      setPosition(count)
    }
  }

  const handleCopy = async (code) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000)
    } catch {
      // ignore
    }
  }

  if (loading || !promos.length) return null

  const renderCard = (promo) => {
    const isPercent = promo.discount_type === "percentage"
    const discountLabel = isPercent
      ? `${Math.round(promo.discount_value)}%`
      : formatPrice(promo.discount_value)
    const eligibilityText =
      ELIGIBILITY_LABEL[promo.eligibility] || "PROMO\nSPESIAL"
    const copied = copiedCode === promo.code

    return (
      <div
        className="relative w-full flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-7 sm:h-[188px] overflow-hidden"
        style={{
          background: "#f1fbf6",
          border: "1.5px dashed #b8e3d2",
          borderRadius: "22px",
          padding: "24px 28px",
          boxShadow: "0 12px 30px rgba(0, 122, 77, 0.08)",
        }}
      >
        {/* ── Kiri: Tiket hijau miring ─────────────────────── */}
        <div className={`relative flex-shrink-0 ${hasMultiple ? "sm:ml-10" : ""}`}>
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
        <div className={`flex-1 min-w-0 text-center sm:text-left ${hasMultiple ? "sm:pr-10" : ""}`}>
          <h3
            className="line-clamp-1"
            style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 700,
              color: "#063b2a",
              lineHeight: 1.25,
            }}
          >
            {promo.nama || `Diskon ${discountLabel} untuk pengguna baru!`}
          </h3>
          <p
            className="line-clamp-2"
            style={{
              fontSize: "15px",
              color: "#6b7c75",
              marginTop: "8px",
              lineHeight: 1.5,
              minHeight: "45px",
            }}
          >
            {promo.deskripsi || "Sewa lebih hemat, pengalaman pertama lebih menyenangkan."}
          </p>

          {/* Kode + tombol */}
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center sm:items-center gap-2.5">
            <span
              className="truncate max-w-full"
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
              onClick={() => handleCopy(promo.code)}
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
    )
  }

  // Track dengan clone di kedua ujung untuk infinite loop yang mulus.
  const slides = hasMultiple
    ? [promos[count - 1], ...promos, promos[0]]
    : promos
  const trackPosition = hasMultiple ? position : 0

  // Index asli untuk dot indikator & footer (0..count-1)
  const activeIndex = hasMultiple
    ? ((position - 1) % count + count) % count
    : 0
  const currentPromo = promos[activeIndex]

  return (
    <div className="relative w-full max-w-[820px]">
      {/* ── Area slider (panah fix di sini, tidak ikut tergeser) ── */}
      <div className="relative">
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Promo sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-[#b8e3d2] text-[#007a4d] hover:bg-white transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Promo berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-[#b8e3d2] text-[#007a4d] hover:bg-white transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `-${trackPosition * 100}%` }}
            transition={{ duration: enableTransition ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={handleAnimComplete}
          >
            {slides.map((p, i) => (
              <div key={i} className="w-full flex-shrink-0">
                {renderCard(p)}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Footer keterangan + dot indikator ──────────────── */}
      <div className="mt-2.5 ml-1 flex items-center justify-between gap-3">
        <p
          style={{
            fontSize: "12px",
            color: "#6b7c75",
          }}
        >
          *Berlaku untuk semua kategori
          {currentPromo?.max_discount ? ` • Maks. diskon ${formatPrice(currentPromo.max_discount)}` : ""}
        </p>

        {hasMultiple && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {promos.map((p, i) => (
              <button
                key={p.code}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Promo ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === activeIndex ? "20px" : "8px",
                  height: "8px",
                  background: i === activeIndex ? "#007a4d" : "#b8e3d2",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
