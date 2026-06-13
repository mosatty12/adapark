import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Check, Crown, Sparkles, Zap, Users, Star } from 'lucide-react'
import { formatTL } from '../../data/mockData.js'

export default function Subscription() {
  const { tiers, user, subscribe, cancelSubscription } = useApp()
  const [billing, setBilling] = useState('monthly')

  const current = tiers.find((t) => t.id === user.subscriptionId)

  return (
    <div className="page page--wide">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto var(--space-6)' }}>
        <span className="pill pill--info" style={{ marginBottom: 12 }}><Sparkles size={12} /> Plans starting at ₺499.99 / month</span>
        <h1 style={{ fontSize: '3.6rem', lineHeight: 1.1, marginBottom: 8 }}>Subscribe and stop counting hours</h1>
        <p className="text-soft" style={{ fontSize: '1.7rem' }}>
          Pay-as-you-go is ₺50/hour. Subscribers get bundled hours, priority booking, penalty-shield forgiveness, and more.
        </p>
      </div>

      <div className="billing-toggle">
        <button
          className={`billing-toggle__opt ${billing === 'monthly' ? 'is-active' : ''}`}
          onClick={() => setBilling('monthly')}
        >Monthly</button>
        <button
          className={`billing-toggle__opt ${billing === 'annual' ? 'is-active' : ''}`}
          onClick={() => setBilling('annual')}
        >Annual <span className="pill pill--gold" style={{ marginLeft: 6, padding: '2px 8px' }}>Save 20%</span></button>
      </div>

      <div className="tiers">
        {tiers.map((t) => (
          <TierCard
            key={t.id}
            tier={t}
            billing={billing}
            isCurrent={current?.id === t.id}
            onSubscribe={() => subscribe(t.id, billing)}
          />
        ))}
      </div>

      {current && (
        <div className="card" style={{ marginTop: 'var(--space-6)', maxWidth: 720, margin: 'var(--space-6) auto 0' }}>
          <div className="row between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active subscription</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-starbucks)' }}>{current.name}</div>
              <div className="text-soft" style={{ fontSize: '1.3rem' }}>Renews {user.subscriptionRenewal}</div>
            </div>
            <button className="btn btn--dark-outline" onClick={cancelSubscription}>Cancel subscription</button>
          </div>
        </div>
      )}

      <FaqStrip />

      <style>{tierCss}</style>
    </div>
  )
}

function TierCard({ tier, billing, isCurrent, onSubscribe }) {
  const price = billing === 'monthly' ? tier.monthly : tier.annualMonthlyEq
  const totalAnnual = billing === 'annual' ? tier.annual : null
  const accent = tier.color
  const isPlat = tier.id === 'platinum'

  return (
    <div className={`tier ${tier.popular ? 'is-popular' : ''} ${isPlat ? 'is-platinum' : ''}`} data-tier={tier.id}>
      {tier.popular && <div className="tier__ribbon">Most popular</div>}
      <div className="tier__head">
        <div className="row gap-2">
          {iconForTier(tier.id)}
          <div style={{ fontWeight: 700, fontSize: '1.8rem', color: isPlat ? 'var(--gold)' : 'var(--green-starbucks)' }}>{tier.name}</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="tier__price">{formatTL(price)}</span>
          <span className="text-soft" style={{ fontSize: '1.4rem' }}>/ mo</span>
        </div>
        {totalAnnual && (
          <div className="text-soft" style={{ fontSize: '1.3rem' }}>
            Billed annually as {formatTL(totalAnnual)}
          </div>
        )}
        {!totalAnnual && (
          <div className="text-soft" style={{ fontSize: '1.3rem' }}>
            Or {formatTL(tier.annualMonthlyEq)}/mo billed yearly
          </div>
        )}
      </div>
      <ul className="tier__perks">
        {tier.perks.map((p, i) => (
          <li key={i}><Check size={14} /> {p}</li>
        ))}
      </ul>
      <div style={{ flex: 1 }} />
      <div className="tier__overage text-soft">
        Overage: <b style={{ color: 'var(--text-black)' }}>{tier.overageRate === 0 ? 'No overage — unlimited' : `₺${tier.overageRate}/hr`}</b>
      </div>
      {isCurrent ? (
        <button className="btn btn--dark-outline btn--block" disabled>Current plan</button>
      ) : (
        <button className={`btn ${isPlat ? 'btn--dark' : tier.popular ? 'btn--primary' : 'btn--outline'} btn--block btn--lg`} onClick={onSubscribe}>
          {isCurrent ? 'Current plan' : `Choose ${tier.name}`}
        </button>
      )}
    </div>
  )
}

