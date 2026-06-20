import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { TrendingUp, TrendingDown, Activity, AlertOctagon, Users, ArrowUpRight, Sparkles } from 'lucide-react'
import { BarChart, LineChart, Donut } from '../../components/Charts.jsx'
import { formatTLShort } from '../../lib/formatters.js'
import { spotCounts } from '../../lib/parkingStats.js'
import { supabase } from '../../supabase.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function last7DayLabels() {
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(DAY_LABELS[d.getDay()])
  }
  return labels
}

function buildRevenueSeries(transactions) {
  const labels = last7DayLabels()
  const buckets = labels.map((label) => ({ label, value: 0 }))
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  for (const txn of transactions) {
    if (!txn.created_at || txn.kind !== 'park') continue
    const when = new Date(txn.created_at)
    if (when < start) continue
    const dayIndex = Math.floor((when - start) / (24 * 60 * 60 * 1000))
    if (dayIndex >= 0 && dayIndex < buckets.length) {
      buckets[dayIndex].value += Math.abs(Number(txn.delta) || 0)
    }
  }
  return buckets
}

export default function AdminOverview() {
  const { parkings, violations, updateParking } = useApp()
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    let mounted = true
    supabase
      .from('transactions')
      .select('kind, delta, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!mounted || error) return
        setTransactions(data || [])
      })
    return () => { mounted = false }
  }, [])

  const revenueLast7 = useMemo(() => buildRevenueSeries(transactions), [transactions])
  const revenueWeek = revenueLast7.reduce((s, d) => s + d.value, 0)

  const totalSpots = parkings.reduce((s, p) => s + p.layout.spots.length, 0)
  const occupiedSpots = parkings.reduce((s, p) => s + p.layout.spots.filter((sp) => sp.status !== 'empty').length, 0)
  const networkOccPct = totalSpots ? Math.round((occupiedSpots / totalSpots) * 100) : 0
  const hourlyOccupancy = useMemo(() => Array.from({ length: 24 }, () => networkOccPct), [networkOccPct])

  const unpaidViolations = violations.filter((v) => v.status === 'unpaid').length
  const suggestions = parkings.filter((p) => p.suggestedFeeChange !== 0)
  const ranked = useMemo(
    () => [...parkings].sort((a, b) => spotCounts(b).pct - spotCounts(a).pct),
    [parkings]
  )

  return (
    <div className="page page--wide">
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1>Operations overview</h1>
          <p className="text-soft">Live network status across all garages and penalties.</p>
        </div>
        <div className="row gap-2">
          <Link to="/admin/parkings" className="btn btn--primary">Manage parkings</Link>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={<Activity size={18} />} label="Parking revenue (7d)" value={formatTLShort(revenueWeek)} sub="from wallet transactions" />
        <KpiCard icon={<TrendingUp size={18} />} label="Network occupancy" value={`${networkOccPct}%`} sub={`${occupiedSpots} / ${totalSpots} spots`} />
        <KpiCard icon={<Users size={18} />} label="Active garages" value={parkings.length} sub="EMU campus" />
        <KpiCard icon={<AlertOctagon size={18} />} label="Unpaid penalties" value={unpaidViolations} sub="requires review" warn />
      </div>

      <div className="ov-grid">
        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Revenue · last 7 days</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Parking payments recorded in Supabase</p>
            </div>
          </div>
          {revenueWeek > 0 ? (
            <BarChart
              data={revenueLast7}
              color="var(--green-accent)"
              height={200}
              formatY={formatTLShort}
            />
          ) : (
            <p className="text-soft" style={{ padding: 'var(--space-4) 0', textAlign: 'center' }}>
              No parking revenue recorded yet.
            </p>
          )}
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Live occupancy</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Current network-wide spot usage</p>
            </div>
            <span className="pill pill--info">{networkOccPct}% now</span>
          </div>
          <LineChart data={hourlyOccupancy} height={200} />
          <div className="row between text-soft" style={{ fontSize: '1.2rem', marginTop: 4 }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
          </div>
        </div>
      </div>

      <div className="ov-grid">
        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Garages by occupancy</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Click to manage</p>
            </div>
          </div>
          <div className="stack gap-2">
            {ranked.map((p, i) => {
              const { pct } = spotCounts(p)
              return (
                <Link key={p.id} to={`/admin/parkings/${p.id}`} className="rev-row">
                  <div style={{ width: 22, color: 'var(--text-black-soft)', fontWeight: 700, fontSize: '1.3rem' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="rev-row__bar"><div style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="mono" style={{ fontWeight: 700 }}>{pct}%</div>
                  <ArrowUpRight size={14} color="var(--text-black-soft)" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Network occupancy</h3>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3) 0' }}>
            <Donut value={occupiedSpots} total={totalSpots} label="occupied" />
          </div>
          <div className="text-soft" style={{ fontSize: '1.3rem', textAlign: 'center' }}>
            {occupiedSpots} / {totalSpots} spots in use across {parkings.length} garages
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}><Sparkles size={16} style={{ verticalAlign: 'middle', color: 'var(--gold)' }} /> Pricing suggestions</h3>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>Admin-set fee adjustments. One-click apply.</p>
          </div>
          <Link to="/admin/pricing" className="btn btn--outline">All pricing rules</Link>
        </div>
        <div className="suggest-grid">
          {suggestions.length === 0 && <div className="text-soft">No suggestions right now — everything looks balanced.</div>}
          {suggestions.map((p) => {
            const pct = p.suggestedFeeChange
            const { pct: occPct } = spotCounts(p)
            const newRate = Math.round(p.hourlyOverride * (1 + pct / 100))
            return (
              <div key={p.id} className="suggest">
                <div>
                  <div className="row gap-2">
                    <span className="pill pill--ghost">{p.area}</span>
                    <span className={`pill ${pct > 0 ? 'pill--warn' : 'pill--ok'}`}>
                      {pct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {pct > 0 ? '+' : ''}{pct}%
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', marginTop: 6 }}>{p.name}</div>
                  <p className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>
                    Current occupancy <b>{occPct}%</b>.
                    Suggest changing rate from <b>₺{p.hourlyOverride}/hr</b> to <b style={{ color: pct > 0 ? 'var(--green-starbucks)' : 'var(--green-accent)' }}>₺{newRate}/hr</b>.
                  </p>
                </div>
                <div className="row gap-2">
                  <button className="btn btn--primary" onClick={() => updateParking(p.id, { hourlyOverride: newRate, suggestedFeeChange: 0 })}>Apply</button>
                  <button className="btn btn--ghost" onClick={() => updateParking(p.id, { suggestedFeeChange: 0 })}>Dismiss</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{ovCss}</style>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, delta, deltaUp, warn }) {
  return (
    <div className="card kpi-card">
      <div className="row between">
        <span className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span className={`kpi-card__icon ${warn ? 'is-warn' : ''}`}>{icon}</span>
      </div>
      <div style={{ fontSize: '2.8rem', fontWeight: 700, marginTop: 6 }}>{value}</div>
      {(sub || delta) && (
        <div className="text-soft" style={{ fontSize: '1.3rem' }}>
          {delta && <span style={{ color: deltaUp ? 'var(--green-starbucks)' : 'var(--red)', fontWeight: 700 }}>{deltaUp ? '↑' : '↓'} {delta}</span>}
          {delta && sub && ' · '}
          {sub}
        </div>
      )}
    </div>
  )
}

const ovCss = `
.kpi-card { padding: var(--space-3); }
.kpi-card__icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--green-light);
  color: var(--green-accent);
  display: inline-flex; align-items: center; justify-content: center;
}
.kpi-card__icon.is-warn { background: rgba(251,188,5,0.16); color: #8a6d04; }

.ov-grid {
  display: grid; gap: var(--space-3);
  grid-template-columns: 1fr;
  margin-bottom: var(--space-4);
}
@media (min-width: 920px) { .ov-grid { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); } }

.rev-row {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 12px; border-radius: 10px;
  color: var(--text-black);
}
.rev-row:hover { background: var(--neutral-cool); text-decoration: none; }
.rev-row__bar {
  height: 6px; border-radius: 6px;
  background: var(--ceramic);
  margin-top: 6px;
  overflow: hidden;
}
.rev-row__bar > div {
  height: 100%; background: var(--green-accent);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.suggest-grid {
  display: grid; grid-template-columns: 1fr; gap: var(--space-3);
}
@media (min-width: 880px) { .suggest-grid { grid-template-columns: 1fr 1fr; } }

.suggest {
  display: flex; flex-direction: column; gap: 12px;
  background: var(--neutral-warm);
  border-radius: var(--r-card);
  padding: 14px 16px;
  border: 1px solid var(--hairline);
}
@media (min-width: 700px) {
  .suggest { flex-direction: row; align-items: center; justify-content: space-between; }
}
`
