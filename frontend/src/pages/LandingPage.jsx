/**
 * LandingPage — Sewain
 * Modern minimalist · base hijau pekat + putih.
 * Card-card siap diisi gambar / video dengan attribute data-media-slot.
 */
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { motion } from "framer-motion"
import Navbar from "../components/Layout/Navbar"
import Footer from "../components/Layout/Footer"
import { fetchPublicStats } from "../services/api"
import {
  ArrowRight, ArrowUpRight, Search, ShieldCheck, Sparkles, Star,
  Wallet, MapPin, MessageSquare, Camera, Tent, Zap, Box, ChevronDown,
  CheckCircle2, Quote,
} from "lucide-react"

/* ─── motion helpers ──────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease, delay },
})

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const child = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

/* ─── reusable: MediaSlot ─────────────────────────────────────
   Card kosong dengan border halus, siap kamu isi gambar/video.
   Tinggal ganti `<MediaSlot src="...gambar.jpg" />` atau pakai
   <MediaSlot video="...video.mp4" />.
─────────────────────────────────────────────────────────────── */
function MediaSlot({
  src,
  video,
  alt = "",
  label = "Media",
  ratio = "aspect-[4/3]",
  className = "",
  rounded = "rounded-3xl",
  children,
  poster,
  objectPosition = "center",
}) {
  return (
    <div
      className={`relative ${ratio} ${rounded} overflow-hidden border border-border bg-secondary/40 ${className}`}
      data-media-slot={label}
    >
      {/* Real media */}
      {video ? (
        <video
          src={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : src ? (
        <img
          src={src}
          alt={alt}
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        /* Placeholder pattern */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 via-background to-secondary text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              Media Slot
            </p>
            <p className="text-sm text-muted-foreground max-w-[18ch]">
              {label}
            </p>
          </div>
        </div>
      )}

      {/* Optional overlay content (badge, caption) */}
      {children}

      {/* Decorative border glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-border/0 group-hover:ring-primary/20 transition" />
    </div>
  )
}

/* ─── data ────────────────────────────────────────────────── */

const stats = [
  { value: "1K+",  label: "Barang siap sewa" },
  { value: "500+", label: "Mitra penyedia" },
  { value: "50K+", label: "Transaksi sukses" },
  { value: "4.9",  label: "Rating pengguna" },
]

const features = [
  {
    icon: ShieldCheck,
    title: "Verifikasi KTP berlapis",
    desc: "Setiap penyewa diverifikasi e-KTP + selfie supaya transaksi aman.",
  },
  {
    icon: Wallet,
    title: "Pembayaran aman via Midtrans",
    desc: "Bayar lewat e-wallet, VA, kartu kredit, atau QRIS — semua otomatis terverifikasi.",
  },
  {
    icon: MapPin,
    title: "Lokasi pickup di peta",
    desc: "Tahu persis titik ambil & kembali barang lewat peta interaktif.",
  },
  {
    icon: MessageSquare,
    title: "Asisten chat 24/7",
    desc: "Chatbot pintar siap bantu cari barang dan jawab pertanyaan kamu.",
  },
]

const categories = [
  { icon: Camera, name: "Elektronik",  desc: "Kamera, drone, audio.",          img: "/images/categories/elektronik.png" },
  { icon: Tent,   name: "Outdoor",     desc: "Camping, hiking, sport.",         img: "/images/categories/outdoor.png" },
  { icon: Zap,    name: "Event",       desc: "Lighting, sound, panggung.",      img: "/images/categories/pesta.png" },
  { icon: Box,    name: "Lainnya",     desc: "Alat masak, kostum, dll.",        img: "/images/categories/lainnya.png" },
]

const steps = [
  { n: "01", title: "Verifikasi akun",      desc: "Daftar dan unggah KTP + selfie. Beres dalam beberapa menit.", icon: ShieldCheck, bg: "/images/hero/section3.png" },
  { n: "02", title: "Pilih barang",         desc: "Telusuri katalog, banding harga, pilih dari mitra terdekat.", icon: Search, bg: "/images/hero/section4.png" },
  { n: "03", title: "Bayar & ambil",        desc: "Bayar lewat metode pilihanmu, ambil sesuai titik di peta.",   icon: Wallet, bg: "/images/hero/section5.png" },
  { n: "04", title: "Nikmati & kembalikan", desc: "Pakai sepuasnya, kembalikan tepat waktu — done.",             icon: CheckCircle2, bg: "/images/hero/section6.png" },
]

const testimonials = [
  {
    quote: "Sewa drone untuk acara kantor cuma butuh dua jam dari ajukan sampai diterima.",
    name: "Rana",
    role: "Event organizer",
  },
  {
    quote: "Verifikasi KTP-nya bikin tenang. Penyewa serius, barang balik lengkap.",
    name: "Bagas",
    role: "Mitra penyedia",
  },
  {
    quote: "UI-nya bersih, peta pickup-nya akurat. Jadi enggak nyasar saat ambil barang.",
    name: "Citra",
    role: "Mahasiswa",
  },
]

/* ─── page ────────────────────────────────────────────────── */

const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Katalog", to: "/catalog" },
  { label: "Tentang", to: "/about" },
  { label: "Mulai",   to: "/login" },
]

export default function LandingPage() {
  const [activeUsers, setActiveUsers] = useState(0)
  const [heroSearch, setHeroSearch] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchPublicStats()
      .then(data => setActiveUsers(data?.active_users || 0))
      .catch(() => {})
  }, [])

  const handleHeroSearch = (e) => {
    e.preventDefault()
    const q = heroSearch.trim()
    if (q) {
      navigate(`/catalog?search=${encodeURIComponent(q)}`)
    } else {
      navigate("/catalog")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 md:pt-32 md:pb-28 bg-hero-pattern overflow-hidden">
        {/* dotted ambient */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Copy */}
            <div className="lg:col-span-7">
              <motion.div {...fadeUp(0)}>
                <span className="chip">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Marketplace sewa barang #1 di Dunia
                </span>
              </motion.div>

              <motion.h1
                {...fadeUp(0.05)}
                className="relative mt-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                {/* Background image behind text — tilted for aesthetic */}
                <img
                  src="/images/hero/cardkecil.jpg"
                  alt=""
                  aria-hidden="true"
                  className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-56 md:w-72 lg:w-80 h-auto rounded-3xl opacity-25 rotate-[6deg] pointer-events-none select-none"
                />
                <span className="relative z-10">
                  Sewa apa saja,{" "}
                  <span className="font-display text-primary">tanpa</span>
                  {" "}harus beli.
                </span>
              </motion.h1>

              <motion.p
                {...fadeUp(0.1)}
                className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
              >
                Sewain menghubungkan kamu dengan ribuan penyedia barang terverifikasi.
                Mulai dari kamera, alat camping, hingga peralatan event. Semua dalam
                satu platform yang aman, cepat, dan transparan.
              </motion.p>

              {/* Search bar */}
              <motion.form
                {...fadeUp(0.15)}
                onSubmit={handleHeroSearch}
                className="mt-8 flex items-center bg-card border border-border rounded-full p-1.5 pl-5 shadow-soft max-w-xl focus-within:ring-2 focus-within:ring-primary/30 transition"
              >
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Coba ketik 'Kamera Sony'..."
                  className="bg-transparent border-none outline-none flex-1 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <Button type="submit" className="rounded-full px-5 h-10">
                  Cari
                </Button>
              </motion.form>

              {/* Trust line */}
              <motion.div
                {...fadeUp(0.2)}
                className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-full px-4 py-2">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-40" />
                    <span className="relative w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {activeUsers > 0 ? activeUsers.toLocaleString("id-ID") : "—"}
                  </span>
                  <span>pengguna aktif</span>
                </div>
              </motion.div>
            </div>

            {/* Hero media · stacked cards */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease, delay: 0.2 }}
                className="relative"
              >
                {/* Big card */}
                <MediaSlot
                  video="/images/hero/HEROCARDVIDEO.mp4"
                  alt="Sewain — Sewa barang apa saja"
                  label="Hero · video / gambar utama"
                  ratio="aspect-[4/5]"
                  className="shadow-glow"
                  objectPosition="center 42%"
                >
                  {/* Gradient overlay bawah */}
                  <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/60 to-transparent rounded-b-3xl pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 z-10">
                    <img src="/Logo sewain.png" alt="Sewain" className="h-10 w-auto brightness-0 invert opacity-90" />
                    <span className="text-white/90 text-sm font-medium">Sewa apa saja, kapan saja.</span>
                  </div>
                </MediaSlot>

                {/* Mini stat kiri atas */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6, ease }}
                  className="absolute -left-2 -top-6 sm:-left-6 bg-card border border-border rounded-2xl shadow-soft p-3 -rotate-[3deg] flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Verified</p>
                    <p className="text-[10px] text-muted-foreground">100% identitas valid</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-14 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1.5 text-muted-foreground"
            >
              <span className="text-[10px] tracking-[0.25em] uppercase">Scroll</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE GRID
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-24 md:py-32 bg-section-alt overflow-hidden">
        {/* Background image centered behind content */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/hero/section1.png"
            alt=""
            aria-hidden="true"
            className="max-w-2xl md:max-w-3xl opacity-20"
            loading="lazy"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-16">
            <div className="md:col-span-5">
              <motion.span {...fadeUp(0)} className="chip">
                Kenapa Sewain
              </motion.span>
              <motion.h2
                {...fadeUp(0.05)}
                className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight"
              >
                Cara cerdas{" "}
                <span className="font-display text-primary">menyewa</span>{" "}
                tanpa drama.
              </motion.h2>
            </div>
            <motion.p
              {...fadeUp(0.1)}
              className="md:col-span-6 md:col-start-7 text-lg text-muted-foreground leading-relaxed"
            >
              Sewain dirancang dari nol untuk menyederhanakan setiap langkah —
              dari verifikasi identitas, pencarian, pembayaran, hingga
              pengembalian. Semua dalam satu alur yang konsisten.
            </motion.p>
          </div>

          {/* Feature grid — 2x2 seimbang */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={child}
                className="group relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/40 shadow-md p-7 lift"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
                <ArrowUpRight className="absolute top-7 right-7 w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════════════ */}
      <section id="categories" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            {/* Background image behind the header text */}
            <img
              src="/images/hero/section2.png"
              alt=""
              aria-hidden="true"
              className="absolute top-1/2 right-[15%] -translate-y-1/2 max-w-xl md:max-w-2xl opacity-25 pointer-events-none"
              loading="lazy"
            />
            <div className="relative max-w-2xl">
              <motion.span {...fadeUp(0)} className="chip">
                Kategori
              </motion.span>
              <motion.h2 {...fadeUp(0.05)} className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Mau sewa{" "}
                <span className="font-display text-primary">apa</span> hari ini?
              </motion.h2>
            </div>
            <motion.div {...fadeUp(0.1)} className="relative">
              <Link to="/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group link-underline">
                Lihat semua kategori
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {categories.map((c, i) => (
              <motion.div key={i} variants={child}>
                <Link
                  to="/catalog"
                  className="group block relative overflow-hidden rounded-3xl border border-border bg-card lift"
                >
                  <MediaSlot
                    src={c.img}
                    alt={c.name}
                    label={`Kategori · ${c.name}`}
                    ratio="aspect-[4/3]"
                    rounded="rounded-none"
                    className="border-0"
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                          <c.icon className="w-3.5 h-3.5" /> Kategori
                        </div>
                        <h3 className="mt-1.5 text-xl font-bold tracking-tight">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-hero-deep text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-dot-grid opacity-[0.05] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.span
              {...fadeUp(0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-white/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Empat langkah, selesai
            </motion.span>
            <motion.h2
              {...fadeUp(0.05)}
              className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Dari penasaran ke{" "}
              <span className="font-display text-primary-300">sewa pertama</span>{" "}
              dalam 5 menit.
            </motion.h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative"
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={child}
                className="relative overflow-visible rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-7 hover:bg-white/[0.08] transition-colors"
              >
                {/* Background image (clipped to card shape) */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <img
                    src={s.bg}
                    alt=""
                    aria-hidden="true"
                    className="absolute top-0 right-[-10%] w-[80%] h-full object-contain opacity-20"
                    loading="lazy"
                  />
                </div>

                {/* Arrow connector between cards (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-primary-300 text-primary-900 items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Number + icon inline */}
                <div className="relative flex items-center justify-between mb-4">
                  <div className="font-display text-4xl text-primary-300/60 leading-none">
                    {s.n}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-300/15 border border-primary-300/20 flex items-center justify-center text-primary-300">
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                <h3 className="relative text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="relative mt-2 text-sm text-white/70 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <motion.span {...fadeUp(0)} className="chip">
              Cerita pengguna
            </motion.span>
            <motion.h2 {...fadeUp(0.05)} className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Mereka yang{" "}
              <span className="font-display text-primary">sudah</span> coba.
            </motion.h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {testimonials.map((t, i) => (
              <motion.figure
                key={i}
                variants={child}
                className="rounded-3xl border border-border bg-card p-7 flex flex-col"
              >
                <Quote className="w-8 h-8 text-primary/30" />
                <blockquote className="mt-4 text-lg text-foreground leading-relaxed flex-1">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 pt-4 border-t border-border/60">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            {...fadeUp(0)}
            className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-hero-deep text-white px-8 py-16 md:px-16 md:py-24"
          >
            {/* mesh background */}
            <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
            <div className="absolute inset-0 bg-dot-grid opacity-[0.04] pointer-events-none" />

            <div className="relative grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-300">
                  Mulai hari ini
                </p>
                <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                  Sewa pertama kamu{" "}
                  <span className="font-display text-primary-300">menanti</span>.
                </h2>
                <p className="mt-5 text-lg text-white/70 max-w-xl">
                  Buat akun gratis, verifikasi sekali, langsung sewa kapan saja.
                </p>
              </div>

              <div className="md:col-span-5 flex md:justify-end">
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                  <Link to="/login">
                    <Button size="lg" className="w-full md:w-auto rounded-full px-8 bg-white text-primary-700 hover:bg-white/90">
                      Buat akun gratis
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link to="/catalog">
                    <Button size="lg" variant="outline" className="w-full md:w-auto rounded-full px-8 bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">
                      Lihat katalog
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
