/**
 * PromoTicketCard — Kartu kupon diskon modern Sewain.
 *
 * Mengikuti design_promo_ticket_sewain.md:
 * - Panel kiri hijau gradient (radial) sebagai highlight diskon + perforated edge.
 * - Panel kanan putih/mint: badge eligibility, judul, deskripsi, masa berlaku,
 *   box kode promo (dashed), tombol Salin Kode, dan ringkasan benefit bawah.
 *
 * Semua konten berasal dari data yang diisi super admin.
 *
 * Mendukung banyak promo featured sebagai slider infinite (auto-slide + panah
 * & dot). Memakai sliding track dengan kartu "clone" di kedua ujung agar transisi
 * dari kartu terakhir ke awal tetap menggeser ke arah yang sama. Posisi di-clamp
 * & input dikunci saat animasi agar kartu tidak pernah blank.
 */
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Tag,
  User,
  Wallet,
  Calendar,
  Ticket,
} from "lucide-react"
import { fetchFeaturedPromos } from "../services/api"
import { formatPrice } from "../lib/utils"

const ELIGIBILITY_LABEL = {
  new_user: "Pengguna baru",
  all: "Semua pengguna",
  specific_users: "Eksklusif",
}

const AUTO_SLIDE_MS = 5000

function formatDate(value) {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  } catch {
    return null
  }
}

