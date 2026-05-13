/**
 * PickupMap.jsx
 * Komponen peta read-only untuk user melihat lokasi pengambilan barang.
 * Requires: npm install leaflet react-leaflet
 * Requires: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /> di index.html
 */
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

/**
 * PickupMap — peta statis untuk menampilkan lokasi pengambilan barang.
 *
 * Props:
 * - lat: float    — latitude lokasi admin
 * - lng: float    — longitude lokasi admin
 * - label: string — nama usaha untuk ditampilkan di popup marker
 */
export default function PickupMap({ lat, lng, label }) {
  if (!lat || !lng) return null

  const position = [lat, lng]

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: "220px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <strong>📍 {label || "Lokasi Pickup"}</strong>
            <br />
            <span style={{ fontSize: "11px", color: "#666" }}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
