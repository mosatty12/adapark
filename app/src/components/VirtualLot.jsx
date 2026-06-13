import { Accessibility, Zap, Car } from 'lucide-react'
import CarTopView from './CarTopView.jsx'

/**
 * Virtual visualization of a parking lot.
 * Renders rows × cols with status colors and a center driving aisle for visual interest.
 */
export default function VirtualLot({
  layout,
  onSpotClick,
  selectedSpotId,
  highlightSpotId,
  showAisle = true,
  compact = false,
}) {
  const { rows, cols, spots } = layout
  const aisleAt = showAisle ? Math.floor(rows / 2) : -1

  // Group spots by row for rendering
  const rowsArr = []
  for (let r = 0; r < rows; r++) {
    rowsArr.push(spots.filter((s) => s.row === r).sort((a, b) => a.col - b.col))
  }

  return (
    <div className={`vlot ${compact ? 'is-compact' : ''}`}>
      <div className="vlot__entry">
        <span>↑ Entry / Exit</span>
      </div>
      <div className="vlot__grid">
        {rowsArr.map((row, rIdx) => (
          <div key={rIdx} className="vlot__rowGroup">
            {rIdx === aisleAt && (
              <div className="vlot__aisle">DRIVING AISLE →</div>
            )}
            <div className="vlot__row" style={{ gridTemplateColumns: `36px repeat(${cols}, minmax(0, 1fr))` }}>
              <div className="vlot__rowLabel">{String.fromCharCode(65 + rIdx)}</div>
              {row.map((s) => {
                const cls = `vlot__spot spot-${s.status} ${selectedSpotId === s.id ? 'is-selected' : ''} ${highlightSpotId === s.id ? 'is-hi' : ''}`
                const Icon = iconForType(s.type)
                const clickable = s.status === 'empty' && !!onSpotClick
                const taken = s.status !== 'empty'
                return (
                  <button
                    key={s.id}
                    className={cls}
                    onClick={() => onSpotClick && onSpotClick(s)}
                    disabled={!clickable && !onSpotClick}
                    title={`Spot ${s.id} — ${s.status}`}
                  >
                    {taken && <CarTopView orientation="v" className="vlot__car" />}
                    <span className="vlot__spotId">{s.id}</span>
                    {Icon && <Icon size={11} className="vlot__spotIcon" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <style>{vlotCss}</style>
    </div>
  )
}

function iconForType(t) {
  if (t === 'ev') return Zap
  if (t === 'disabled') return Accessibility
  if (t === 'compact') return Car
  return null
}

const vlotCss = `
.vlot {
  background: linear-gradient(180deg, #2a2a2a 0%, #1c1c1c 100%);
  border-radius: var(--r-card);
  padding: var(--space-3);
  position: relative;
  overflow-x: auto;
}
.vlot__entry {
  text-align: center;
  background: var(--gold);
  color: var(--green-house);
  font-size: 1.2rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  width: max-content;
  margin: 0 auto var(--space-3);
  letter-spacing: 0.05em;
}
.vlot__grid { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.vlot__row {
  display: grid;
  gap: 4px;
  align-items: stretch;
}
.vlot__rowLabel {
  display: inline-flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.55);
  font-size: 1.1rem; font-weight: 700;
  letter-spacing: 0.05em;
}
.vlot__rowGroup { display: flex; flex-direction: column; gap: 6px; }
.vlot__aisle {
  background: repeating-linear-gradient(90deg, #f3c419 0 18px, transparent 18px 38px);
  color: rgba(255,255,255,0.85);
  font-size: 1rem; font-weight: 700; letter-spacing: 0.1em;
  padding: 6px 0;
  text-align: center;
  border-radius: 4px;
  background-color: rgba(255,255,255,0.04);
  margin: 4px 0;
}
.vlot__spot {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px;
  height: 44px;
  font-size: 1.15rem; font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 0;
  padding: 0;
  border: 1.5px solid transparent;
  font-family: inherit;
}
.vlot__spot:disabled { cursor: not-allowed; }
.vlot__spot:hover:not(:disabled) { transform: translateY(-1px); }
.vlot__spot.is-selected {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
.vlot__spot.is-hi {
  outline: 3px solid var(--green-accent);
  outline-offset: 2px;
  animation: hiPulse 1.4s ease-out infinite;
}
@keyframes hiPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,117,74,0.0); }
  50% { box-shadow: 0 0 0 6px rgba(0,117,74,0.45); }
}
.vlot__spotId {
  position: relative;
  z-index: 3;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
.vlot__spot:not(.spot-empty) .vlot__spotId {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0,0,0,0.5);
}
.vlot__spotIcon {
  position: absolute; top: 3px; right: 3px; opacity: 0.9; z-index: 3;
}

/* empty spots read as clearly available */
.vlot .spot-empty {
  background: linear-gradient(180deg, var(--green-accent) 0%, var(--green-starbucks) 100%);
  border-color: var(--green-light);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
}

/* taken spots carry a top-down car */
.vlot__car {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 78%;
  height: 82%;
  z-index: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 1.5px rgba(0,0,0,0.4));
  animation: vlotCarBob 3.4s ease-in-out infinite;
  will-change: transform;
}
@keyframes vlotCarBob {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -1.6px, 0) scale(1.015); }
}
@media (prefers-reduced-motion: reduce) {
  .vlot__car { animation: none; }
}
.vlot.is-compact .vlot__spot { height: 28px; font-size: 1rem; }
.vlot.is-compact .vlot__spotIcon { display: none; }
.vlot.is-compact .vlot__car { width: 86%; height: 86%; }
`
