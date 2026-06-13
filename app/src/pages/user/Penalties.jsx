import { useApp } from '../../context/AppContext.jsx'
import { AlertTriangle, ShieldCheck, FileX } from 'lucide-react'
import { formatTL } from '../../data/mockData.js'

const TYPE_LABEL = {
  OVERSTAY: 'Overstay (over booked window)',
  WRONG_SPOT: 'Parking outside your assigned spot',
  NO_BOOKING: 'Parking without a booking',
  BLOCKING: 'Blocking access lane / disabled spot',
  EXPIRED_DOC: 'Expired vehicle documents',
}

export default function Penalties() {
  const { user, parkings, payPenalty, disputePenalty, penaltyRules } = useApp()
  const unpaid = user.penalties.filter((p) => p.status === 'unpaid')
  const totalDue = unpaid.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="page page--wide">
      <h1>Penalties</h1>
      <p className="text-soft" style={{ marginBottom: 'var(--space-4)' }}>
        Issued automatically by the CCTV-monitoring system or manually by admins.
      </p>

      <div className="pen-grid">
        <div className="card" style={{ background: 'var(--green-house)', color: '#fff' }}>
          <div className="row gap-2"><AlertTriangle size={18} color="var(--gold)" /><span style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</span></div>
          <div style={{ fontSize: '3.6rem', fontWeight: 700, marginTop: 6 }}>{formatTL(totalDue)}</div>
          <p style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem' }}>{unpaid.length} unpaid penalt{unpaid.length === 1 ? 'y' : 'ies'}</p>
        </div>

        <div className="card">
          <div className="row gap-2"><ShieldCheck size={18} color="var(--green-accent)" /><span className="text-soft" style={{ fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penalty shield</span></div>
          <p style={{ marginTop: 6, fontSize: '1.4rem' }}>
            Pro: <b>1 / 2</b> forgiveness used this month — saves you up to <b>{formatTL(150)}</b>.
          </p>
          <button className="btn btn--outline" style={{ marginTop: 8 }}>How it works</button>
        </div>

        <div className="card">
          <div className="row gap-2"><FileX size={18} /><span className="text-soft" style={{ fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispute</span></div>
          <p style={{ marginTop: 6, fontSize: '1.4rem' }}>Think a penalty is wrong? Submit a dispute — we'll review the CCTV footage within 24 hours.</p>
        </div>
      </div>

      <h2 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Your penalties</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="nowrap">ID</th>
                <th>Type</th>
                <th>Garage</th>
                <th className="nowrap">Date</th>
                <th className="nowrap">Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {user.penalties.length === 0 && (
                <tr><td colSpan={7} className="text-soft" style={{ textAlign: 'center', padding: 24 }}>No penalties yet — keep it up!</td></tr>
              )}
              {user.penalties.map((p) => {
                const garage = parkings.find((x) => x.id === p.parkingId)
                return (
                  <tr key={p.id}>
                    <td className="mono nowrap">{p.id}</td>
                    <td>{TYPE_LABEL[p.type] || p.type}</td>
                    <td>{garage?.name || p.parkingId}</td>
                    <td className="text-soft nowrap">{p.date}</td>
                    <td className="mono nowrap"><b>{formatTL(p.amount)}</b></td>
                    <td>
                      <span className={`pill ${p.status === 'paid' ? 'pill--ok' : p.status === 'disputed' ? 'pill--warn' : 'pill--bad'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="nowrap">
                      {p.status === 'unpaid' && (
                        <div className="row gap-1">
                          <button className="btn btn--primary" onClick={() => payPenalty(p.id)}>Pay</button>
                          <button className="btn btn--ghost" onClick={() => disputePenalty(p.id)}>Dispute</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <h2 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Penalty fees reference</h2>
      <div className="rules-grid">
        {penaltyRules.map((r) => (
          <div key={r.id} className="card">
            <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>{r.label}</div>
            <div className="text-soft" style={{ fontSize: '1.3rem', marginTop: 6 }}>
              Base fee: <b style={{ color: 'var(--text-black)' }}>{formatTL(r.baseFee)}</b>
              {r.perHour > 0 && <> · per extra hour: <b style={{ color: 'var(--text-black)' }}>{formatTL(r.perHour)}</b></>}
            </div>
          </div>
        ))}
      </div>

      <style>{penCss}</style>
    </div>
  )
}

const penCss = `
.pen-grid {
  display: grid; gap: var(--space-3);
  grid-template-columns: 1fr;
}
@media (min-width: 720px) { .pen-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1080px) { .pen-grid { grid-template-columns: 1.2fr 1fr 1fr; } }

.rules-grid {
  display: grid; gap: var(--space-3);
  grid-template-columns: 1fr;
}
@media (min-width: 700px) { .rules-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .rules-grid { grid-template-columns: repeat(3, 1fr); } }
`
