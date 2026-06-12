/**
 * ShopProfilePage — Sewain
 * Profil publik toko: header (foto, nama usaha, telepon, rating, alamat),
 * tab Barang (grid item milik toko), tab Review, tab Tentang (peta + alamat).
 */
import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, Store, Phone, MapPin, CheckCircle, Package,
  ShoppingCart, MessageCircle, Loader2, Star,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import {
  fetchShop, fetchShopItems, fetchShopReviews,
} from "../services/api"
import { openChatRoomForItem } from "../services/chat"
import { formatPrice } from "../lib/utils"

import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/Skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import RatingStars from "../components/RatingStars"
import ReviewSummary from "../components/ReviewSummary"
import ReviewList from "../components/ReviewList"

const ITEM_FALLBACK = (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || "I")}&background=0a6e4a&color=fff&size=400&bold=true`
const SHOP_FALLBACK = (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || "T")}&background=0a6e4a&color=fff&size=240&bold=true`

const STATUS_META = {
  available:   { label: "Tersedia",       cls: "bg-white/90 text-emerald-700 backdrop-blur-sm border border-emerald-200" },
  rented:      { label: "Disewa",         cls: "bg-white/90 text-amber-700 backdrop-blur-sm border border-amber-200" },
  unavailable: { label: "Tidak tersedia", cls: "bg-white/90 text-muted-foreground backdrop-blur-sm border border-border" },
}

function ShopItemCard({ item }) {
  const navigate = useNavigate()
  const st = STATUS_META[item.status] || STATUS_META.unavailable
  return (
    <button
      type="button"
      onClick={() => navigate(`/items/${item.id}`)}
      className="group text-left rounded-2xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={item.foto_url || ITEM_FALLBACK(item.nama)}
          alt={item.nama}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = ITEM_FALLBACK(item.nama) }}
        />
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
          {st.label}
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h4 className="text-sm font-semibold truncate">{item.nama}</h4>
        <p className="text-xs text-muted-foreground">Stok: {item.stok}</p>
        <p className="text-sm font-bold text-primary mt-auto">
          {formatPrice(item.harga_per_hari)} <span className="text-[10px] font-medium text-muted-foreground">/hari</span>
        </p>
      </div>
    </button>
  )
}

