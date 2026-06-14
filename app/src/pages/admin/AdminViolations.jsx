import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Check, X, Filter, Plus } from 'lucide-react'
import { formatTL } from '../../data/mockData.js'

const TYPE_LABEL = {
  OVERSTAY: 'Overstay',
  WRONG_SPOT: 'Wrong spot',
  NO_BOOKING: 'No booking',
  BLOCKING: 'Blocking',
  EXPIRED_DOC: 'Expired docs',
}

export default function AdminViolations() {
  const { violations, parkings, updateViolation, issueViolation } = useApp()

  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

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
          <p className="text-soft">Review and adjudicate parking violations issued by admins.</p>
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
                    <td className="text-soft nowrap">{v.detectedAt}</td>
                    <td className="mono num nowrap"><b>{formatTL(v.amount)}</b></td>
                    <td>
                      <span className={`pill ${v.status === 'paid' ? 'pill--ok' : v.status === 'disputed' ? 'pill--warn' : 'pill--bad'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="nowrap">
                      <div className="row gap-1">
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
                  <td colSpan={9} className="text-soft" style={{ textAlign: 'center', padding: 24 }}>
                    No violations match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

function NewViolationModal({ onClose, onCreate }) {
  const { parkings } = useApp()

  const [form, setForm] = useState({
    plate: 'MGS 999',
    parkingId: parkings[0]?.id || '',
    spotId: 'A1',
    type: 'OVERSTAY',
    amount: 100,
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontWeight: 600 }}>Issue penalty manually</h2>
        <p className="text-soft" style={{ marginBottom: 'var(--space-3)' }}>
          Create a violation record for a driver.
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
