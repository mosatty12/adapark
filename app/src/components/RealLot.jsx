import { Accessibility, Zap, Car } from 'lucide-react'
import CarTopView from './CarTopView.jsx'

/**
 * Coordinate-based parking lot renderer for real lot shapes (layout.shape === 'real').
 * Spots are positioned by their real-world centre (cx, cy in metres) and footprint
 * (w, h in metres) within layout.bounds. Mirrors the EMU Industrial Eng. sim world.
 */
export default function RealLot({
  layout,
  onSpotClick,
  selectedSpotId,
  highlightSpotId,
}) {
  const { bounds, spots } = layout
  const spanX = bounds.maxX - bounds.minX
  const spanY = bounds.maxY - bounds.minY

  const pct = (cx, cy, w, h) => ({
    left: `${((cx - bounds.minX) / spanX) * 100}%`,
    top: `${((bounds.maxY - cy) / spanY) * 100}%`,
    width: `${(w / spanX) * 100}%`,
    height: `${(h / spanY) * 100}%`,
  })

  return (
    <div className="rlot">
      <div className="rlot__stage" style={{ aspectRatio: `${spanX} / ${spanY}` }}>
        {/* central driving aisle */}
        <div className="rlot__aisle" />
        <div className="rlot__aisleLabel">DRIVING AISLE</div>

        {/* entry / exit on the west side */}
        <div className="rlot__entry">
          <span>Entry / Exit →</span>
        </div>

        {spots.map((s) => {
          const Icon = iconForType(s.type)
          const clickable = s.status === 'empty' && !!onSpotClick
          const taken = s.status !== 'empty'
          const carOrientation = s.w > s.h ? 'h' : 'v'
          const cls = `rlot__spot spot-${s.status} ${selectedSpotId === s.id ? 'is-selected' : ''} ${highlightSpotId === s.id ? 'is-hi' : ''}`
          return (
            <button
              key={s.id}
              className={cls}
              style={pct(s.cx, s.cy, s.w, s.h)}
              onClick={() => onSpotClick && onSpotClick(s)}
              disabled={!clickable && !onSpotClick}
              title={`Spot ${s.id} — ${s.status}`}
            >
              {taken && <CarTopView orientation={carOrientation} className="rlot__car" />}
              <span className="rlot__spotId">{s.id}</span>
              {Icon && <Icon size={11} className="rlot__spotIcon" />}
            </button>
          )
        })}
      </div>
      <style>{rlotCss}</style>
    </div>
  )
}

function iconForType(t) {
  if (t === 'ev') return Zap
  if (t === 'disabled') return Accessibility
  if (t === 'compact') return Car
  return null
}

const rlotCss = `
.rlot {
  background: linear-gradient(180deg, #2a2a2a 0%, #1c1c1c 100%);
  border-radius: var(--r-card);
  padding: var(--space-3);
}
.rlot__stage {
  position: relative;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  border-radius: 10px;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 26px),
    #232323;
  border: 1px dashed rgba(255,255,255,0.10);
}
.rlot__aisle {
  position: absolute;
  left: 14%; right: 14%; top: 26%; bottom: 26%;
  border-radius: 8px;
  background:
    repeating-linear-gradient(90deg, #f3c419 0 16px, transparent 16px 34px);
  background-color: rgba(255,255,255,0.03);
  opacity: 0.5;
}
.rlot__aisleLabel {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.45);
  font-size: 1rem; font-weight: 800; letter-spacing: 0.18em;
  pointer-events: none;
}
.rlot__entry {
  position: absolute;
  left: 0; top: 50%;
  transform: translate(-2px, -50%);
  background: var(--gold);
  color: var(--green-house);
  font-size: 1rem; font-weight: 700;
  padding: 4px 8px;
  border-radius: 0 999px 999px 0;
  letter-spacing: 0.04em;
  white-space: nowrap;
  z-index: 3;
}
.rlot__spot {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  display: inline-flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-size: 1.05rem; font-weight: 700;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: var(--transition-fast);
  overflow: hidden;
}
.rlot__spot:disabled { cursor: not-allowed; }
.rlot__spot:hover:not(:disabled) { filter: brightness(1.08); z-index: 4; }
.rlot__spot.is-selected { outline: 3px solid var(--gold); outline-offset: 2px; z-index: 5; }
.rlot__spot.is-hi {
  outline: 3px solid var(--green-accent);
  outline-offset: 2px;
  animation: hiPulse 1.4s ease-out infinite;
  z-index: 5;
}
.rlot__spotId {
  position: relative;
  z-index: 3;
  line-height: 1;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
.rlot__spot:not(.spot-empty) .rlot__spotId {
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0,0,0,0.5);
}
.rlot__spotIcon { position: relative; opacity: 0.9; margin-top: 2px; z-index: 3; }

/* empty spots read as clearly available */
.rlot .spot-empty {
  background: linear-gradient(180deg, var(--green-accent) 0%, var(--green-starbucks) 100%);
  border-color: var(--green-light);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
}

/* taken spots carry a top-down car */
.rlot__car {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 88%;
  height: 88%;
  z-index: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 1.5px rgba(0,0,0,0.4));
  animation: rlotCarBob 3.4s ease-in-out infinite;
  will-change: transform;
}
@keyframes rlotCarBob {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -1.4px, 0) scale(1.015); }
}
@media (prefers-reduced-motion: reduce) {
  .rlot__car { animation: none; }
}
`
