import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navigation, Plus, Minus, LocateFixed } from 'lucide-react'

/**
 * Real map of the EMU campus using OpenStreetMap tiles (no API key required).
 * Parking pins are overlaid at their true lat/lng. The base map bbox is derived
 * from a center + zoom factor; the same bbox drives the iframe src and the
 * project() math so overlays stay aligned at every zoom level.
 */

const BASE_SPAN = { lat: 0.0060, lng: 0.0075 }
const DEFAULT_CENTER = { lat: 35.1450, lng: 33.90725 }
const MIN_ZOOM = 1
const MAX_ZOOM = 6

export default function RealMap({ parkings = [], highlightId, onHover, small, userLocation = null, directionsHref = null }) {
  const [zoom, setZoom] = useState(1)
  // Keep the original EMU engineering cluster framing; all lots still render as pins.
  const [center, setCenter] = useState(() => DEFAULT_CENTER)

  const bbox = useMemo(() => {
    const spanLat = BASE_SPAN.lat / zoom
    const spanLng = BASE_SPAN.lng / zoom
    return {
      minLat: center.lat - spanLat / 2,
      maxLat: center.lat + spanLat / 2,
      minLng: center.lng - spanLng / 2,
      maxLng: center.lng + spanLng / 2,
    }
  }, [center, zoom])

  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng}%2C${bbox.minLat}%2C${bbox.maxLng}%2C${bbox.maxLat}&layer=mapnik`

  const projectPct = (lat, lng) => ({
    x: ((lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * 100,
    y: ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * 100,
  })
  const project = (lat, lng) => {
    const { x, y } = projectPct(lat, lng)
    return { left: `${x}%`, top: `${y}%` }
  }

  const clamp = (n) => Math.min(100, Math.max(0, n))

  const userMarker = useMemo(() => {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') return null
    const { x, y } = projectPct(userLocation.lat, userLocation.lng)
    const offBounds = x < 0 || x > 100 || y < 0 || y > 100
    return { left: `${clamp(x)}%`, top: `${clamp(y)}%`, offBounds }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, bbox])

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z * 1.5).toFixed(3)))
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z / 1.5).toFixed(3)))
  const recenter = () => {
    if (userLocation && typeof userLocation.lat === 'number') {
      setCenter({ lat: userLocation.lat, lng: userLocation.lng })
    }
  }

  const fallbackHref = `https://www.google.com/maps/search/?api=1&query=${center.lat}%2C${center.lng}`

  return (
    <div className="rmap" style={{ minHeight: small ? 280 : 380 }}>
      <iframe
        title="EMU campus map"
        className="rmap__frame"
        src={osmSrc}
        loading="lazy"
      />

      <div className="rmap__overlay">
        {parkings.map((p) => {
          if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return null
          const empty = p.layout.spots.filter((s) => s.status === 'empty').length
          const total = p.layout.spots.length
          const pct = empty / total
          const tone = pct > 0.4 ? 'var(--green-accent)' : pct > 0.1 ? '#cba258' : 'var(--red)'
          const isHi = highlightId === p.id
          return (
            <div
              key={p.id}
              className={`rmap__pin ${isHi ? 'is-hi' : ''}`}
              style={{ ...project(p.lat, p.lng), '--tone': tone }}
              onMouseEnter={() => onHover && onHover(p.id)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <Link to={`/app/parking/${p.id}`} className="rmap__pinBtn">
                <span className="rmap__pinCount">{empty}</span>
              </Link>
              <div className="rmap__pinLabel">{p.name}</div>
            </div>
          )
        })}

        {userMarker && (
          <div
            className={`rmap__me ${userMarker.offBounds ? 'is-edge' : ''}`}
            style={{ left: userMarker.left, top: userMarker.top }}
          >
            <span className="rmap__meDot" />
            <span className="rmap__meLabel">{userMarker.offBounds ? 'You (nearby)' : 'You'}</span>
          </div>
        )}
      </div>

      <div className="rmap__controls">
        <button className="rmap__ctrl" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button className="rmap__ctrl" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        {userLocation && (
          <button className="rmap__ctrl" onClick={recenter} aria-label="Recenter on my location">
            <LocateFixed size={16} />
          </button>
        )}
      </div>

      <div className="rmap__legend">
        <span><span className="dot" style={{ background: 'var(--green-accent)' }} /> Many spots</span>
        <span><span className="dot" style={{ background: '#cba258' }} /> Few spots</span>
        <span><span className="dot" style={{ background: 'var(--red)' }} /> Full</span>
      </div>

      <a
        className="rmap__directions"
        href={directionsHref || fallbackHref}
        target="_blank"
        rel="noreferrer"
      >
        <Navigation size={14} /> {directionsHref ? 'Directions to nearest' : 'Open in Google Maps'}
      </a>

      <style>{rmapCss}</style>
    </div>
  )
}

