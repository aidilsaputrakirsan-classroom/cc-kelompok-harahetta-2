import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/Button"
import {
  Package, Code2, Server, Container, GitBranch,
  Users, BookOpen, ArrowLeft, Zap, Shield, Globe,
} from "lucide-react"
import { motion } from "framer-motion"
import Navbar from "../components/Layout/Navbar"

/* ─── Animation variants ──────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
}

const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  hover: {
    y: -8,
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
}

/* ─── Reusable section header ─────────────────────────────── */

function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <motion.p
        className="mb-3 text-sm font-medium text-primary"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {label}
      </motion.p>
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-foreground"
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="mt-4 text-muted-foreground"
          variants={fadeUp}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

const aboutLinks = [
  { label: "Beranda", to: "/" },
  { label: "Katalog", to: "/catalog", primary: true },
]

/* ─── Data ────────────────────────────────────────────────── */

const techStack = [
  {
    icon: Server,
    name: "Backend",
    value: "FastAPI + PostgreSQL",
    desc: "API performa tinggi dengan database relasional yang handal.",
  },
  {
    icon: Code2,
    name: "Frontend",
    value: "React + Vite",
    desc: "Antarmuka modern dan responsif dengan build tool yang super cepat.",
  },
  {
    icon: Container,
    name: "Container",
    value: "Docker + Compose",
    desc: "Deployment terkontainer untuk konsistensi di setiap environment.",
  },
  {
    icon: GitBranch,
    name: "CI/CD",
    value: "GitHub Actions",
    desc: "Pipeline otomatis untuk build, test, dan deployment berkelanjutan.",
  },
]

const highlights = [
  { icon: Zap, title: "Cloud Native", desc: "Dibangun dari awal dengan arsitektur cloud-native yang scalable dan resilient." },
  { icon: Shield, title: "Aman & Terverifikasi", desc: "Setiap penyewa diverifikasi KTP untuk menjamin keamanan transaksi semua pihak." },
  { icon: Globe, title: "Mata Kuliah CC", desc: "Proyek akhir Komputasi Awan (Cloud Computing) Institut Teknologi Kalimantan." },
]

const team = [
  {
    name: "Djaky Abbyyu Fauzan Timumum",
    nim: "10231032",
    role: "Lead Backend",
    photo: "/team/djaky.jpeg",
    desc: "Bertanggung jawab atas arsitektur API, database, dan logika bisnis aplikasi.",
  },
  {
    name: "Achmad Zaki Zaidan",
    nim: "10231002",
    role: "Lead Frontend",
    photo: "/team/zaki.jpeg",
    desc: "Memimpin pengembangan antarmuka pengguna yang intuitif dan responsif.",
  },
  {
    name: "Muhammad Alif Setiawan",
    nim: "10231056",
    role: "Lead DevOps",
    photo: "/team/alif.jpeg",
    desc: "Mengelola infrastruktur cloud, containerisasi, dan pipeline CI/CD.",
  },
  {
    name: "Riqqah Khalda Karina",
    nim: "10231082",
    role: "Lead QA & Docs",
    photo: "/team/riqqah.png",
    desc: "Memastikan kualitas produk melalui pengujian menyeluruh dan dokumentasi lengkap.",
  },
]

/* ─── MemberCard ──────────────────────────────────────────── */

function MemberCard({ member, index }) {
  const [imgError, setImgError] = useState(false)
  const initial = member.name[0].toUpperCase()

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      whileHover="hover"
      animate="rest"
      initial_variants={cardHover}
    >
      <motion.div variants={cardHover} className="rounded-xl overflow-hidden border bg-card h-full">
        {/* Photo */}
        <div className="relative w-full aspect-square bg-primary/5 overflow-hidden">
          {!imgError ? (
            <motion.img
              src={member.photo}
              alt={member.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/25">
              <motion.span
                className="text-7xl font-black text-primary/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "backOut" }}
              >
                {initial}
              </motion.span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          {/* Role badge */}
          <motion.div
            className="absolute bottom-3 left-3"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
          >
            <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
              {member.role}
            </span>
          </motion.div>
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="font-bold text-foreground text-base leading-snug">{member.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">NIM: {member.nim}</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{member.desc}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Floating orbs background decoration ────────────────── */

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/4 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar links={aboutLinks} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-16 bg-hero-pattern relative overflow-hidden">
        <FloatingOrbs />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group"
            >
              <motion.span whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 400 }}>
                <ArrowLeft className="w-4 h-4" />
              </motion.span>
              Kembali ke Beranda
            </Link>
          </motion.div>

          {/* Badge */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
          >
            <span className="text-sm px-4 py-1.5 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-medium">
              <motion.span
                animate={{ rotate: [0, 15, -10, 15, 0] }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
              >
                <Package className="w-4 h-4" />
              </motion.span>
              Kelompok Harahetta-2
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mt-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Tentang{" "}
            <motion.span
              className="text-gradient-hero inline-block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              Sewain
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Platform marketplace sewa barang berbasis cloud yang dibangun sebagai proyek akhir
            mata kuliah Komputasi Awan, Institut Teknologi Kalimantan.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/catalog">
                <Button size="lg" className="text-base px-8">
                  <BookOpen className="w-4 h-4 mr-2" /> Lihat Katalog
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Mulai Menyewa
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16 flex flex-col items-center gap-1.5 opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-xs text-muted-foreground tracking-widest uppercase">Scroll</span>
            <motion.div
              className="w-0.5 h-8 bg-primary/40 rounded-full origin-top"
              animate={{ scaleY: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Highlights ───────────────────────────────────── */}
      <section className="bg-section-alt py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            label="Tentang Proyek"
            title="Apa itu Sewain?"
            subtitle="Sewain menghubungkan penyewa dengan penyedia barang terpercaya. Tidak perlu membeli, cukup sewa — hemat biaya dan ramah lingkungan."
          />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {highlights.map((h, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h.icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground">{h.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{h.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            label="Teknologi"
            title="Tech Stack"
            subtitle="Dibangun menggunakan teknologi modern dan industri-standard untuk performa dan skalabilitas optimal."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {techStack.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ y: -6 }}
              >
                <Card className="h-full group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mx-auto mb-4 transition-colors"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <t.icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">{t.name}</p>
                    <h3 className="text-base font-bold text-foreground">{t.value}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{t.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────── */}
      <section className="bg-section-alt py-20" id="tim">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            label="Tim Pengembang"
            title={
              <span className="flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: [0, -10, 10, -5, 0] }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
                >
                  <Users className="w-8 h-8 text-primary" />
                </motion.span>
                Kelompok Harahetta-2
              </span>
            }
            subtitle="Empat mahasiswa Institut Teknologi Kalimantan yang berkolaborasi membangun platform Sewain dari nol hingga deployment di cloud."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {team.map((member, i) => (
              <MemberCard key={i} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <motion.footer
        className="py-8 border-t"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Sewain</span>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Platform sewa barang terpercaya di Indonesia. Hemat biaya, ramah lingkungan.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            &copy; {new Date().getFullYear()} Sewain Platform &middot; Kelompok Harahetta-2
          </p>
        </div>
      </motion.footer>
    </div>
  )
}
