import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase'
import { useApp } from '../../context/AppContext.jsx'
import { AlertOctagon, Camera, Check, X, Filter, Plus } from 'lucide-react'
import { formatTL } from '../../data/mockData.js'

const TYPE_LABEL = {
  OVERSTAY: 'Overstay',
  WRONG_SPOT: 'Wrong spot',
  NO_BOOKING: 'No booking',
  BLOCKING: 'Blocking',
  EXPIRED_DOC: 'Expired docs',
}

// Normalize plates so "MGS 312", "mgs312" and "MGS-312" all match.
const normPlate = (s) => (s || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '')

export default function AdminViolations() {
  const { violations, parkings, updateViolation, issueViolation } = useApp()

  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [registeredPlates, setRegisteredPlates] = useState(new Set())
  const [flagged, setFlagged] = useState([])

  useEffect(() => {
    async function loadAndMatch() {
      // 1. Registered plates from user profiles.
      const { data: profiles } = await supabase.from('profiles').select('plate')
      const plateSet = new Set((profiles || []).map((p) => normPlate(p.plate)).filter(Boolean))
      setRegisteredPlates(plateSet)

      // 2. Detected vehicles from the detection feed.
      const { data: detected, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('detected_time', { ascending: false })
      if (error) {
        console.error('Supabase error:', error)
        return
      }
      const rows = detected || []
      setVehicles(rows)

      // 4. For each detection NOT registered, capture & save evidence with the plate.
      // Upsert every unregistered row so the image/evidence backfills on existing rows.
      const toSave = rows
        .filter((v) => !plateSet.has(normPlate(v.plate_number)))
        .map((v) => ({
          vehicle_id: String(v.id),
          plate_number: v.plate_number,
          detected_time: v.detected_time != null ? String(v.detected_time) : null,
          latitude: v.latitude != null ? String(v.latitude) : null,
          longitude: v.longitude != null ? String(v.longitude) : null,
          image_url: v.image_url || null,
          status: 'unregistered',
        }))

      if (toSave.length > 0) {
        const { error: saveErr } = await supabase
          .from('flagged_detections')
          .upsert(toSave, { onConflict: 'vehicle_id' })
        if (saveErr) console.error('flagged_detections upsert error:', saveErr)
      }

      // 5. Reload the full flagged list for display.
      const { data: refreshed } = await supabase
        .from('flagged_detections')
        .select('*')
        .order('created_at', { ascending: false })
      setFlagged(refreshed || [])
    }

    loadAndMatch()
  }, [])

  const filtered = useMemo(() => {
    return violations.filter((v) => filter === 'all' ? true : v.status === filter)
  }, [violations, filter])

  const totals = useMemo(() => ({
    pending: violations.filter((v) => v.status === 'pending').length,
    paid: violations.filter((v) => v.status === 'paid').length,
    disputed: violations.filter((v) => v.status === 'disputed').length,
    revenue: violations.filter((v) => v.status === 'paid').reduce((s, v) => s + v.amount, 0),
  }), [violations])

  return (
    <div className="page page--wide">
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>Violations & penalties</h1>
          <p className="text-soft">Detected by CCTV or issued manually. Review evidence and adjudicate.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowNew(true)}>
          <Plus size={14}/> Issue manually
        </button>
      </div>

      <div className="kpi-grid">
        <Mini label="Pending review" value={totals.pending} tone="var(--red)" />
        <Mini label="Paid" value={totals.paid} tone="var(--green-starbucks)" />
        <Mini label="Disputed" value={totals.disputed} tone="#8a6d04" />
        <Mini label="Revenue from penalties" value={formatTL(totals.revenue)} />
      </div>

      <div className="card" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Detected vehicles</h2>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>
              Plates from the detection feed, checked against registered drivers.
            </p>
          </div>
          <span className="pill pill--ghost">{registeredPlates.size} registered plate{registeredPlates.size === 1 ? '' : 's'}</span>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate Number</th>
                <th>Detected Time</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((v) => {
                const isRegistered = registeredPlates.has(normPlate(v.plate_number))
                return (
                  <tr key={v.id}>
                    <td className="mono nowrap">{v.id}</td>
                    <td className="mono nowrap"><b>{v.plate_number}</b></td>
                    <td className="text-soft nowrap">{v.detected_time}</td>
                    <td>{v.latitude}</td>
                    <td>{v.longitude}</td>
                    <td className="nowrap">
                      {isRegistered ? (
                        <span className="pill pill--ok"><Check size={12}/> Registered</span>
                      ) : (
                        <span className="pill pill--bad"><AlertOctagon size={12}/> Unregistered</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 24 }}>
                    No vehicles found from Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div className="row gap-2" style={{ marginBottom: 12, alignItems: 'center' }}>
          <Camera size={18} color="var(--red)" />
          <div>
            <h2 style={{ marginBottom: 2 }}>Flagged evidence — unregistered plates</h2>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>
              Automatically captured and saved for plates not registered to any driver.
            </p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Plate Number</th>
                <th>Detected Time</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.image_url ? (
                      <a href={f.image_url} target="_blank" rel="noreferrer">
                        <img
                          src={f.image_url}
                          alt={`Evidence for ${f.plate_number}`}
                          style={{ width: 84, height: 56, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                        />
                      </a>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                  </td>
                  <td className="mono nowrap"><b>{f.plate_number}</b></td>
                  <td className="text-soft nowrap">{f.detected_time}</td>
                  <td>{f.latitude}</td>
                  <td>{f.longitude}</td>
                  <td className="text-soft nowrap">{(f.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
              {flagged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 24 }}>
                    No unregistered plates flagged. All detected vehicles are registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div className="row gap-2 row--wrap" style={{ alignItems: 'center' }}>
          <Filter size={16} color="var(--text-black-soft)" />
          {['all', 'pending', 'paid', 'disputed'].map((f) => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn--primary' : 'btn--dark-outline'}`}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-3)', padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="nowrap">ID</th>
                <th className="nowrap">Plate</th>
                <th>Garage</th>
                <th className="nowrap">Spot</th>
                <th>Type</th>
                <th className="nowrap">Detected by</th>
                <th className="nowrap">When</th>
                <th className="num nowrap">Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((v) => {
                const p = parkings.find((x) => x.id === v.parkingId)

                return (
                  <tr key={v.id}>
                    <td className="mono nowrap">{v.id}</td>
                    <td className="mono nowrap"><b>{v.plate}</b></td>
                    <td>{p?.name}</td>
                    <td className="nowrap">{v.spotId}</td>
                    <td className="nowrap">{TYPE_LABEL[v.type] || v.type}</td>
                    <td className="nowrap">
                      <span className="row gap-1">
                        <Camera size={12}/> {v.detectedBy}
                      </span>
                    </td>
                    <td className="text-soft nowrap">{v.detectedAt}</td>
                    <td className="mono num nowrap"><b>{formatTL(v.amount)}</b></td>
                    <td>
                      <span className={`pill ${v.status === 'paid' ? 'pill--ok' : v.status === 'disputed' ? 'pill--warn' : 'pill--bad'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="nowrap">
                      <div className="row gap-1">
                        <button className="btn btn--outline" onClick={() => setOpen(v)}>
                          <Camera size={12}/> Evidence
                        </button>

                        {v.status !== 'paid' && (
                          <button className="btn btn--ghost" onClick={() => updateViolation(v.id, { status: 'paid' })} title="Mark paid">
                            <Check size={12}/>
                          </button>
                        )}

                        {v.status !== 'disputed' && (
                          <button className="btn btn--ghost" onClick={() => updateViolation(v.id, { status: 'disputed' })} title="Mark disputed">
                            <X size={12}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-soft" style={{ textAlign: 'center', padding: 24 }}>
                    No violations match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <EvidenceModal violation={open} onClose={() => setOpen(null)} />
      )}

      {showNew && (
        <NewViolationModal
          onClose={() => setShowNew(false)}
          onCreate={(v) => {
            issueViolation(v)
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}

function Mini({ label, value, tone }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2.4rem', fontWeight: 700, color: tone || 'var(--text-black)' }}>
        {value}
      </div>
    </div>
  )
}

function EvidenceModal({ violation, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontWeight: 600 }}>Evidence — {violation.id}</h2>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>
              CCTV-captured frame · {violation.detectedAt}
            </p>
          </div>
          <button className="btn btn--ghost" onClick={onClose}>
            <X size={16}/>
          </button>
        </div>

        <div style={{
          background: violation.evidenceColor,
          color: '#fff',
          borderRadius: 12,
          height: 280,
          position: 'relative',
          padding: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.45)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 999,
            fontWeight: 700,
          }}>
            <Camera size={14}/> {violation.detectedBy} · LIVE
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 8px, transparent 8px 16px)',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            fontWeight: 700,
            fontSize: '1.6rem',
          }}>
            License plate detected:{' '}
            <span style={{
              background: 'var(--gold)',
              color: 'var(--green-house)',
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {violation.plate}
            </span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            fontSize: '1.2rem',
            opacity: 0.85,
          }}>
            spot {violation.spotId} · type {violation.type}
          </div>
        </div>

        <div className="row between" style={{ marginTop: 'var(--space-3)' }}>
          <span className={`pill ${violation.status === 'paid' ? 'pill--ok' : violation.status === 'disputed' ? 'pill--warn' : 'pill--bad'}`}>
            {violation.status}
          </span>
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function NewViolationModal({ onClose, onCreate }) {
  const { parkings } = useApp()

  const [form, setForm] = useState({
    plate: 'MGS 999',
    parkingId: parkings[0]?.id || '',
    spotId: 'A1',
    type: 'OVERSTAY',
    detectedBy: 'admin',
    amount: 100,
    evidenceColor: '#1E3932',
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontWeight: 600 }}>Issue penalty manually</h2>
        <p className="text-soft" style={{ marginBottom: 'var(--space-3)' }}>
          Create a record outside auto-detection.
        </p>

        <label className="field">
          <input
            className="field__input"
            placeholder=" "
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
          />
          <span className="field__label">License plate</span>
        </label>

        <div className="row gap-2">
          <label className="field" style={{ flex: 1 }}>
            <select
              className="field__select"
              value={form.parkingId}
              onChange={(e) => setForm({ ...form, parkingId: e.target.value })}
            >
              {parkings.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="field__label">Garage</span>
          </label>

          <label className="field" style={{ width: 120 }}>
            <input
              className="field__input"
              placeholder=" "
              value={form.spotId}
              onChange={(e) => setForm({ ...form, spotId: e.target.value })}
            />
            <span className="field__label">Spot</span>
          </label>
        </div>

        <div className="row gap-2">
          <label className="field" style={{ flex: 1 }}>
            <select
              className="field__select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="field__label">Type</span>
          </label>

          <label className="field" style={{ width: 140 }}>
            <input
              className="field__input"
              type="number"
              placeholder=" "
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: +e.target.value })}
            />
            <span className="field__label">Amount (TL)</span>
          </label>
        </div>

        <div className="row between" style={{ marginTop: 'var(--space-3)' }}>
          <button className="btn btn--dark-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onCreate(form)}>Issue penalty</button>
        </div>
      </div>
    </div>
  )
}