function iconForTier(id) {
  const sz = 22
  if (id === 'commuter') return <Zap size={sz} color="var(--green-accent)" />
  if (id === 'pro') return <Star size={sz} color="var(--green-starbucks)" />
  if (id === 'fleet') return <Users size={sz} color="var(--green-house)" />
  if (id === 'platinum') return <Crown size={sz} color="var(--gold)" />
  return <Sparkles size={sz} />
}

function FaqStrip() {
  const faqs = [
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel from this page. Access continues until the end of the billing period.' },
    { q: 'Does it cover all garages?', a: 'Commuter covers Lefkoşa only. Pro and above include all six North Cyprus cities and reserved corporate spots.' },
    { q: 'What happens after I use my included hours?', a: 'You pay the discounted overage rate (or nothing at all on Platinum).' },
    { q: 'Are penalties included?', a: 'Subscriptions include 0–unlimited "penalty-shield" forgiveness depending on tier.' },
  ]
  return (
    <div style={{ marginTop: 'var(--space-7)' }}>
      <h2 style={{ marginBottom: 'var(--space-3)' }}>Frequently asked</h2>
      <div className="faq-grid">
        {faqs.map((f) => (
          <div key={f.q} className="card">
            <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: 6 }}>{f.q}</h3>
            <p className="text-soft" style={{ fontSize: '1.4rem' }}>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const tierCss = `
.billing-toggle {
  display: inline-flex;
  background: #fff;
  padding: 4px;
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-card);
  margin: 0 auto var(--space-5);
  width: max-content;
  display: flex;
  justify-content: center;
}
.billing-toggle { display: flex; }
.billing-toggle__opt {
  border: none; background: transparent;
  padding: 10px 22px;
  border-radius: var(--r-pill);
  font-weight: 600; font-size: 1.4rem;
  color: var(--text-black-soft);
  display: inline-flex; align-items: center;
}
.billing-toggle__opt.is-active {
  background: var(--green-accent); color: #fff;
}
.tiers {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: stretch;
}
@media (min-width: 700px) { .tiers { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .tiers { grid-template-columns: repeat(4, 1fr); } }

.tier {
  position: relative;
  background: #fff;
  border-radius: var(--r-card);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  display: flex; flex-direction: column; gap: 14px;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}
.tier:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
.tier.is-popular {
  border-color: var(--green-accent);
  box-shadow: 0 0 0 3px rgba(0,117,74,0.10), var(--shadow-card-hover);
}
.tier.is-platinum {
  background: var(--green-house);
  color: #fff;
}
.tier.is-platinum .text-soft { color: var(--text-white-soft); }
.tier.is-platinum .tier__price { color: #fff; }
.tier.is-platinum .tier__perks li { color: rgba(255,255,255,0.92); }
.tier.is-platinum .tier__perks svg { color: var(--gold); }
.tier__ribbon {
  position: absolute; top: -12px; left: 16px;
  background: var(--green-starbucks); color: #fff;
  padding: 4px 14px; border-radius: 999px;
  font-size: 1.2rem; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase;
}
.tier__head { padding-bottom: 12px; border-bottom: 1px solid var(--hairline); }
.tier.is-platinum .tier__head { border-bottom-color: rgba(255,255,255,0.18); }
.tier__price { font-size: 3.2rem; font-weight: 700; color: var(--text-black); letter-spacing: -0.02em; }
.tier__perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.tier__perks li {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 1.4rem; color: var(--text-black);
}
.tier__perks svg { color: var(--green-accent); margin-top: 4px; flex-shrink: 0; }
.tier__overage { font-size: 1.3rem; }
.tier.is-platinum .tier__overage b { color: var(--gold); }

.faq-grid {
  display: grid; gap: var(--space-3);
  grid-template-columns: 1fr;
}
@media (min-width: 720px) { .faq-grid { grid-template-columns: 1fr 1fr; } }
`
