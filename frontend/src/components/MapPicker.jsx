/**
 * MapPicker.jsx
 * Pola UX "crosshair": pin tetap di tengah, peta yang digeser.
 * Saat peta berhenti bergerak → koordinat tengah diambil → reverse geocode via Nominatim.
 *
 * Props:
 * - latitude: float|null  — koordinat awal
 * - longitude: float|null — koordinat awal
 * - onChange: ({ latitude, longitude, alamat }) => void
 */
import { useState, useRef } from "react"
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet"

/** Reverse geocode: koordinat → teks alamat via Nominatim (gratis, tanpa API key) */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "id" } }
    )
    const data = await res.json()
    if (!data || data.error) return null
    const a = data.address || {}
    const parts = [
      a.road || a.pedestrian || a.path || a.footway,
      a.house_number ? `No. ${a.house_number}` : null,
      a.suburb || a.neighbourhood || a.village || a.hamlet,
      a.city_district || a.town || a.county,
      a.city || a.municipality,
      a.state,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : data.display_name
  } catch {
    return null
  }
}

/** Sub-komponen: mendengarkan event moveend untuk ambil koordinat tengah */
function MapCenterTracker({ onCenterChange }) {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter()
      onCenterChange(c.lat, c.lng)
    },
  })
  return null
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const DEFAULT_CENTER = [-1.2654, 116.8312]   // Balikpapan
  const initialCenter = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER

  const [coords, setCoords] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )
  const [loading, setLoading] = useState(false)
  const [displayAddr, setDisplayAddr] = useState("")
  const debounceRef = useRef(null)

  const handleCenterChange = (lat, lng) => {
    setCoords({ lat, lng })
    setLoading(true)

    // Debounce: tunggu 600ms setelah peta berhenti baru geocode
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const alamat = await reverseGeocode(lat, lng)
      setDisplayAddr(alamat || "")
      setLoading(false)
      onChange?.({ latitude: lat, longitude: lng, alamat: alamat || "" })
    }, 600)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
        <span>🗺️</span>
        <span><strong>Geser peta</strong> hingga pin di tengah menunjuk lokasi usaha Anda. Alamat terisi otomatis.</span>
      </div>

      {/* Wrapper: map + pin overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "300px" }}>
        <MapContainer
          center={initialCenter}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='Imagery &copy; <a href="https://www.google.com/maps">Google</a>'
            url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
          <MapCenterTracker onCenterChange={handleCenterChange} />
        </MapContainer>

        {/* ── Pin tetap di tengah (CSS overlay, tidak ikut scroll peta) ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -100%)",
            zIndex: 1000,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Pin SVG */}
          <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="18" cy="46" rx="6" ry="2" fill="rgba(0,0,0,0.2)" />
            <path
              d="M18 0C10.268 0 4 6.268 4 14C4 24.5 18 44 18 44C18 44 32 24.5 32 14C32 6.268 25.732 0 18 0Z"
              fill="#2563EB"
              stroke="white"
              strokeWidth="2"
            />
            <circle cx="18" cy="14" r="6" fill="white" />
          </svg>
          {/* Bayangan pin */}
          <div style={{
            width: "10px", height: "4px",
            background: "rgba(0,0,0,0.25)",
            borderRadius: "50%",
            marginTop: "-4px",
            filter: "blur(1px)",
          }} />
        </div>

        {/* Loading indicator overlay */}
        {loading && (
          <div style={{
            position: "absolute", bottom: "8px", left: "50%",
            transform: "translateX(-50%)", zIndex: 1000,
          }}>
            <div className="bg-white/90 backdrop-blur-sm text-xs text-slate-600 px-3 py-1.5 rounded-full shadow border border-slate-200">
              🔍 Mencari alamat...
            </div>
          </div>
        )}
      </div>

      {/* Status koordinat & alamat */}
      {coords && !loading && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 space-y-0.5">
          <p className="font-semibold">
            📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
          {displayAddr && <p className="text-green-600">{displayAddr}</p>}
        </div>
      )}
      {!coords && (
        <p className="text-xs text-slate-400 text-center">Geser peta untuk pilih lokasi</p>
      )}
    </div>
  )
}
