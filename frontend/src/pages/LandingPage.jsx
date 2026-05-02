import { Link } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Card, CardContent } from "../components/ui/card"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Navbar from "../components/Layout/Navbar"
import {
  ArrowRight, ShieldCheck, Package, MousePointerClick,
  Search, BadgeCheck, Clock, Heart, Tv, TreePine, PartyPopper, Car,
  Rocket, BookOpen,
} from "lucide-react"

/* ─── Animation helpers ──────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease, delay },
})

const staggerChildren = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const childFadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

/* ─── Data ───────────────────────────────────────────────── */

const stats = [
  { value: "500+", label: "Barang Tersedia" },
  { value: "1.2K", label: "Penyewa Aktif" },
  { value: "50+",  label: "Penyedia Terpercaya" },
  { value: "4.8★", label: "Rating Pengguna" },
]

const aboutCards = [
  { icon: ShieldCheck,      title: "Terpercaya", desc: "Setiap penyewa wajib verifikasi KTP sehingga transaksi lebih aman untuk semua pihak." },
  { icon: Package,          title: "Lengkap",    desc: "Dari elektronik hingga peralatan outdoor, temukan ratusan barang dari berbagai penyedia." },
  { icon: MousePointerClick,title: "Mudah",      desc: "Proses sewa yang simpel — pilih, ajukan, dan gunakan. Semudah belanja online." },
]

const features = [
  { icon: Search,     title: "Cari & Filter",  desc: "Temukan barang yang kamu butuhkan dengan pencarian cepat dan filter kategori." },
  { icon: BadgeCheck, title: "Terverifikasi",  desc: "Semua penyewa diverifikasi KTP untuk keamanan transaksi sewa." },
  { icon: Clock,      title: "Sewa Fleksibel", desc: "Pilih durasi sewa sesuai kebutuhanmu, mulai dari harian." },
  { icon: Heart,      title: "Komunitas",      desc: "Bergabung dengan ribuan penyewa dan penyedia barang terpercaya." },
]

const categories = [
  { icon: Tv,          name: "Elektronik" },
  { icon: TreePine,    name: "Outdoor" },
  { icon: PartyPopper, name: "Pesta" },
  { icon: Car,         name: "Kendaraan" },
]

const steps = [
  { num: "01", title: "Daftar & Verifikasi", desc: "Buat akun dan lengkapi profil dengan KTP untuk verifikasi." },
  { num: "02", title: "Pilih Barang",        desc: "Jelajahi katalog dan temukan barang yang kamu butuhkan." },
  { num: "03", title: "Ajukan Sewa",         desc: "Pilih tanggal sewa, lihat total biaya, dan ajukan permintaan." },
  { num: "04", title: "Selesai!",            desc: "Setelah disetujui penyedia, ambil barang dan nikmati!" },
]

const landingLinks = [
  { label: "Fitur",    href: "#features" },
  { label: "Kategori", href: "#categories" },
  { label: "Tentang",  to: "/about" },
  { label: "Katalog",  to: "/catalog", primary: true },
]

/* ─── Floating blobs background ─────────────────────────── */

function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-primary/6 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  )
}

/* ─── Section header ─────────────────────────────────────── */

