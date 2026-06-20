import { useEffect, useMemo, useState } from 'react'
import { Search, Crown, Star, Ban, ShieldCheck, RefreshCw } from 'lucide-react'
import { formatTL } from '../../lib/formatters.js'
import { SUBSCRIPTION_TIERS } from '../../data/parkingConfig.js'
import { supabase } from '../../supabase.js'
import { useApp } from '../../context/AppContext.jsx'

const TIER_NAME = SUBSCRIPTION_TIERS.reduce((acc, t) => {
  acc[t.id] = t.name
  return acc
}, {})

function tierLabel(subscriptionId) {
  if (!subscriptionId) return 'None'
  return TIER_NAME[subscriptionId] || subscriptionId
}

export default function AdminUsers() {
  const { showToast } = useApp()
  const [q, setQ] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setUsers([])
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.plate || '').toLowerCase().includes(term)
    )
  }, [users, q])

  const toggleStatus = async (u) => {
    const next = u.status === 'active' ? 'suspended' : 'active'
    setBusyId(u.id)
    const { error } = await supabase
      .from('profiles')
      .update({ status: next })
      .eq('id', u.id)
    setBusyId(null)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)))
    showToast(next === 'suspended' ? 'User suspended' : 'User reactivated', 'success')
  }

  return (
    <div className="page page--wide">
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>Users</h1>
          <p className="text-soft">Real signed-up drivers from your database.</p>
        </div>
        <button className="btn btn--outline" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div className="row gap-2" style={{ background: 'var(--neutral-cool)', borderRadius: 'var(--r-pill)', padding: '4px 12px' }}>
          <Search size={16} color="var(--text-black-soft)" />
          <input
            placeholder="Search by name, email, or plate"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, padding: '8px 0', fontSize: '1.4rem', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th className="nowrap">Plate</th>
                <th>Tier</th>
                <th className="num nowrap">Wallet</th>
                <th className="num nowrap">Stars</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-soft" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-soft" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No drivers found.</td></tr>
              ) : (
                filtered.map((u) => {
                  const tier = tierLabel(u.subscription_id)
                  return (
                    <tr key={u.id}>
                      <td className="nowrap"><b>{u.name || '—'}</b></td>
                      <td className="nowrap">{u.email}</td>
                      <td className="mono nowrap">{u.plate || <span className="text-soft">—</span>}</td>
                      <td>
                        <span className={`pill ${tier === 'Platinum' ? 'pill--gold' : tier === 'None' ? 'pill--ghost' : 'pill--info'}`}>
                          {tier === 'Platinum' && <Crown size={12}/>}
                          {tier === 'Pro Driver' && <Star size={12}/>}
                          {tier}
                        </span>
                      </td>
                      <td className="mono num nowrap"><b>{formatTL(Number(u.wallet_balance) || 0)}</b></td>
                      <td className="num nowrap">{u.stars_rewards || 0}</td>
                      <td>
                        <span className={`pill ${u.status === 'active' ? 'pill--ok' : 'pill--bad'}`}>{u.status}</span>
                      </td>
                      <td className="nowrap">
                        <div className="row gap-1">
                          {u.status === 'active' ? (
                            <button className="btn btn--ghost" onClick={() => toggleStatus(u)} disabled={busyId === u.id}>
                              <Ban size={12}/> Suspend
                            </button>
                          ) : (
                            <button className="btn btn--ghost" onClick={() => toggleStatus(u)} disabled={busyId === u.id}>
                              <ShieldCheck size={12}/> Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
