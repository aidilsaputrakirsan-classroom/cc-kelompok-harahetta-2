/**
 * Public Footer — Sewain
 * Minimalist, hijau pekat sebagai aksen.
 */
import { Link } from "react-router-dom"
import { Package, Globe, Mail, MapPin } from "lucide-react"

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <img
                src="/logo-sewain.png"
                alt="Sewain"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
              <div className="hidden h-10 items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-tight text-primary">Sewain</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Marketplace sewa barang berbasis cloud — sewa apa saja dari penyedia terpercaya,
              tanpa harus beli.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                aria-label="GitHub"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@sewain.id"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> Balikpapan, ID
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Produk
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/catalog" className="hover:text-primary transition-colors">Katalog</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Daftar</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">Tentang</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Sumber
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Bantuan</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Kontak</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Mulai sekarang
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Buat akun gratis dan mulai sewa hari ini.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Mulai gratis →
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {year} Sewain · Kelompok Harahetta-2 · Institut Teknologi Kalimantan</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-primary transition-colors">Tim</Link>
            <a href="#" className="hover:text-primary transition-colors">Syarat</a>
            <a href="#" className="hover:text-primary transition-colors">Privasi</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