export default function ShopProfilePage({ addToast }) {
  const { adminId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth()

  const [shop, setShop]               = useState(null)
  const [items, setItems]             = useState([])
  const [itemsTotal, setItemsTotal]   = useState(0)
  const [reviews, setReviews]         = useState([])
  const [reviewSummary, setReviewSum] = useState({ average: 0, total: 0, distribution: {} })
  const [reviewsTotal, setReviewsTot] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [loadingItems, setLoadingItm] = useState(false)
  const [loadingReviews, setLoadingR] = useState(false)
  const [openingChat, setOpeningChat] = useState(false)

  // Load shop
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchShop(adminId)
      .then((s) => { if (!cancelled) setShop(s) })
      .catch((err) => {
        if (!cancelled) {
          addToast?.(err.message || "Toko tidak ditemukan", "error")
          navigate("/catalog")
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [adminId, navigate, addToast])

  // Load items
  useEffect(() => {
    let cancelled = false
    setLoadingItm(true)
    fetchShopItems(adminId, { limit: 24 })
      .then((d) => {
        if (cancelled) return
        setItems(d.items || [])
        setItemsTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingItm(false) })
    return () => { cancelled = true }
  }, [adminId])

  // Load reviews
  useEffect(() => {
    let cancelled = false
    setLoadingR(true)
    fetchShopReviews(adminId, { limit: 20 })
      .then((d) => {
        if (cancelled) return
        setReviews(d.reviews || [])
        setReviewSum(d.summary || { average: 0, total: 0, distribution: {} })
        setReviewsTot(d.total || 0)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingR(false) })
    return () => { cancelled = true }
  }, [adminId])

  const handleAskAdmin = async () => {
    if (!isAuthenticated) {
      addToast?.("Login dulu untuk bisa chat dengan toko ini", "info")
      navigate("/login")
      return
    }
    if (isAdmin || isSuperAdmin) {
      addToast?.("Hanya akun penyewa yang bisa memulai chat dengan toko", "warning")
      return
    }
    // Pakai item pertama dari toko ini (atau redirect ke daftar item-nya)
    const firstItem = items?.[0]
    if (!firstItem) {
      addToast?.("Toko ini belum punya barang yang bisa dichat", "warning")
      return
    }
    setOpeningChat(true)
    try {
      const room = await openChatRoomForItem(Number(firstItem.id))
      navigate(`/chat/${room.id}`)
    } catch (err) {
      if (err.message.includes("Sesi habis")) { addToast?.("Sesi habis, silakan login kembali", "warning"); navigate("/login"); return }
      addToast?.(err.message || "Gagal membuka chat", "error")
    } finally {
      setOpeningChat(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    )
  }
  if (!shop) return null

  const hasCoords = shop.latitude != null && shop.longitude != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* HERO */}
      <header className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <img
            src={shop.foto_profil || SHOP_FALLBACK(shop.nama_usaha)}
            alt={shop.nama_usaha}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-2 ring-primary/20 flex-shrink-0"
            onError={(e) => { e.currentTarget.src = SHOP_FALLBACK(shop.nama_usaha) }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {shop.nama_usaha}
              </h1>
              {shop.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {shop.rating?.total > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <RatingStars value={shop.rating.average} size="sm" />
                  <span className="font-bold text-foreground tabular-nums">
                    {Number(shop.rating.average).toFixed(1)}
                  </span>
                  <span>({shop.rating.total} ulasan)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-muted-foreground/50" />
                  Belum ada ulasan
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Package className="w-4 h-4" /> {shop.total_items} barang
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {shop.nomor_telepon && (
                <a
                  href={`tel:${shop.nomor_telepon}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> {shop.nomor_telepon}
                </a>
              )}
              {!isAdmin && !isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleAskAdmin}
                  disabled={openingChat}
                >
                  {openingChat ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Tanya admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="h-auto bg-transparent p-0 gap-2 border-b border-border rounded-none w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="items"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-semibold"
          >
            Barang ({itemsTotal || items.length})
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-semibold"
          >
            Ulasan ({reviewsTotal})
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-semibold"
          >
            Tentang
          </TabsTrigger>
        </TabsList>

        {/* TAB — Barang */}
        <TabsContent value="items" className="mt-5">
          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Toko ini belum punya barang aktif</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <ShopItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB — Ulasan */}
        <TabsContent value="reviews" className="mt-5 space-y-5">
          <ReviewSummary summary={reviewSummary} />
          <ReviewList
            reviews={reviews}
            loading={loadingReviews}
            showItem
            emptyText="Toko ini belum punya ulasan"
          />
        </TabsContent>

        {/* TAB — Tentang */}
        <TabsContent value="about" className="mt-5 space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Nama usaha
                </p>
                <p className="text-sm font-bold">{shop.nama_usaha}</p>
              </div>
            </div>

            {shop.alamat_usaha && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Alamat
                  </p>
                  <p className="text-sm">{shop.alamat_usaha}</p>
                  {hasCoords && (
                    <a
                      href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-semibold hover:underline mt-1 inline-block"
                    >
                      Lihat di Google Maps →
                    </a>
                  )}
                </div>
              </div>
            )}

            {shop.nomor_telepon && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Telepon
                  </p>
                  <p className="text-sm">{shop.nomor_telepon}</p>
                </div>
              </div>
            )}

            {shop.created_at && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Bergabung sejak {new Date(shop.created_at).toLocaleDateString("id-ID", {
                  month: "long", year: "numeric",
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
