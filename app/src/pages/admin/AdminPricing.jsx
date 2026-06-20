import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Save, RefreshCw, Tag, Crown } from 'lucide-react'
import { formatTL } from '../../lib/formatters.js'

export default function AdminPricing() {
  const { tiers, updateTier, parkings, updateParking, hourlyRate, setHourlyRate, penaltyRules, updatePenaltyRule, showToast } = useApp()
  const [draftRate, setDraftRate] = useState(hourlyRate)

  return (
    <div className="page page--wide">
      <h1>Pricing & subscription tiers</h1>
      <p className="text-soft" style={{ marginBottom: 'var(--space-4)' }}>Adjust hourly rates per garage, edit subscription tiers, and tune penalty fees.</p>

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Network base hourly rate</h3>
            <p className="text-soft" style={{ fontSize: '1.3rem' }}>Default rate for any garage without an override.</p>
          </div>
          <div className="row gap-2">
            <label className="field" style={{ marginBottom: 0, width: 180 }}>
              <input className="field__input" type="number" value={draftRate} onChange={(e) => setDraftRate(+e.target.value)} placeholder=" " />
              <span className="field__label">Base ₺/hr</span>
            </label>
            <button className="btn btn--primary" onClick={() => { setHourlyRate(draftRate); showToast('Base rate updated', 'success') }}>
              <Save size={14}/> Save
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Per-garage hourly rates</h2>
      <div className="rules-grid">
        {parkings.map((p) => (
          <div key={p.id} className="card">
            <div className="row between">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>{p.name}</div>
                <div className="text-soft" style={{ fontSize: '1.3rem' }}>{p.area}</div>
              </div>
              <span className="pill pill--ghost">{p.crowdLevel}</span>
            </div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <label className="field" style={{ marginBottom: 0, flex: 1 }}>
                <input className="field__input" type="number" value={p.hourlyOverride} onChange={(e) => updateParking(p.id, { hourlyOverride: +e.target.value })} placeholder=" " />
                <span className="field__label">₺ / hour</span>
              </label>
              {p.suggestedFeeChange !== 0 && (
                <button className="btn btn--dark-outline" onClick={() => {
                  const nr = Math.round(p.hourlyOverride * (1 + p.suggestedFeeChange / 100))
                  updateParking(p.id, { hourlyOverride: nr, suggestedFeeChange: 0 })
                  showToast(`Suggestion applied: ₺${nr}/hr`, 'success')
                }}>
                  <RefreshCw size={12}/> Apply {p.suggestedFeeChange > 0 ? '+' : ''}{p.suggestedFeeChange}%
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontWeight: 600, marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Subscription tiers</h2>
      <div className="rules-grid">
        {tiers.map((t) => (
          <div key={t.id} className={`card ${t.id === 'platinum' ? 'platinum-edit' : ''}`}>
            <div className="row gap-2" style={{ marginBottom: 8 }}>
              {t.id === 'platinum' && <Crown size={16} color="var(--gold)" />}
              <h3 style={{ fontWeight: 700, color: t.id === 'platinum' ? 'var(--gold)' : 'var(--green-starbucks)' }}>{t.name}</h3>
              {t.popular && <span className="pill pill--info">Popular</span>}
            </div>
            <div className="row gap-2">
              <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                <input className="field__input" type="number" step="0.01" value={t.monthly} onChange={(e) => updateTier(t.id, { monthly: +e.target.value })} placeholder=" " />
                <span className="field__label">Monthly TL</span>
              </label>
              <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                <input className="field__input" type="number" step="0.01" value={t.annual} onChange={(e) => updateTier(t.id, { annual: +e.target.value, annualMonthlyEq: +(e.target.value / 12).toFixed(2) })} placeholder=" " />
                <span className="field__label">Annual TL</span>
              </label>
            </div>
            <label className="field" style={{ marginTop: 12, marginBottom: 0 }}>
              <input className="field__input" type="number" value={t.overageRate} onChange={(e) => updateTier(t.id, { overageRate: +e.target.value })} placeholder=" " />
              <span className="field__label">Overage rate (₺/hr) — 0 = unlimited</span>
            </label>
            <div className="text-soft" style={{ fontSize: '1.3rem', marginTop: 8 }}>
              Annual = {formatTL(t.annual)} (~{formatTL(t.annual / 12)} / mo)
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontWeight: 600, marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Penalty fees</h2>
      <div className="rules-grid">
        {penaltyRules.map((r) => (
          <div key={r.id} className="card">
            <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>{r.label}</div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                <input className="field__input" type="number" value={r.baseFee} onChange={(e) => updatePenaltyRule(r.id, { baseFee: +e.target.value })} placeholder=" " />
                <span className="field__label">Base fee (TL)</span>
              </label>
              <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                <input className="field__input" type="number" value={r.perHour} onChange={(e) => updatePenaltyRule(r.id, { perHour: +e.target.value })} placeholder=" " />
                <span className="field__label">Per extra hour</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .platinum-edit { background: var(--green-house); color: #fff; }
        .platinum-edit .text-soft { color: var(--text-white-soft); }
        .platinum-edit .field__input { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.18); }
        .platinum-edit .field__label,
        .platinum-edit .field__input:focus + .field__label,
        .platinum-edit .field__input:not(:placeholder-shown) + .field__label {
          color: var(--gold);
        }
      `}</style>
    </div>
  )
}
