import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/Button"
import { Card, CardContent } from "../components/ui/card"
import {
  ArrowRight, ShieldCheck, Package, MousePointerClick,
  Search, BadgeCheck, Clock, Heart, Tv, TreePine, PartyPopper, Car,
  Menu, X, Rocket, LayoutDashboard, LogOut, BookOpen,
} from "lucide-react"

function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const homeRoute = isAdmin || isSuperAdmin ? "/dashboard" : "/home"

  const handleLogout = () => {
    logout()
    navigate("/")
    setOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/sewainLogo.webp" alt="Sewain" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-bold text-xl text-foreground">Sewain</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
          <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kategori</a>
          <Link to="/catalog" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            <BookOpen className="w-4 h-4" /> Katalog
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden lg:block">
                Halo, <span className="font-semibold text-foreground">{user?.nama?.split(" ")[0]}</span>
              </span>
              <Link to={homeRoute}>
                <Button>
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Buka Dashboard
                </Button>
              </Link>
              <button onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login"><Button>Masuk / Daftar</Button></Link>
          )}
        </div>
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-card border-b px-4 pb-4 space-y-2">
          <a href="#features" className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Fitur</a>
          <a href="#categories" className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Kategori</a>
          <Link to="/catalog" className="flex items-center gap-1.5 py-2 text-sm font-semibold text-primary" onClick={() => setOpen(false)}>
            <BookOpen className="w-4 h-4" /> Katalog
          </Link>
          {isAuthenticated ? (
            <>
              <Link to={homeRoute} onClick={() => setOpen(false)}>
                <Button className="w-full mt-2">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Buka Dashboard
                </Button>
              </Link>
              <button onClick={handleLogout} className="w-full mt-1 text-sm text-destructive flex items-center justify-center gap-1 py-2">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}><Button className="w-full mt-2">Masuk / Daftar</Button></Link>
          )}
        </div>
      )}
    </nav>
  )
}

const stats = [
  { value: "500+", label: "Barang Tersedia" },
  { value: "1.2K", label: "Penyewa Aktif" },
  { value: "50+", label: "Penyedia Terpercaya" },
  { value: "4.8\u2605", label: "Rating Pengguna" },
]

const aboutCards = [
  { icon: ShieldCheck, title: "Terpercaya", desc: "Setiap penyewa wajib verifikasi KTP sehingga transaksi lebih aman untuk semua pihak." },
  { icon: Package, title: "Lengkap", desc: "Dari elektronik hingga peralatan outdoor, temukan ratusan barang dari berbagai penyedia." },
  { icon: MousePointerClick, title: "Mudah", desc: "Proses sewa yang simpel \u2014 pilih, ajukan, dan gunakan. Semudah belanja online." },
]

const features = [
  { icon: Search, title: "Cari & Filter", desc: "Temukan barang yang kamu butuhkan dengan pencarian cepat dan filter kategori." },
  { icon: BadgeCheck, title: "Terverifikasi", desc: "Semua penyewa diverifikasi KTP untuk keamanan transaksi sewa." },
  { icon: Clock, title: "Sewa Fleksibel", desc: "Pilih durasi sewa sesuai kebutuhanmu, mulai dari harian." },
  { icon: Heart, title: "Komunitas", desc: "Bergabung dengan ribuan penyewa dan penyedia barang terpercaya." },
]

const categories = [
  { icon: Tv, name: "Elektronik" },
  { icon: TreePine, name: "Outdoor" },
  { icon: PartyPopper, name: "Pesta" },
  { icon: Car, name: "Kendaraan" },
]

const steps = [
  { num: "01", title: "Daftar & Verifikasi", desc: "Buat akun dan lengkapi profil dengan KTP untuk verifikasi." },
  { num: "02", title: "Pilih Barang", desc: "Jelajahi katalog dan temukan barang yang kamu butuhkan." },
  { num: "03", title: "Ajukan Sewa", desc: "Pilih tanggal sewa, lihat total biaya, dan ajukan permintaan." },
  { num: "04", title: "Selesai!", desc: "Setelah disetujui penyedia, ambil barang dan nikmati!" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 bg-hero-pattern">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4 text-sm px-4 py-1.5 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-medium">
              <Rocket className="w-4 h-4" /> Platform Sewa #1 Indonesia
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
              Sewa Apapun,{" "}
              <span className="text-gradient-hero">Kapanpun</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Sewain menghubungkan penyewa dengan penyedia barang terpercaya. Hemat biaya, ramah lingkungan, dan mudah digunakan.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/catalog">
                <Button size="lg" className="text-base px-8">
                  <BookOpen className="w-4 h-4 mr-2" /> Lihat Katalog
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Mulai Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <video
              src="/sewainVideo.MP4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full max-w-md mx-auto drop-shadow-xl rounded-2xl object-cover"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <Card key={i} className="text-center border-none shadow-md">
                <CardContent className="p-5">
                  <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-section-alt py-20" id="about">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="mb-3 text-sm font-medium text-primary">Tentang Kami</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Kenapa Memilih Sewain?</h2>
            <p className="mt-4 text-muted-foreground">
              Sewain adalah platform marketplace sewa barang yang mengedepankan kepercayaan, keamanan, dan kemudahan. Tidak perlu membeli, cukup sewa!
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {aboutCards.map((c, i) => (
              <Card key={i} className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <c.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" id="features">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="mb-3 text-sm font-medium text-primary">Fitur Unggulan</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Semua yang Kamu Butuhkan</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((f, i) => (
              <Card key={i} className="h-full hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                    <f.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-section-alt py-20" id="categories">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="mb-3 text-sm font-medium text-primary">Kategori Populer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Jelajahi Kategori</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {categories.map((c, i) => (
              <Card key={i} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center mx-auto mb-3 transition-colors">
                    <c.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-bold text-foreground">{c.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="mb-3 text-sm font-medium text-primary">Cara Kerja</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">4 Langkah Mudah</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black text-primary/15 mb-2">{s.num}</div>
                <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Siap Untuk Mulai Menyewa?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Bergabung sekarang dan nikmati kemudahan sewa barang dari penyedia terpercaya di seluruh Indonesia.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/catalog">
              <Button size="lg" variant="secondary" className="text-base px-8">
                <BookOpen className="w-4 h-4 mr-2" /> Lihat Katalog
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Daftar Gratis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Sewain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Platform sewa barang terpercaya di Indonesia. Hemat biaya, ramah lingkungan.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            &copy; {new Date().getFullYear()} Sewain Platform &middot; Kelompok Harahetta-2
          </p>
        </div>
      </footer>
    </div>
  )
}