function SectionHeader({ tag, title, subtitle, light = false }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <motion.p
        {...fadeUp(0)}
        className={`mb-3 text-sm font-semibold tracking-widest uppercase ${light ? "text-primary-foreground/70" : "text-primary"}`}
      >
        {tag}
      </motion.p>
      <motion.h2
        {...fadeUp(0.1)}
        className={`text-3xl md:text-4xl font-bold ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          {...fadeUp(0.2)}
          className={`mt-4 text-base leading-relaxed ${light ? "text-primary-foreground/75" : "text-muted-foreground"}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar links={landingLinks} />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative pt-16 bg-hero-pattern overflow-hidden">
        <HeroBlobs />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col-reverse md:flex-row items-center gap-12">

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="mb-5"
            >
              <span className="text-sm px-4 py-1.5 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-medium">
                <motion.span
                  animate={{ rotate: [0, 15, -10, 10, 0] }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                >
                  <Rocket className="w-4 h-4" />
                </motion.span>
                Platform Sewa #1 Indonesia
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
            >
              Sewa Apapun,{" "}
              <motion.span
                className="text-gradient-hero inline-block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease }}
              >
                Kapanpun
              </motion.span>
            </motion.h1>

            <motion.p
              className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Sewain menghubungkan penyewa dengan penyedia barang terpercaya.
              Hemat biaya, ramah lingkungan, dan mudah digunakan.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.52 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/catalog">
                  <Button size="lg" className="text-base px-8 shadow-lg shadow-primary/25">
                    <BookOpen className="w-4 h-4 mr-2" /> Lihat Katalog
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="text-base px-8">
                    Mulai Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Video */}
          <motion.div
            className="flex-1 w-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <video
                src="/sewainVideo.MP4"
                autoPlay loop muted playsInline
                className="w-full max-w-md mx-auto rounded-3xl object-cover shadow-2xl shadow-primary/20 ring-1 ring-primary/10"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-5xl mx-auto px-4 pb-16">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerChildren}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={childFadeUp}>
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-5">
                    <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ WHY SEWAIN ════════════════════════════════════════ */}
      <section className="bg-section-alt py-24" id="about">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            tag="Tentang Kami"
            title="Kenapa Memilih Sewain?"
            subtitle="Platform marketplace sewa barang yang mengedepankan kepercayaan, keamanan, dan kemudahan. Tidak perlu membeli, cukup sewa!"
          />
          <motion.div
            className="grid md:grid-cols-3 gap-6 mt-14"
            variants={staggerChildren}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {aboutCards.map((c, i) => (
              <motion.div key={i} variants={childFadeUp} whileHover={{ y: -8 }}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/60">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <c.icon className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{c.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="py-24" id="features">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            tag="Fitur Unggulan"
            title="Semua yang Kamu Butuhkan"
            subtitle="Kami menyediakan fitur lengkap untuk pengalaman sewa yang aman, mudah, dan menyenangkan."
          />
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14"
            variants={staggerChildren}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={childFadeUp} whileHover={{ y: -6 }}>
                <Card className="h-full group hover:shadow-xl transition-all duration-300 border-border/60">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center mx-auto mb-4 transition-colors duration-300"
                      whileHover={{ scale: 1.1 }}
                    >
                      <f.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </motion.div>
                    <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════ */}
      <section className="bg-section-alt py-24" id="categories">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            tag="Kategori Populer"
            title="Jelajahi Kategori"
            subtitle="Temukan berbagai pilihan barang dari kategori yang beragam sesuai kebutuhanmu."
          />
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14"
            variants={staggerChildren}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {categories.map((c, i) => (
              <motion.div key={i} variants={childFadeUp}>
                <Link to="/catalog">
                  <motion.div whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-border/60">
                      <CardContent className="p-8 text-center">
                        <motion.div
                          className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center mx-auto mb-4 transition-colors duration-300"
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <c.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </motion.div>
                        <h3 className="font-bold text-foreground">{c.name}</h3>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            tag="Cara Kerja"
            title="4 Langkah Mudah"
            subtitle="Dari daftar sampai dapat barang, semuanya simpel dan cepat."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease, delay: 0.4 }}
              />
            </div>

            {steps.map((s, i) => (
              <motion.div
                key={i}
                className="text-center relative"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.15 }}
              >
                <motion.div
                  className="text-6xl font-black text-primary/12 mb-3 leading-none"
                  whileInView={{ opacity: [0, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                >
                  {s.num}
                </motion.div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-black text-sm">{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.h2
            {...fadeUp(0)}
            className="text-3xl md:text-4xl font-bold text-primary-foreground"
          >
            Siap Untuk Mulai Menyewa?
          </motion.h2>
          <motion.p
            {...fadeUp(0.1)}
            className="mt-4 text-primary-foreground/80 text-lg leading-relaxed"
          >
            Bergabung sekarang dan nikmati kemudahan sewa barang dari penyedia terpercaya.
          </motion.p>
          <motion.div
            {...fadeUp(0.2)}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link to="/catalog">
                <Button size="lg" variant="secondary" className="text-base px-8 shadow-xl">
                  <BookOpen className="w-4 h-4 mr-2" /> Lihat Katalog
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link to="/login">
                <Button
                  size="lg" variant="outline"
                  className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Daftar Gratis <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <motion.footer
        className="py-10 border-t"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">Sewain</span>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Platform sewa barang terpercaya di Indonesia. Hemat biaya, ramah lingkungan.
          </p>
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-muted-foreground">
            <Link to="/catalog" className="hover:text-foreground transition-colors">Katalog</Link>
            <Link to="/about"   className="hover:text-foreground transition-colors">Tentang</Link>
            <Link to="/login"   className="hover:text-foreground transition-colors">Masuk</Link>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-5">
            &copy; {new Date().getFullYear()} Sewain Platform &middot; Kelompok Harahetta-2
          </p>
        </div>
      </motion.footer>
    </div>
  )
}
