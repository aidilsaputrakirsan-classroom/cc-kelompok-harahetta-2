/**
 * ReviewForm — modal form untuk membuat / mengedit review.
 *
 * Props:
 * - open       : boolean
 * - onClose    : () => void
 * - initial    : { rating?, komentar? }   (untuk edit mode)
 * - onSubmit   : ({ rating, komentar }) => Promise<void>
 * - itemNama   : string (display)
 */
import { useState, useEffect } from "react"
import { Loader2, X, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/Dialog"
import { Button } from "./ui/Button"
import RatingStars from "./RatingStars"

const RATING_LABEL = {
  1: "Sangat kecewa",
  2: "Kurang puas",
  3: "Cukup",
  4: "Bagus",
  5: "Sangat puas!",
}

export default function ReviewForm({
  open,
  onClose,
  initial = null,
  onSubmit,
  itemNama = "",
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [komentar, setKomentar] = useState(initial?.komentar ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState("")

  useEffect(() => {
    if (open) {
      setRating(initial?.rating ?? 0)
      setKomentar(initial?.komentar ?? "")
      setErr("")
    }
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating < 1) {
      setErr("Pilih rating bintang dulu")
      return
    }
    setErr("")
    setSubmitting(true)
    try {
      await onSubmit({ rating, komentar: komentar.trim() || null })
      onClose?.()
    } catch (e2) {
      setErr(e2?.message || "Gagal mengirim review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initial ? "Edit ulasan" : "Beri ulasan"}
          </DialogTitle>
          {itemNama && (
            <DialogDescription className="text-sm">
              Untuk barang: <span className="font-semibold text-foreground">{itemNama}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="flex flex-col items-center text-center gap-2 py-4 rounded-2xl bg-secondary/50">
            <RatingStars
              value={rating}
              onChange={setRating}
              interactive
              size="lg"
            />
            <span className="text-xs font-semibold text-muted-foreground min-h-[16px]">
              {rating > 0 ? RATING_LABEL[rating] : "Tap bintang untuk menilai"}
            </span>
          </div>

          {/* Komentar */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
              Komentar (opsional)
            </label>
            <textarea
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Ceritakan pengalaman menyewa barang ini…"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              {komentar.length}/1000
            </div>
          </div>

          {err && (
            <p className="text-xs text-destructive font-semibold">{err}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="w-4 h-4 mr-1.5" /> Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={submitting || rating < 1}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              {initial ? "Simpan" : "Kirim"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
