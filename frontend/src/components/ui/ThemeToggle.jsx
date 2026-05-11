import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { cn } from "../../lib/utils"

/**
 * Toggle button dark / light mode.
 * Bisa digunakan di navbar manapun.
 *
 * Props:
 *  className – tambahan class untuk wrapper button
 */
export default function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      className={cn(
        "relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
        isDark
          ? "bg-slate-700 text-amber-400 hover:bg-slate-600"
          : "bg-muted text-slate-500 hover:bg-muted/80 hover:text-slate-700",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Moon className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Sun className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
