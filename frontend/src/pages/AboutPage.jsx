/**
 * AboutPage — Sewain
 * Modern minimalist · ritme sama dengan LandingPage.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { motion } from "framer-motion"
import Navbar from "../components/Layout/Navbar"
import Footer from "../components/Layout/Footer"
import {
  ArrowRight, ArrowLeft, ArrowUpRight, Code2, Server, Container, GitBranch,
  ShieldCheck, Cloud, Sparkles, Heart, Users, BookOpen,
} from "lucide-react"

/* ─── motion ──────────────────────────────────────────────── */
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

/* ─── data ────────────────────────────────────────────────── */
const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Katalog", to: "/catalog" },
  { label: "Tentang", to: "/about" },
  { label: "Mulai",   to: "/login" },
]

const techStack = [
  { icon: Server,    name: "Backend",   value: "FastAPI + PostgreSQL", desc: "API performa tinggi dengan database relasional yang handal." },
  { icon: Code2,     name: "Frontend",  value: "React + Vite",         desc: "Antarmuka modern dengan build tool super cepat." },
  { icon: Container, name: "Container", value: "Docker + Compose",     desc: "Deployment terkontainer, konsisten lintas environment." },
  { icon: GitBranch, name: "CI/CD",     value: "GitHub Actions",       desc: "Pipeline otomatis untuk build, test, dan deploy." },
]

const highlights = [
  { icon: Cloud,       title: "Cloud Native",          desc: "Arsitektur scalable yang dirancang sejak awal untuk cloud." },
  { icon: ShieldCheck, title: "Aman & Terverifikasi",  desc: "Setiap penyewa diverifikasi KTP — keamanan jadi prioritas." },
  { icon: Heart,       title: "Mata Kuliah CC",        desc: "Proyek akhir Komputasi Awan — Institut Teknologi Kalimantan." },
]

const team = [
  { name: "Djaky Abbyyu Fauzan Timumum", nim: "10231032", role: "Lead Backend",  photo: "/team/djaky.jpeg",
    desc: "Arsitektur API, database, dan logika bisnis aplikasi." },
  { name: "Achmad Zaki Zaidan",          nim: "10231002", role: "Lead Frontend", photo: "/team/zaki.jpeg",
    desc: "Memimpin pengembangan antarmuka pengguna yang intuitif." },
  { name: "Muhammad Alif Setiawan",      nim: "10231056", role: "Lead DevOps",   photo: "/team/alif.jpeg",
    desc: "Infrastruktur cloud, containerisasi, dan pipeline CI/CD." },
  { name: "Riqqah Khalda Karina",        nim: "10231082", role: "Lead QA & Docs", photo: "/team/riqqah.png",
    desc: "Quality assurance dan dokumentasi proyek menyeluruh." },
]

/* ─── MemberCard ──────────────────────────────────────────── */
function MemberCard({ member, index }) {
  const [imgError, setImgError] = useState(false)
  const initial = member.name[0]?.toUpperCase()

  return (
    <motion.figure
      variants={child}
      className="group rounded-3xl border border-border bg-card overflow-hidden lift"
    >
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        {!imgError ? (
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-300">
            <span className="text-7xl font-bold text-primary-700/40">{initial}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-xs font-semibold text-primary-700">
            {member.role}
          </span>
        </div>
      </div>
      <figcaption className="p-5">
        <p className="font-semibold text-foreground tracking-tight leading-snug">{member.name}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">NIM {member.nim}</p>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{member.desc}</p>
      </figcaption>
    </motion.figure>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-24 bg-hero-pattern overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.3] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.span {...fadeUp(0.05)} className="chip">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Kelompok Harahetta-2
          </motion.span>

          <motion.h1 {...fadeUp(0.1)} className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Tentang{" "}
            <span className="font-display text-primary">Sewain</span>.
          </motion.h1>

          <motion.p {...fadeUp(0.15)} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Marketplace sewa barang berbasis cloud yang dibangun sebagai proyek akhir
            mata kuliah Komputasi Awan, Institut Teknologi Kalimantan. Dibangun dengan
            tujuan mendorong gaya hidup hemat dan ramah lingkungan lewat berbagi barang.
          </motion.p>

          <motion.div {...fadeUp(0.2)} className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/catalog">
              <Button size="lg" className="rounded-full px-7">
                <BookOpen className="w-4 h-4 mr-1.5" /> Lihat katalog
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-full px-7">
                Mulai menyewa
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ HIGHLIGHTS ══════════════════════════════════════ */}
      <section className="py-24 md:py-28 bg-section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-8 mb-14">
            <div className="md:col-span-5">
              <motion.span {...fadeUp(0)} className="chip">Tentang proyek</motion.span>
              <motion.h2 {...fadeUp(0.05)} className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Tidak perlu beli,{" "}
                <span className="font-display text-primary">cukup</span> sewa.
              </motion.h2>
            </div>
            <motion.p {...fadeUp(0.1)} className="md:col-span-6 md:col-start-7 text-lg text-muted-foreground leading-relaxed">
              Sewain menghubungkan penyewa dengan penyedia barang terpercaya — sebuah platform
              kolaboratif yang dibangun di atas tumpukan teknologi cloud-native modern.
            </motion.p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {highlights.map((h, i) => (
              <motion.div
                key={i}
                variants={child}
                className="group rounded-3xl border border-border bg-card p-7 lift"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <h.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{h.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ TECH STACK ══════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-8 mb-14">
            <div className="md:col-span-5">
              <motion.span {...fadeUp(0)} className="chip">Teknologi</motion.span>
              <motion.h2 {...fadeUp(0.05)} className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Tumpukan{" "}
                <span className="font-display text-primary">modern</span>{" "}
                yang teruji.
              </motion.h2>
            </div>
            <motion.p {...fadeUp(0.1)} className="md:col-span-6 md:col-start-7 text-lg text-muted-foreground leading-relaxed">
              Pilihan teknologi yang stabil dan industri-standard supaya performa, skalabilitas,
              dan pengalaman pengembangan tetap optimal.
            </motion.p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {techStack.map((t, i) => (
              <motion.div
                key={i}
                variants={child}
                className="group rounded-3xl border border-border bg-card p-6 lift"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <t.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {t.name}
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-tight">{t.value}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ TEAM ════════════════════════════════════════════ */}
      <section id="tim" className="py-24 md:py-32 bg-section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <motion.span {...fadeUp(0)} className="chip">
              <Users className="w-3.5 h-3.5 text-primary" /> Tim pengembang
            </motion.span>
            <motion.h2 {...fadeUp(0.05)} className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Empat orang,{" "}
              <span className="font-display text-primary">satu</span> visi.
            </motion.h2>
            <motion.p {...fadeUp(0.1)} className="mt-4 text-lg text-muted-foreground">
              Mahasiswa Institut Teknologi Kalimantan yang berkolaborasi membangun platform
              Sewain dari nol hingga deploy di cloud.
            </motion.p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {team.map((m, i) => (
              <MemberCard key={i} member={m} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            {...fadeUp(0)}
            className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-hero-deep text-white px-8 py-16 md:px-16 md:py-20 text-center"
          >
            <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
            <div className="absolute inset-0 bg-dot-grid opacity-[0.05] pointer-events-none" />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-300">
                Selalu terbuka untuk kolaborasi
              </p>
              <h2 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
                Siap sewa pertama{" "}
                <span className="font-display text-primary-300">kamu</span>?
              </h2>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/catalog">
                  <Button size="lg" className="rounded-full px-7 bg-white text-primary-700 hover:bg-white/90">
                    Lihat katalog
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-7 bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">
                    Mulai gratis
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
