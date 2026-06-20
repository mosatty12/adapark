import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Sparkles, Crown, X, Wallet, CheckCircle2, Lock, Apple, Banknote } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { formatTL } from '../lib/formatters.js'

export default function PaymentModal({ parking, spot, hours, rate, onClose, onSuccess }) {
  const { user, tiers, bookSpot, showToast } = useApp()
  const navigate = useNavigate()
  const sub = tiers.find((t) => t.id === user.subscriptionId)
  const oneTime = hours * rate

  const [method, setMethod] = useState(sub ? 'subscription' : 'card')
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', name: user.name, exp: '12/29', cvc: '123' })
  const [done, setDone] = useState(false)

  const submit = () => {
    if (method === 'subscription' && !sub) {
      showToast('You need an active subscription first', 'error')
      return
    }
    bookSpot(parking.id, spot.id, hours, method)
    setDone(true)
    setTimeout(() => { onSuccess && onSuccess() }, 1400)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <SuccessView spot={spot} parking={parking} hours={hours} />
        ) : (
          <>
            <div className="row between" style={{ marginBottom: 'var(--space-3)' }}>
              <div>
                <h2 style={{ fontWeight: 600 }}>Confirm reservation</h2>
                <p className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>
                  Spot {spot.id} · {parking.name} · {hours} hour{hours > 1 ? 's' : ''}
                </p>
              </div>
              <button className="btn btn--ghost" onClick={onClose} aria-label="Close"><X size={16} /></button>
            </div>

            <div className="pay-grid">
              <div>
                <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Payment method</div>
                <div className="stack gap-2">
                  <MethodTile
                    icon={<Crown size={18} />}
                    title="Subscription"
                    desc={sub ? `${sub.name} — included` : 'No active plan — choose another method'}
                    rightLabel={sub ? 'FREE' : ''}
                    active={method === 'subscription'}
                    disabled={!sub}
                    onClick={() => setMethod('subscription')}
                  />
                  <MethodTile
                    icon={<CreditCard size={18} />}
                    title="One-time card"
                    desc={`₺${rate}/hr × ${hours}h`}
                    rightLabel={formatTL(oneTime)}
                    active={method === 'card'}
                    onClick={() => setMethod('card')}
                  />
                  <MethodTile
                    icon={<Wallet size={18} />}
                    title="Wallet balance"
                    desc={`Available ${formatTL(user.walletBalanceTL)}`}
                    rightLabel={formatTL(oneTime)}
                    active={method === 'wallet'}
                    disabled={user.walletBalanceTL < oneTime}
                    onClick={() => setMethod('wallet')}
                  />
                  <MethodTile
                    icon={<Apple size={18} />}
                    title="Apple Pay"
                    desc="Touch to confirm"
                    rightLabel={formatTL(oneTime)}
                    active={method === 'applepay'}
                    onClick={() => setMethod('applepay')}
                  />
                </div>

                {!sub && (
                  <button className="btn btn--outline btn--block" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/app/subscription')}>
                    <Sparkles size={14} /> See subscription tiers — from ₺499.99 / mo
                  </button>
                )}
              </div>

              <div>
                <div className="text-soft" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Order summary</div>
                <div className="card card--flat" style={{ padding: 14 }}>
                  <Row k="Garage" v={parking.name} />
                  <Row k="Spot" v={spot.id} />
                  <Row k="Duration" v={`${hours} hour${hours > 1 ? 's' : ''}`} />
                  <Row k="Rate" v={`₺${rate}/hr`} />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: '10px 0' }} />
                  <div className="row between" style={{ fontWeight: 700, fontSize: '1.6rem' }}>
                    <span>Total</span>
                    <span className="mono">{method === 'subscription' ? <span className="text-success">Included</span> : formatTL(oneTime)}</span>
                  </div>
                </div>

                {method === 'card' && (
                  <div className="card card--flat" style={{ padding: 14, marginTop: 'var(--space-3)' }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>Card details</span>
                      <span className="text-soft" style={{ fontSize: '1.2rem', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Lock size={12}/> Encrypted</span>
                    </div>
                    <div className="field">
                      <input className="field__input" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder=" " />
                      <span className="field__label">Card number</span>
                    </div>
                    <div className="field">
                      <input className="field__input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder=" " />
                      <span className="field__label">Name on card</span>
                    </div>
                    <div className="row gap-2">
                      <div className="field" style={{ flex: 1 }}>
                        <input className="field__input" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder=" " />
                        <span className="field__label">Expiry</span>
                      </div>
                      <div className="field" style={{ width: 100 }}>
                        <input className="field__input" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder=" " />
                        <span className="field__label">CVC</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="row between" style={{ marginTop: 'var(--space-4)' }}>
              <button className="btn btn--dark-outline" onClick={onClose}>Back</button>
              <button className="btn btn--primary btn--lg" onClick={submit}>
                {method === 'subscription' ? 'Confirm & reserve' : `Pay ${formatTL(oneTime)}`}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{payCss}</style>
    </div>
  )
}

function SuccessView({ spot, parking, hours }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-3) 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--green-light)',
        margin: '0 auto var(--space-3)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <CheckCircle2 size={32} color="var(--green-accent)" />
      </div>
      <h2 style={{ color: 'var(--green-starbucks)', fontWeight: 600 }}>Spot {spot.id} is yours</h2>
      <p className="text-soft" style={{ marginTop: 6 }}>
        Reserved at {parking.name} for {hours} hour{hours > 1 ? 's' : ''}.
      </p>
      <p className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>
        Drive in any time within the next 15 minutes.
      </p>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="row between" style={{ fontSize: '1.4rem', padding: '4px 0' }}>
      <span className="text-soft">{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  )
}

function MethodTile({ icon, title, desc, rightLabel, active, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`method-tile ${active ? 'is-active' : ''}`}
    >
      <div className="method-tile__icon">{icon}</div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{title}</div>
        <div className="text-soft" style={{ fontSize: '1.2rem' }}>{desc}</div>
      </div>
      {rightLabel && <div style={{ fontWeight: 700, color: 'var(--green-starbucks)' }}>{rightLabel}</div>}
    </button>
  )
}

const payCss = `
.pay-grid { display: grid; gap: var(--space-4); grid-template-columns: 1fr; }
@media (min-width: 720px) { .pay-grid { grid-template-columns: 1fr 1fr; } }

.method-tile {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid var(--input-border);
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  transition: var(--transition-fast);
  color: var(--text-black);
}
.method-tile:hover:not(:disabled) { border-color: var(--green-accent); }
.method-tile:disabled { opacity: 0.45; cursor: not-allowed; }
.method-tile.is-active {
  border-color: var(--green-accent);
  box-shadow: 0 0 0 3px rgba(0,117,74,0.18);
}
.method-tile__icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--neutral-cool);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--green-starbucks);
}
.method-tile.is-active .method-tile__icon { background: var(--green-light); }
`
