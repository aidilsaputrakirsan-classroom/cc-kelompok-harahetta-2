/**
 * ConfirmDialog — pengganti window.confirm() bawaan browser.
 * Pakai Radix AlertDialog supaya tidak muncul "localhost says".
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     onConfirm={() => { doDelete(); setShowConfirm(false) }}
 *     onCancel={() => setShowConfirm(false)}
 *     title="Hapus barang?"
 *     description="Barang akan dihapus permanen."
 *     confirmText="Hapus"
 *     variant="destructive"
 *   />
 */
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { cn } from "../lib/utils"

export default function ConfirmDialog({
  open = false,
  onConfirm,
  onCancel,
  title = "Konfirmasi",
  description = "Apakah kamu yakin?",
  confirmText = "Ya, lanjutkan",
  cancelText = "Batal",
  variant = "default", // "default" | "destructive"
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(v) => !v && onCancel?.()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="text-lg font-bold tracking-tight">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description}
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
            >
              {cancelText}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition",
                variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {confirmText}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
