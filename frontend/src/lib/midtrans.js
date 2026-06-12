/**
 * midtrans.js — Helper loader & launcher untuk Midtrans Snap popup.
 *
 * Snap.js sudah dimuat di index.html, tapi client_key-nya kita isi
 * secara dinamis dari env / endpoint backend supaya:
 *   - Aman di-rotate tanpa rebuild
 *   - Bisa jalan di multiple env (dev/staging/sandbox/production)
 */

import { fetchMidtransConfig } from "../services/api"

const SNAP_SCRIPT_ID = "midtrans-snap-script"

/** Ambil client key: env → fallback ke backend config endpoint */
async function getClientKey() {
  const fromEnv = import.meta.env?.VITE_MIDTRANS_CLIENT_KEY
  if (fromEnv && !fromEnv.includes("REPLACE_ME") && !fromEnv.includes("xxxxxxxx")) {
    return fromEnv
  }
  try {
    const cfg = await fetchMidtransConfig()
    return cfg?.client_key || ""
  } catch {
    return ""
  }
}

/**
 * Pastikan script Snap.js sudah dimuat & data-client-key sudah diset.
 * Return Promise yang resolve setelah window.snap tersedia.
 */
export async function ensureSnapReady() {
  const clientKey = await getClientKey()
  const script = document.getElementById(SNAP_SCRIPT_ID)
  if (script && clientKey) {
    script.setAttribute("data-client-key", clientKey)
  }

  // Tunggu window.snap siap (biasanya instan kalau script sudah loaded,
  // tapi saat first-load bisa sedikit delay).
  const maxWait = 5000
  const start = Date.now()
  while (typeof window.snap === "undefined") {
    if (Date.now() - start > maxWait) {
      throw new Error(
        "Snap.js Midtrans tidak berhasil dimuat. " +
        "Cek koneksi internet atau setting CSP."
      )
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 100))
  }
}

/**
 * Trigger popup pembayaran Midtrans.
 *
 * @param {string} snapToken
 * @param {Object} callbacks { onSuccess, onPending, onError, onClose }
 */
export async function openSnap(snapToken, callbacks = {}) {
  await ensureSnapReady()
  window.snap.pay(snapToken, {
    onSuccess: (result) => callbacks.onSuccess?.(result),
    onPending: (result) => callbacks.onPending?.(result),
    onError:   (result) => callbacks.onError?.(result),
    onClose:   ()       => callbacks.onClose?.(),
  })
}