export default function PromoTicketCard() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)

  // Posisi pada track yang sudah ditambahi clone.
  // 0 = clone kartu terakhir, 1..count = kartu asli, count+1 = clone kartu pertama.
  const [position, setPosition] = useState(1)
  const [enableTransition, setEnableTransition] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

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

  const next = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setPosition((p) => Math.min(p + 1, count + 1))
  }, [isAnimating, count])

  const prev = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setPosition((p) => Math.max(p - 1, 0))
  }, [isAnimating])

  const goTo = useCallback((i) => {
    if (isAnimating) return
    setPosition(i + 1)
  }, [isAnimating])

  useEffect(() => {
    if (!hasMultiple) return
    const t = setInterval(() => {
      setPosition((p) => Math.min(p + 1, count + 1))
    }, AUTO_SLIDE_MS)
    return () => clearInterval(t)
  }, [hasMultiple, count])

  useEffect(() => {
    if (!enableTransition) {
      const id = requestAnimationFrame(() => setEnableTransition(true))
      return () => cancelAnimationFrame(id)
    }
  }, [enableTransition])

  const handleAnimComplete = () => {
    if (!hasMultiple) {
      setIsAnimating(false)
      return
    }
    if (position === count + 1) {
      setEnableTransition(false)
      setPosition(1)
    } else if (position === 0) {
      setEnableTransition(false)
      setPosition(count)
    }
    setIsAnimating(false)
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
    const discountValue = Math.round(promo.discount_value)
    const eligibilityText = ELIGIBILITY_LABEL[promo.eligibility] || "Promo spesial"
    const copied = copiedCode === promo.code
    const validUntil = formatDate(promo.valid_until)
    const maxDiscountLabel = promo.max_discount ? formatPrice(promo.max_discount) : null
    const discountLabel = isPercent ? `${discountValue}% OFF` : formatPrice(promo.discount_value)

    return (
      <div
        className="relative w-full sm:h-[184px] overflow-hidden rounded-[28px] border border-[#D8EEE5] dark:border-primary-800 shadow-[0_18px_45px_-12px_rgba(0,64,48,0.22)] flex flex-col sm:flex-row bg-gradient-to-br from-white to-[#F2FBF7] dark:from-primary-900/60 dark:to-primary-900/30"
      >
        {/* ══════════ Panel kiri: highlight diskon ══════════ */}
        <div className="relative flex-shrink-0 w-full sm:w-[170px] text-white px-5 py-4 sm:py-5 flex flex-col"
          style={{
            background: "radial-gradient(circle at top left, #009966 0%, #006644 45%, #004D3A 100%)",
          }}
        >
          {/* Dekorasi: dot pattern + glow */}
          <div className="absolute inset-0 opacity-[0.16] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          {/* Label */}
          <div className="relative flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15">
              <Tag className="w-4 h-4" />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-[0.12em]">Diskon Spesial</span>
          </div>

          {/* Garis pemisah */}
          <div className="relative mt-3 h-px bg-white/20" />

          {/* Angka diskon besar */}
          <div className="relative mt-2 flex-1 flex flex-col justify-center items-center">
            {isPercent ? (
              <div className="flex items-start leading-[0.8]">
                <span className="text-[76px] font-extrabold tracking-tighter tabular-nums drop-shadow-sm">
                  {discountValue}
                </span>
                <div className="mt-2 ml-1 flex flex-col">
                  <span className="text-2xl font-bold text-[#7CE6B8] leading-none">%</span>
                  <span className="mt-1.5 text-lg font-bold tracking-wide text-white/90">OFF</span>
                </div>
              </div>
            ) : (
              <div className="py-1 text-center">
                <span className="text-4xl font-extrabold tracking-tight">
                  {formatPrice(promo.discount_value)}
                </span>
                <span className="block mt-1 text-base font-bold tracking-wide text-white/85">OFF</span>
              </div>
            )}

            {/* Eligibility */}
            <span className="mt-3 inline-flex items-center gap-1.5 text-white/90 text-xs font-semibold whitespace-nowrap">
              <User className="w-3.5 h-3.5" />
              {eligibilityText}
            </span>
          </div>

          {/* Perforated edge (notch) di sisi kanan — desktop */}
          <span className="hidden sm:block absolute -right-[10px] top-[14px] w-5 h-5 rounded-full bg-[#F2FBF7] dark:bg-primary-900" />
          <span className="hidden sm:block absolute -right-[10px] bottom-[14px] w-5 h-5 rounded-full bg-[#F2FBF7] dark:bg-primary-900" />
          <span className="hidden sm:block absolute right-0 top-8 bottom-8 border-r-2 border-dashed border-white/35" />
          {/* Notch versi mobile (di bawah panel) */}
          <span className="sm:hidden absolute -bottom-[10px] left-[14px] w-5 h-5 rounded-full bg-[#F2FBF7] dark:bg-primary-900" />
          <span className="sm:hidden absolute -bottom-[10px] right-[14px] w-5 h-5 rounded-full bg-[#F2FBF7] dark:bg-primary-900" />
        </div>

        {/* ══════════ Panel kanan: detail promo ══════════ */}
        <div className="relative flex-1 min-w-0 flex flex-col justify-between px-5 py-4 sm:px-6 sm:py-5">
          {/* Baris atas: nama promo */}
          <div className="flex items-center min-h-[34px]">
            <h3 className="line-clamp-2 text-base sm:text-lg font-bold tracking-tight leading-snug text-[#102A24] dark:text-white">
              {promo.nama || "Promo spesial untukmu"}
            </h3>
          </div>

          {/* Aksi: box kode + tombol salin */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-[#8FD6BA] bg-white/70 dark:bg-primary-900/40 px-2.5 py-1.5">
              <div className="min-w-0">
                <span className="block text-[8px] uppercase tracking-wider text-muted-foreground leading-none">Kode Promo</span>
                <span className="block truncate font-mono font-extrabold text-[#007A55] dark:text-primary-200 text-sm leading-tight mt-0.5">
                  {promo.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(promo.code)}
                aria-label="Salin kode promo"
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[#007A55] dark:text-primary-200 hover:bg-[#E5F6EE] dark:hover:bg-primary-800/60 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(promo.code)}
              className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                copied
                  ? "bg-[#006644] shadow-[0_10px_24px_rgba(0,135,90,0.28)]"
                  : "bg-gradient-to-br from-[#009966] to-[#007A55] shadow-[0_12px_28px_rgba(0,135,90,0.24)] hover:shadow-[0_18px_34px_rgba(0,135,90,0.30)]"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Ticket className="w-3.5 h-3.5" /> Salin Kode
                </>
              )}
            </button>
          </div>

          {/* Ringkasan benefit bawah */}
          <div className="pt-2.5 border-t border-[#D8EEE5] dark:border-primary-800 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tag className="w-3.5 h-3.5 text-[#007A55] dark:text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-muted-foreground leading-none">Diskon</span>
                <span className="block truncate text-[11px] sm:text-xs font-bold text-foreground mt-0.5">{discountLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Wallet className="w-3.5 h-3.5 text-[#007A55] dark:text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-muted-foreground leading-none">Maks. potongan</span>
                <span className="block truncate text-[11px] sm:text-xs font-bold text-foreground mt-0.5">{maxDiscountLabel || "Tanpa batas"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-[#007A55] dark:text-primary-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-muted-foreground leading-none">Berlaku hingga</span>
                <span className="block truncate text-[11px] sm:text-xs font-bold text-foreground mt-0.5">{validUntil || "Tanpa batas"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const slides = hasMultiple
    ? [promos[count - 1], ...promos, promos[0]]
    : promos
  const trackPosition = hasMultiple ? position : 0
  const activeIndex = hasMultiple ? (((position - 1) % count) + count) % count : 0

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Promo sebelumnya"
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#A8DEC8] text-[#007A55] hover:bg-[#E5F6EE] hover:scale-105 transition-all shadow-soft"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Promo berikutnya"
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#A8DEC8] text-[#007A55] hover:bg-[#E5F6EE] hover:scale-105 transition-all shadow-soft"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="overflow-hidden rounded-[28px]">
          <motion.div
            className="flex"
            animate={{ x: `-${trackPosition * 100}%` }}
            transition={{ duration: enableTransition ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={handleAnimComplete}
          >
            {slides.map((p, i) => (
              <div key={i} className="w-full flex-shrink-0 px-0.5">
                {renderCard(p)}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Dot indikator ──────────────────────────────────── */}
      {hasMultiple && (
        <div className="mt-3.5 flex items-center justify-center gap-1.5">
          {promos.map((p, i) => (
            <button
              key={p.code}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Promo ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === activeIndex ? "22px" : "8px",
                height: "8px",
                background: i === activeIndex ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.25)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
