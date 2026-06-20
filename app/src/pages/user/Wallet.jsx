import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Plus, ArrowDownRight, ArrowUpRight, Wallet as WalletIcon, CreditCard } from 'lucide-react'
import { formatTL } from '../../lib/formatters.js'

export default function Wallet() {
  const { user, topUp } = useApp()
  const [amount, setAmount] = useState(200)
  const txns = user.transactions || []

  return (
    <div className="page page--wide">
      <h1>Wallet</h1>
      <p className="text-soft" style={{ marginBottom: 'var(--space-4)' }}>Top up, view transactions, and earn parking stars.</p>

      <div className="wallet-grid">
        <div className="card" style={{ background: 'var(--green-house)', color: '#fff' }}>
          <div className="row gap-2"><WalletIcon size={20} color="var(--gold)"/><span style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</span></div>
          <div style={{ fontSize: '4rem', fontWeight: 700, marginTop: 6 }}>{formatTL(user.walletBalanceTL)}</div>
          <div className="row gap-2" style={{ marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
            {[100, 250, 500, 1000].map((n) => (
              <button key={n} className="btn btn--inverted" onClick={() => topUp(n)}><Plus size={14} /> {formatTL(n)}</button>
            ))}
          </div>
          <div className="row gap-2" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
            <label className="field" style={{ flex: 1, marginBottom: 0 }}>
              <input className="field__input" type="number" min="10" value={amount} onChange={(e) => setAmount(+e.target.value)} placeholder=" " style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} />
              <span className="field__label" style={{ color: 'var(--text-white-soft)' }}>Custom amount (TL)</span>
            </label>
            <button className="btn btn--primary" onClick={() => topUp(amount || 0)}>Top up</button>
          </div>
        </div>

        <div className="card">
          <div className="row gap-2"><span className="pill pill--gold">Stars</span><span className="text-soft" style={{ fontSize: '1.3rem' }}>Reward points</span></div>
          <div style={{ fontSize: '3.2rem', fontWeight: 700, color: 'var(--gold)', marginTop: 6 }}>{user.starsRewards}★</div>
          <p className="text-soft" style={{ fontSize: '1.3rem' }}>Earn 1 star per ₺10 spent · 250 stars = 1 free hour</p>
          <button className="btn btn--outline" style={{ marginTop: 'var(--space-2)' }}>Redeem stars</button>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600 }}>Saved cards</h3>
          <div className="card card--flat" style={{ marginTop: 12, padding: 14 }}>
            <div className="row between">
              <div className="row gap-2"><CreditCard size={18} /><b>Visa •••• 4242</b></div>
              <span className="pill pill--ok">Default</span>
            </div>
            <div className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>Expires 12/29</div>
          </div>
          <button className="btn btn--outline" style={{ marginTop: 12 }}><Plus size={14} /> Add card</button>
        </div>
      </div>

      <h2 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Transactions</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {txns.length === 0 ? (
          <div className="text-soft" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            No transactions yet. Top up or book a spot to get started.
          </div>
        ) : (
          txns.map((t, i) => (
            <div key={t.id} className="txn-row" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hairline)' }}>
              <div className="txn-row__icon" style={{
                background: t.delta > 0 ? 'var(--green-light)' : t.kind === 'penalty' ? 'rgba(200,32,20,0.10)' : 'var(--ceramic)',
                color: t.delta > 0 ? 'var(--green-accent)' : t.kind === 'penalty' ? 'var(--red)' : 'var(--text-black-soft)',
              }}>
                {t.delta > 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.label}</div>
                <div className="text-soft" style={{ fontSize: '1.2rem' }}>{t.date} · {t.kind}</div>
              </div>
              <div className="mono" style={{ fontWeight: 700, color: t.delta > 0 ? 'var(--green-starbucks)' : t.delta < 0 ? 'var(--text-black)' : 'var(--text-black-soft)' }}>
                {t.delta === 0 ? '—' : (t.delta > 0 ? '+' : '') + formatTL(t.delta)}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{walletCss}</style>
    </div>
  )
}

const walletCss = `
.wallet-grid {
  display: grid; gap: var(--space-3);
  grid-template-columns: 1fr;
}
@media (min-width: 720px) { .wallet-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1080px) { .wallet-grid { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); } }

.txn-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  font-size: 1.4rem;
}
.txn-row__icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
}
`
