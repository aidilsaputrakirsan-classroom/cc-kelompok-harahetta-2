import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        info: "border-transparent bg-info text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

const STATUS_MAP = {
  super_admin: { label: "Super Admin", variant: "default" },
  admin: { label: "Admin", variant: "info" },
  user: { label: "User", variant: "secondary" },
  available: { label: "Tersedia", variant: "success" },
  rented: { label: "Disewa", variant: "warning" },
  unavailable: { label: "Tidak Tersedia", variant: "destructive" },
  pending: { label: "Menunggu", variant: "warning" },
  disetujui: { label: "Disetujui", variant: "success" },
  sedang_disewa: { label: "Berlangsung", variant: "info" },
  selesai: { label: "Selesai", variant: "secondary" },
  ditolak: { label: "Ditolak", variant: "destructive" },
  menunggu: { label: "Menunggu", variant: "warning" },
  true: { label: "Aktif", variant: "success" },
  false: { label: "Nonaktif", variant: "destructive" },
}

function StatusBadge({ status, label, className }) {
  const mapping = STATUS_MAP[status] || { label: status, variant: "outline" }
  return (
    <Badge variant={mapping.variant} className={className}>
      {label || mapping.label}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }
