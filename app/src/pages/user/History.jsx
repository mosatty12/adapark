import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Clock, MapPin } from 'lucide-react'
import { formatTL } from '../../lib/formatters.js'

export default function History() {
  const { user, parkings, unparkSession } = useApp()
  const active = user.bookings.filter((b) => b.active)
  return (
    <div className="page page--wide">
      <h1>Booking history</h1>
      <p className="text-soft" style={{ marginBottom: 'var(--space-4)' }}>All your past and active reservations.</p>

      <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Active</h2>
      {active.length === 0 ? (
        <div className="card text-soft" style={{ textAlign: 'center' }}>No active bookings.</div>
      ) : (
        <div className="stack gap-3">
          {active.map((b) => {
            const p = parkings.find((x) => x.id === b.parkingId)
            return (
              <div key={b.id} className="card row between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem' }}>{p?.name} · Spot {b.spotId}</div>
                  <div className="text-soft" style={{ fontSize: '1.3rem' }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {b.hours}h · started {new Date(b.start).toLocaleString()}
                  </div>
                  <div className="text-soft" style={{ fontSize: '1.3rem' }}>{b.paymentMethod === 'subscription' ? 'Included in subscription' : `Paid ${formatTL(b.cost)}`}</div>
                </div>
                <div className="row gap-2">
                  <Link to={`/app/parking/${b.parkingId}`} className="btn btn--outline">View garage</Link>
                  <button className="btn btn--primary" onClick={() => unparkSession(b.id)}>Unpark</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <h2 style={{ fontWeight: 600, marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Past</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="nowrap">Booking</th>
                <th>Garage</th>
                <th className="nowrap">Spot</th>
                <th className="nowrap">When</th>
                <th className="nowrap">Cost</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {user.history.map((h) => {
                const p = parkings.find((x) => x.id === h.parkingId)
                return (
                  <tr key={h.id}>
                    <td className="mono nowrap">{h.id}</td>
                    <td><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {p?.name}</td>
                    <td className="nowrap">{h.spotId}</td>
                    <td className="text-soft nowrap">{new Date(h.start).toLocaleString()}</td>
                    <td className="mono nowrap">{formatTL(h.cost)}</td>
                    <td><span className="pill pill--ghost">{h.paid}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
