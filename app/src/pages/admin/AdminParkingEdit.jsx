import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { ChevronLeft, Save, AlertOctagon, Wand2 } from 'lucide-react'
import { formatTL, formatTLShort } from '../../data/mockData.js'
import VirtualLot from '../../components/VirtualLot.jsx'
import RealLot from '../../components/RealLot.jsx'

export default function AdminParkingEdit() {
  const { id } = useParams()
  const { parkings, updateParking, updateSpot, violations, showToast } = useApp()
  const parking = parkings.find((p) => p.id === id)
  const [editing, setEditing] = useState({})

  if (!parking) return <div className="page">Not found.</div>

  const save = () => {
    updateParking(parking.id, editing)
    setEditing({})
    showToast('Parking saved', 'success')
  }

  const localViolations = violations.filter((v) => v.parkingId === parking.id)
  const empty = parking.layout.spots.filter((s) => s.status === 'empty').length

  const cycleSpot = (spot) => {
    const next = spot.status === 'empty' ? 'filled' : spot.status === 'filled' ? 'booked' : spot.status === 'booked' ? 'blocked' : 'empty'
    updateSpot(parking.id, spot.id, { status: next })
  }

  const applySuggestion = () => {
    const newRate = Math.round(parking.hourlyOverride * (1 + parking.suggestedFeeChange / 100))
    updateParking(parking.id, { hourlyOverride: newRate, suggestedFeeChange: 0 })
    showToast(`Rate updated to ₺${newRate}/hr`, 'success')
  }

  return (
    <div className="page page--wide">
      <Link to="/admin/parkings" className="row gap-1" style={{ color: 'var(--green-accent)', fontWeight: 600, fontSize: '1.4rem', marginBottom: 'var(--space-3)' }}>
        <ChevronLeft size={16}/> All garages
      </Link>

      <div className="row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>{parking.name}</h1>
          <p className="text-soft">{parking.address}</p>
        </div>
        <div className="row gap-2">
          {parking.suggestedFeeChange !== 0 && (
            <button className="btn btn--dark-outline" onClick={applySuggestion}>
              <Wand2 size={14}/> Apply suggestion ({parking.suggestedFeeChange > 0 ? '+' : ''}{parking.suggestedFeeChange}%)
            </button>
          )}
          <button className="btn btn--primary" onClick={save} disabled={Object.keys(editing).length === 0}>
            <Save size={14}/> Save changes
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginTop: 'var(--space-4)' }}>
        <Mini label="Total spots" value={parking.layout.spots.length} />
        <Mini label="Vacant" value={empty} tone="var(--green-accent)" />
        <Mini label="Occupancy" value={`${parking.occupancyPct}%`} />
        <Mini label="Street load" value={`${Math.round(parking.streetCrowdedness * 100)}%`} tone={parking.streetCrowdedness > 0.7 ? 'var(--red)' : 'var(--green-starbucks)'} />
        <Mini label="Monthly revenue" value={formatTLShort(parking.revenueMonthTL)} />
      </div>

      <div className="ov-grid" style={{ marginTop: 'var(--space-4)' }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Lot layout</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Tap any spot to cycle status: empty → filled → booked → blocked.</p>
            </div>
          </div>
          {parking.layout.shape === 'real' ? (
            <RealLot layout={parking.layout} onSpotClick={cycleSpot} />
          ) : (
            <VirtualLot layout={parking.layout} onSpotClick={cycleSpot} />
          )}
        </div>

        <div className="stack gap-3">
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Pricing</h3>
            <label className="field">
              <input
                className="field__input"
                type="number"
                value={editing.hourlyOverride ?? parking.hourlyOverride}
                onChange={(e) => setEditing({ ...editing, hourlyOverride: +e.target.value })}
                placeholder=" "
              />
              <span className="field__label">Hourly rate (TL)</span>
            </label>

            <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0' }}>Crowd state</div>
            <div className="row gap-1 row--wrap">
              {['quiet', 'normal', 'busy', 'overflow'].map((c) => (
                <button
                  key={c}
                  className={`btn ${ (editing.crowdLevel ?? parking.crowdLevel) === c ? 'btn--primary' : 'btn--dark-outline' }`}
                  onClick={() => setEditing({ ...editing, crowdLevel: c })}
                >{c}</button>
              ))}
            </div>

            <div className="text-soft" style={{ fontSize: '1.3rem', marginTop: 12, padding: 10, background: 'var(--neutral-cool)', borderRadius: 8 }}>
              {parking.suggestedFeeChange === 0
                ? <>System suggests no change right now.</>
                : <>System suggests <b style={{ color: parking.suggestedFeeChange > 0 ? 'var(--green-starbucks)' : 'var(--green-accent)' }}>{parking.suggestedFeeChange > 0 ? '+' : ''}{parking.suggestedFeeChange}%</b> based on street load + occupancy. Click "Apply suggestion" above.</>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}><AlertOctagon size={16} style={{ verticalAlign: 'middle' }} /> Recent violations</h3>
            {localViolations.length === 0 && <p className="text-soft">No recent violations.</p>}
            {localViolations.map((v) => (
              <div key={v.id} className="row between" style={{ padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
                <div>
                  <b>{v.plate}</b> <span className="text-soft" style={{ fontSize: '1.2rem' }}>· spot {v.spotId}</span>
                  <div className="text-soft" style={{ fontSize: '1.3rem' }}>{v.type.replace('_', ' ').toLowerCase()} · {v.detectedAt}</div>
                </div>
                <span className={`pill ${v.status === 'paid' ? 'pill--ok' : v.status === 'disputed' ? 'pill--warn' : 'pill--bad'}`}>{v.status}</span>
              </div>
            ))}
            <Link to="/admin/violations" className="btn btn--outline" style={{ marginTop: 8 }}>All violations</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value, tone }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '2.4rem', fontWeight: 700, color: tone || 'var(--text-black)' }}>{value}</div>
    </div>
  )
}
