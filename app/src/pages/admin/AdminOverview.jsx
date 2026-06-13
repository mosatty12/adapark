import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { TrendingUp, TrendingDown, Activity, AlertOctagon, Users, ArrowUpRight, Sparkles } from 'lucide-react'
import { BarChart, LineChart, Donut } from '../../components/Charts.jsx'
import { REVENUE_LAST_7, HOURLY_OCCUPANCY, formatTL, formatTLShort } from '../../data/mockData.js'

export default function AdminOverview() {
  const { parkings, violations, updateParking, hourlyRate } = useApp()

  const revenueWeek = REVENUE_LAST_7.reduce((s, d) => s + d.total, 0)
  const totalSpots = parkings.reduce((s, p) => s + p.layout.spots.length, 0)
  const occupiedSpots = parkings.reduce((s, p) => s + p.layout.spots.filter((sp) => sp.status !== 'empty').length, 0)
  const pendingViolations = violations.filter((v) => v.status === 'pending').length
  const monthlyRev = parkings.reduce((s, p) => s + p.revenueMonthTL, 0)

  const ranked = [...parkings].sort((a, b) => b.revenueMonthTL - a.revenueMonthTL)
  const suggestions = parkings.filter((p) => p.suggestedFeeChange !== 0)

  return (
    <div className="page page--wide">
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1>Operations overview</h1>
          <p className="text-soft">Live network status across all garages and violations.</p>
        </div>
        <div className="row gap-2">
          <Link to="/admin/parkings" className="btn btn--primary">Manage parkings</Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <KpiCard icon={<Activity size={18} />} label="Monthly revenue" value={formatTLShort(monthlyRev)} delta="+8.2%" deltaUp />
        <KpiCard icon={<TrendingUp size={18} />} label="This week" value={formatTLShort(revenueWeek)} delta="+12.4%" deltaUp />
        <KpiCard icon={<Users size={18} />} label="Network occupancy" value={`${Math.round((occupiedSpots/totalSpots)*100)}%`} delta="3.1%" deltaUp />
        <KpiCard icon={<AlertOctagon size={18} />} label="Pending violations" value={pendingViolations} sub="requires review" warn />
      </div>

      {/* Charts */}
      <div className="ov-grid">
        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Revenue · last 7 days</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Across all garages, all payment types</p>
            </div>
            <span className="pill pill--ok"><TrendingUp size={12} /> +12.4%</span>
          </div>
          <BarChart
            data={REVENUE_LAST_7.map((d) => ({ label: d.day, value: d.total }))}
            color="var(--green-accent)"
            height={200}
            formatY={formatTLShort}
          />
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Hourly occupancy · today</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Network-wide, % of spots occupied</p>
            </div>
            <span className="pill pill--info">Peak {Math.max(...HOURLY_OCCUPANCY)}%</span>
          </div>
          <LineChart data={HOURLY_OCCUPANCY} height={200} />
          <div className="row between text-soft" style={{ fontSize: '1.2rem', marginTop: 4 }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
          </div>
        </div>
      </div>

      {/* Top revenue parkings */}
      <div className="ov-grid">
        <div className="card">
          <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Top revenue garages this month</h3>
              <p className="text-soft" style={{ fontSize: '1.3rem' }}>Click to manage</p>
            </div>
          </div>
          <div className="stack gap-2">
            {ranked.map((p, i) => {
              const pct = (p.revenueMonthTL / ranked[0].revenueMonthTL) * 100
              return (
                <Link key={p.id} to={`/admin/parkings/${p.id}`} className="rev-row">
                  <div style={{ width: 22, color: 'var(--text-black-soft)', fontWeight: 700, fontSize: '1.3rem' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="rev-row__bar"><div style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="mono" style={{ fontWeight: 700 }}>{formatTLShort(p.revenueMonthTL)}</div>
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

      {/* Smart suggestions */}
      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}><Sparkles size={16} style={{ verticalAlign: 'middle', color: 'var(--gold)' }} /> Pricing suggestions</h3>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>Based on local crowdedness and spot scarcity. One-click apply.</p>
          </div>
          <Link to="/admin/pricing" className="btn btn--outline">All pricing rules</Link>
        </div>
        <div className="suggest-grid">
          {suggestions.length === 0 && <div className="text-soft">No suggestions right now — everything looks balanced.</div>}
          {suggestions.map((p) => {
            const pct = p.suggestedFeeChange
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
                    Street load is at <b>{Math.round(p.streetCrowdedness * 100)}%</b>, occupancy <b>{p.occupancyPct}%</b>.
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
