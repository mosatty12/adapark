import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { isPlateMissing } from '../../lib/profileUtils.js'
import { Car, Mail, User, AlertCircle } from 'lucide-react'

export default function Account() {
  const { user, setUser, tiers, showToast, saveUserProfile } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plateInputRef = useRef(null)
  const startedWithoutPlate = useRef(isPlateMissing(user))
  const sub = tiers.find((t) => t.id === user.subscriptionId)
  const [saving, setSaving] = useState(false)
  const plateMissing = isPlateMissing(user)
  const setupPlate = searchParams.get('setup') === 'plate' || plateMissing

  useEffect(() => {
    if (setupPlate && plateInputRef.current) {
      plateInputRef.current.focus()
    }
  }, [setupPlate])

  const update = (path, value) => {
    setUser((u) => {
      const next = { ...u }
      const seg = path.split('.')
      let ref = next
      for (let i = 0; i < seg.length - 1; i++) ref = ref[seg[i]] = { ...ref[seg[i]] }
      ref[seg[seg.length - 1]] = value
      return next
    })
  }

  const save = async () => {
    if (isPlateMissing(user)) {
      showToast('Please enter your license plate.', 'error')
      plateInputRef.current?.focus()
      return
    }
    const completingSetup = startedWithoutPlate.current
    setSaving(true)
    const { error } = await saveUserProfile()
    setSaving(false)
    if (error) {
      showToast(error, 'error')
      return
    }
    showToast('Account saved', 'success')
    if (completingSetup) {
      navigate('/app', { replace: true })
    }
  }

  return (
    <div className="page page--tight">
      <h1>Your account</h1>

      {setupPlate && (
        <div className="account-setup-banner" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>Complete your profile</strong>
            <p>
              Add your license plate so we can match your vehicle to bookings and penalties.
              Other app features stay locked until this is saved.
            </p>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}><User size={16} style={{ verticalAlign: 'middle' }} /> Personal</h3>
        <label className="field">
          <input className="field__input" placeholder=" " value={user.name} onChange={(e) => update('name', e.target.value)} />
          <span className="field__label">Full name</span>
        </label>
        <label className="field">
          <input className="field__input" placeholder=" " value={user.email} readOnly aria-readonly="true" />
          <span className="field__label">Email</span>
        </label>
        <p className="text-soft" style={{ fontSize: '1.2rem', marginTop: -8, marginBottom: 'var(--space-3)' }}>
          <Mail size={12} style={{ verticalAlign: 'middle' }} /> Email is managed through your login and cannot be changed here.
        </p>
        <label className="field">
          <input className="field__input" placeholder=" " value={user.phone} onChange={(e) => update('phone', e.target.value)} />
          <span className="field__label">Phone</span>
        </label>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-3)' }}>
        <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}><Car size={16} style={{ verticalAlign: 'middle' }} /> Vehicle</h3>
        <label className="field">
          <input
            ref={plateInputRef}
            className="field__input"
            placeholder=" "
            value={user.vehicle.plate}
            onChange={(e) => update('vehicle.plate', e.target.value.toUpperCase())}
            required
            aria-required="true"
          />
          <span className="field__label">License plate{plateMissing ? ' (required)' : ''}</span>
        </label>
        <label className="field">
          <input className="field__input" placeholder=" " value={user.vehicle.make} onChange={(e) => update('vehicle.make', e.target.value)} />
          <span className="field__label">Make / model</span>
        </label>
        <label className="field">
          <input className="field__input" placeholder=" " value={user.vehicle.color} onChange={(e) => update('vehicle.color', e.target.value)} />
          <span className="field__label">Color</span>
        </label>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-3)' }}>
        <div className="row between">
          <div>
            <h3 style={{ fontWeight: 600 }}>Subscription</h3>
            <p className="text-soft" style={{ fontSize: '1.3rem', marginTop: 4 }}>{sub ? `${sub.name} — renews ${user.subscriptionRenewal}` : 'Pay-as-you-go'}</p>
          </div>
          <a href="/app/subscription" className="btn btn--outline">Manage</a>
        </div>
      </div>

      <button
        className="btn btn--primary btn--lg btn--block"
        style={{ marginTop: 'var(--space-4)' }}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving…' : plateMissing ? 'Save plate & continue' : 'Save changes'}
      </button>

      <style>{`
        .account-setup-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: var(--space-4);
          padding: 14px 16px;
          border-radius: 12px;
          background: #fff8e6;
          border: 1px solid #f5d98a;
          color: #7a5b00;
        }
        .account-setup-banner strong {
          display: block;
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .account-setup-banner p {
          margin: 0;
          font-size: 1.3rem;
          line-height: 1.45;
        }
      `}</style>
    </div>
  )
}