const rmapCss = `
.rmap {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--r-card);
  overflow: hidden;
  background: #e9eee6;
}
.rmap__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
  filter: saturate(1.05);
}
.rmap__overlay { position: absolute; inset: 0; pointer-events: none; }
.rmap__pin {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  z-index: 4;
}
.rmap__pinBtn {
  width: 38px; height: 38px;
  border-radius: 50% 50% 50% 4px;
  background: var(--tone, var(--green-accent));
  color: #fff; font-weight: 700; font-size: 1.4rem;
  border: 2px solid #fff;
  box-shadow: var(--shadow-card-hover);
  display: inline-flex; align-items: center; justify-content: center;
  transform: rotate(-45deg);
  transition: var(--transition-fast);
}
.rmap__pinBtn:hover { text-decoration: none; }
.rmap__pinCount { transform: rotate(45deg); }
.rmap__pinLabel {
  position: absolute; left: 50%; bottom: -34px;
  transform: translateX(-50%);
  background: #fff; color: var(--text-black);
  font-size: 1.2rem; font-weight: 600;
  padding: 4px 10px; border-radius: 999px;
  white-space: nowrap;
  opacity: 0; transition: var(--transition-fast);
  box-shadow: var(--shadow-card);
  pointer-events: none;
}
.rmap__pin.is-hi .rmap__pinLabel,
.rmap__pin:hover .rmap__pinLabel { opacity: 1; bottom: -42px; }
.rmap__pin.is-hi .rmap__pinBtn { transform: rotate(-45deg) scale(1.18); box-shadow: 0 0 0 4px rgba(0,117,74,0.18), var(--shadow-card-hover); }
.rmap__me {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 5;
  pointer-events: none;
}
.rmap__meDot {
  display: block;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #1a73e8;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px rgba(26,115,232,0.35), var(--shadow-card);
  position: relative;
}
.rmap__meDot::after {
  content: '';
  position: absolute; inset: -3px;
  border-radius: 50%;
  border: 2px solid rgba(26,115,232,0.55);
  animation: rmapPulse 1.8s ease-out infinite;
}
@keyframes rmapPulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}
.rmap__meLabel {
  position: absolute; left: 50%; top: 20px;
  transform: translateX(-50%);
  background: #1a73e8; color: #fff;
  font-size: 1.15rem; font-weight: 700;
  padding: 3px 9px; border-radius: 999px;
  white-space: nowrap;
  box-shadow: var(--shadow-card);
}
.rmap__me.is-edge .rmap__meDot { background: #5f6368; }
.rmap__me.is-edge .rmap__meDot::after { border-color: rgba(95,99,104,0.5); }
.rmap__me.is-edge .rmap__meLabel { background: #5f6368; }
.rmap__controls {
  position: absolute; top: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 6px;
  z-index: 6;
}
.rmap__ctrl {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #fff; color: var(--green-starbucks);
  border: 0; border-radius: 10px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: var(--transition-fast);
}
.rmap__ctrl:hover:not(:disabled) { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
.rmap__ctrl:disabled { opacity: 0.45; cursor: default; }
.rmap__legend {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255,255,255,0.95);
  padding: 8px 12px;
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-card);
  display: flex; gap: 16px;
  font-size: 1.2rem; font-weight: 600; color: var(--text-black);
  z-index: 6;
}
.rmap__legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.rmap__directions {
  position: absolute; bottom: 12px; left: 12px;
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; color: var(--green-starbucks);
  font-size: 1.25rem; font-weight: 700;
  padding: 8px 12px; border-radius: var(--r-pill);
  box-shadow: var(--shadow-card);
  z-index: 6;
}
.rmap__directions:hover { text-decoration: none; box-shadow: var(--shadow-card-hover); }
@media (max-width: 480px) {
  .rmap__legend { flex-wrap: wrap; gap: 8px; font-size: 1.1rem; }
}
`
