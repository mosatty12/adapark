import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { ChevronLeft, MapPin, Star, Car, Zap, Shield, CheckCircle2, X, Navigation } from 'lucide-react'
import { formatTL } from '../../data/mockData.js'
import VirtualLot from '../../components/VirtualLot.jsx'
import RealLot from '../../components/RealLot.jsx'
import CarTopView from '../../components/CarTopView.jsx'
import PaymentModal from '../../components/PaymentModal.jsx'

export default function ParkingDetail() {
  const { id } = useParams()
  const { parkings, user, tiers } = useApp()
  const parking = parkings.find((p) => p.id === id)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [hours, setHours] = useState(2)
  const [paying, setPaying] = useState(false)

  const stats = useMemo(() => {
    if (!parking) return null
    const total = parking.layout.spots.length
    const empty = parking.layout.spots.filter((s) => s.status === 'empty').length
    const filled = parking.layout.spots.filter((s) => s.status === 'filled').length
    const booked = parking.layout.spots.filter((s) => s.status === 'booked' || s.status === 'mine').length
    return { total, empty, filled, booked }
  }, [parking])

  if (!parking) {
    return (
      <div className="page page--tight">
        <p>Parking not found.</p>
        <Link to="/app" className="btn btn--outline">Back to map</Link>
      </div>
    )
  }

  const sub = tiers.find((t) => t.id === user.subscriptionId)
  const rate = parking.hourlyOverride ?? 50
  const oneTimeCost = hours * rate

  const onPick = (spot) => {
    if (spot.status !== 'empty') return
    setSelectedSpot(spot)
  }

  return (
    <div className="page page--wide">
      <Link to="/app" className="row gap-1" style={{ color: 'var(--green-accent)', fontWeight: 600, fontSize: '1.4rem', marginBottom: 'var(--space-3)' }}>
        <ChevronLeft size={16} /> Back to map
      </Link>

      <div className="parking-hero">
        <div className="parking-hero__left">
          <div className="row gap-2" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="pill pill--on-dark"><MapPin size={12} /> {parking.area}</span>
            <span className="pill pill--on-dark"><Star size={12} /> {parking.rating.toFixed(1)}</span>
          </div>
          <h1 style={{ fontSize: '3rem', color: '#fff', lineHeight: 1.15 }}>{parking.name}</h1>
          <p style={{ color: 'var(--text-white-soft)', marginTop: 8, fontSize: '1.4rem' }}>
            {parking.address} · {parking.distanceKm.toFixed(1)} km away
          </p>
          {typeof parking.lat === 'number' && (
            <a
              className="btn btn--inverted"
              style={{ marginTop: 'var(--space-3)' }}
              href={`https://www.google.com/maps/search/?api=1&query=${parking.lat}%2C${parking.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={14} /> Get directions
            </a>
          )}
          <div className="row gap-2" style={{ marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
            {parking.amenities.map((a) => (
              <span key={a} className="parking-hero__amenity">{iconFor(a)} {a}</span>
            ))}
          </div>
        </div>
        <div className="parking-hero__right">
          <Big label="Vacancy" value={`${stats.empty}/${stats.total}`} sub={`${Math.round((stats.empty/stats.total)*100)}% free`} />
          <Big label="Rate" value={`₺${rate}/hr`} sub={parking.hourlyOverride !== 50 ? 'dynamic' : 'standard'} />
          <Big label="Crowd" value={parking.crowdLevel.charAt(0).toUpperCase() + parking.crowdLevel.slice(1)} sub={`${Math.round(parking.streetCrowdedness * 100)}% load`} />
        </div>
      </div>

      <div className="parking-grid">
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h2 style={{ fontWeight: 600 }}>Pick your spot</h2>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Tap any green tile to reserve.</p>
            </div>
            <div className="row gap-2">
              <Legend cls="spot-empty"   label="Free" />
              <Legend cls="spot-filled"  label="Taken"  taken />
              <Legend cls="spot-booked"  label="Booked" taken />
              <Legend cls="spot-mine"    label="You"    taken />
            </div>
          </div>

          {parking.layout.shape === 'real' ? (
            <RealLot
              layout={parking.layout}
              onSpotClick={onPick}
              selectedSpotId={selectedSpot?.id}
            />
          ) : (
            <VirtualLot
              layout={parking.layout}
              onSpotClick={onPick}
              selectedSpotId={selectedSpot?.id}
            />
          )}

          <div className="row gap-3" style={{ marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Stat label="Free" value={stats.empty} tone="var(--green-accent)" />
            <Stat label="Taken" value={stats.filled} tone="var(--red)" />
            <Stat label="Booked" value={stats.booked} tone="var(--gold)" />
            <Stat label="Total" value={stats.total} tone="var(--text-black)" />
          </div>
        </div>

        <aside className="parking-side">
          <div className="card">
            <h3>Reserve before you arrive</h3>
            <p className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>Locks the spot for everyone else as soon as you confirm.</p>

            {!selectedSpot ? (
              <div className="card card--flat" style={{ marginTop: 'var(--space-3)', textAlign: 'center', padding: 'var(--space-4)' }}>
                <Car size={28} color="var(--text-black-soft)" />
                <div style={{ marginTop: 8, fontWeight: 600 }}>Pick a spot from the lot</div>
                <div className="text-soft" style={{ fontSize: '1.3rem' }}>Green spots are available right now</div>
              </div>
            ) : (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div className="row between">
                  <div>
                    <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected spot</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-starbucks)' }}>{selectedSpot.id}</div>
                    <div className="text-soft" style={{ fontSize: '1.3rem' }}>{spotTypeLabel(selectedSpot.type)}</div>
                  </div>
                  <button className="btn btn--ghost" onClick={() => setSelectedSpot(null)}><X size={14}/> Clear</button>
                </div>

                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Duration</div>
                  <div className="hours-row">
                    {[1, 2, 3, 4, 6, 8].map((h) => (
                      <button
                        key={h}
                        className={`hours-row__btn ${hours === h ? 'is-active' : ''}`}
                        onClick={() => setHours(h)}
                      >{h}h</button>
                    ))}
                  </div>
                  <div className="text-soft" style={{ fontSize: '1.2rem', marginTop: 6 }}>One hour costs ₺{rate} at this garage</div>
                </div>

                <div className="cost-summary" style={{ marginTop: 'var(--space-4)' }}>
                  <div className="row between"><span>One-time price</span><b className="mono">{formatTL(oneTimeCost)}</b></div>
                  {sub && (
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span>{sub.name} subscription</span>
                      <b className="mono text-success">Included</b>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn--primary btn--block btn--lg"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => setPaying(true)}
                >
                  Reserve Spot {selectedSpot.id}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.6rem' }}>Why book ahead?</h3>
            <ul style={{ paddingLeft: 18, margin: '8px 0 0', fontSize: '1.4rem', color: 'var(--text-black)', lineHeight: 1.7 }}>
              <li>Spot is exclusively yours from arrival</li>
              <li>Free 15-min grace window</li>
              <li>One-tap cancel up to 5 minutes before start</li>
            </ul>
          </div>
        </aside>
      </div>

      {paying && selectedSpot && (
        <PaymentModal
          parking={parking}
          spot={selectedSpot}
          hours={hours}
          rate={rate}
          onClose={() => setPaying(false)}
          onSuccess={() => { setPaying(false); setSelectedSpot(null); }}
        />
      )}

      <style>{detailCss}</style>
    </div>
  )
}

function iconFor(a) {
  if (a === 'EV Charging') return <Zap size={12} />
  if (a === 'Drone Patrol') return <Shield size={12} />
  if (a === 'Valet') return <Car size={12} />
  return <CheckCircle2 size={12} />
}

function spotTypeLabel(t) {
  if (t === 'ev') return 'EV charging spot'
  if (t === 'disabled') return 'Disabled access spot'
  if (t === 'compact') return 'Compact car spot'
  return 'Standard spot'
}

function Big({ label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ color: 'var(--text-white-soft)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ color: 'var(--text-white-soft)', fontSize: '1.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div style={{ background: 'var(--neutral-cool)', borderRadius: 10, padding: '8px 14px' }}>
      <div className="text-soft" style={{ fontSize: '1.2rem' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '1.6rem', color: tone }}>{value}</div>
    </div>
  )
}

function Legend({ cls, label, taken }) {
  return (
    <span className="row gap-1" style={{ fontSize: '1.2rem', color: 'var(--text-black-soft)' }}>
      <span className={`legend-swatch ${cls}`}>
        {taken && <CarTopView className="legend-swatch__car" />}
      </span>
      {label}
    </span>
  )
}

const detailCss = `
.parking-hero {
  background: linear-gradient(135deg, var(--green-house) 0%, var(--green-uplift) 100%);
  color: #fff;
  border-radius: var(--r-card);
  padding: var(--space-4);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-card);
}
@media (min-width: 900px) {
  .parking-hero { grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); align-items: stretch; padding: var(--space-5) var(--space-5); }
}
@media (min-width: 1200px) {
  .parking-hero { padding: var(--space-6); }
}
.parking-hero__left { min-width: 0; }
.parking-hero__amenity {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.10);
  color: #fff;
  font-size: 1.2rem; font-weight: 600;
  padding: 5px 10px; border-radius: 999px;
}
.parking-hero__right {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}
@media (max-width: 540px) {
  .parking-hero__right { grid-template-columns: 1fr 1fr; }
}
.parking-grid {
  display: grid; grid-template-columns: 1fr; gap: var(--space-4);
}
@media (min-width: 980px) {
  .parking-grid { grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr); align-items: start; }
}
.parking-side { display: flex; flex-direction: column; gap: var(--space-3); }
.hours-row {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
}
.hours-row__btn {
  border: 1px solid var(--input-border);
  background: #fff;
  border-radius: var(--r-pill);
  padding: 8px 0;
  font-size: 1.4rem; font-weight: 600;
  color: var(--text-black);
  transition: var(--transition-fast);
}
.hours-row__btn.is-active {
  background: var(--green-accent);
  border-color: var(--green-accent);
  color: #fff;
}
.cost-summary {
  background: var(--neutral-cool);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 1.4rem;
}
.legend-swatch {
  position: relative;
  width: 20px; height: 20px;
  border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.legend-swatch.spot-empty {
  background: linear-gradient(180deg, var(--green-accent) 0%, var(--green-starbucks) 100%);
  border-color: var(--green-light);
}
.legend-swatch__car { width: 80%; height: 90%; }
`
