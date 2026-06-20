import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { isPlateMissing } from '../lib/profileUtils.js'
import { isSupabaseConfigured, supabaseConfigError } from '../supabase.js'
import { Car, Shield, MapPin, Sparkles } from 'lucide-react'

export default function Login() {
  const { auth, authLoading, signIn, signUp, user } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [role, setRole] = useState('user')
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && auth) {
      if (auth.role === 'admin') {
        navigate('/admin', { replace: true })
        return
      }
      if (isPlateMissing(user)) {
        navigate('/app/account?setup=plate', { replace: true })
        return
      }
      navigate('/app', { replace: true })
    }
  }, [auth, authLoading, navigate, user])

  const onRoleChange = (r) => {
    setRole(r)
    setError('')
    setInfo('')
    if (mode === 'signup' && r === 'admin') setMode('signin')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (role !== 'user') {
          setError('Only driver accounts can be created here. Ask an admin to create admin accounts.')
          return
        }
        if (!name.trim()) {
          setError('Please enter your full name.')
          return
        }
        if (!plate.trim()) {
          setError('Please enter your license plate.')
          return
        }
        const result = await signUp(email, password, name.trim(), plate.trim())
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.needsConfirmation) {
          setInfo(result.message || 'Check your email to confirm your account, then sign in.')
          setMode('signin')
          return
        }
        navigate('/app', { replace: true })
        return
      }

      const result = await signIn(email, password, role)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.role === 'admin') {
        navigate('/admin', { replace: true })
        return
      }
      if (result.needsPlate) {
        navigate('/app/account?setup=plate', { replace: true })
        return
      }
      navigate('/app', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
        <p>Loading…</p>
        <style>{authLoadingCss}</style>
      </div>
    )
  }

  return (
    <div className="login-root">
      <div className="login-hero">
        <div className="login-hero__inner">
          <div className="row gap-2" style={{ marginBottom: 'var(--space-4)', alignItems: 'center' }}>
            <div className="logo-mark">A</div>
            <div className="logo-word">Adapark<span className="logo-word__tld">.kktc</span></div>
          </div>
          <h1 className="login-hero__title">
            Park smart<br />Park warm
          </h1>
          <p style={{ color: 'var(--text-white-soft)', fontSize: '1.7rem', marginTop: 'var(--space-3)', maxWidth: 460 }}>
            A smart, subscription-friendly parking network for the EMU campus in
            Gazimağusa. Reserve your spot before you arrive, and enjoy fair,
            transparent parking rules.
          </p>

          <div className="login-hero__feats">
            <Feat icon={<MapPin size={16} />} title="Live nearest spots" sub="Real-time vacancy on a map" />
            <Feat icon={<Shield size={16} />} title="Fair penalties" sub="Clear rules, easy disputes" />
            <Feat icon={<Sparkles size={16} />} title="From ₺499.99 / mo" sub="Or pay one-time at ₺50/hour" />
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <h1>{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
          <p className="text-soft" style={{ marginTop: 6 }}>
            {mode === 'signup'
              ? 'Register as a driver with your email and password.'
              : 'Welcome back. Choose how you\'ll sign in today.'}
          </p>

          <div className="mode-switch" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`mode-switch__tab ${mode === 'signin' ? 'is-active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); setInfo('') }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`mode-switch__tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => { setMode('signup'); setRole('user'); setError(''); setInfo('') }}
            >
              Sign up
            </button>
          </div>

          {mode === 'signin' && (
            <div className="role-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={role === 'user'}
                className={`role-switch__tab ${role === 'user' ? 'is-active' : ''}`}
                onClick={() => onRoleChange('user')}
              >
                <Car size={16} /> Driver
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={role === 'admin'}
                className={`role-switch__tab ${role === 'admin' ? 'is-active' : ''}`}
                onClick={() => onRoleChange('admin')}
              >
                <Shield size={16} /> Admin
              </button>
            </div>
          )}

          {!isSupabaseConfigured && (
            <p className="login-alert login-alert--error" style={{ marginTop: 'var(--space-4)' }}>
              {supabaseConfigError}
            </p>
          )}

          <form onSubmit={submit} style={{ marginTop: 'var(--space-4)' }}>
            {mode === 'signup' && (
              <>
                <label className="field">
                  <input
                    className="field__input"
                    placeholder=" "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    required
                  />
                  <span className="field__label">Full name</span>
                </label>
                <label className="field">
                  <input
                    className="field__input"
                    placeholder=" "
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    type="text"
                    required
                  />
                  <span className="field__label">License plate</span>
                </label>
              </>
            )}
            <label className="field">
              <input
                className="field__input"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
              <span className="field__label">Email</span>
            </label>
            <label className="field">
              <input
                className="field__input"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <span className="field__label">Password</span>
            </label>

            {error && <p className="login-alert login-alert--error">{error}</p>}
            {info && <p className="login-alert login-alert--info">{info}</p>}

            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={loading || !isSupabaseConfigured}
            >
              {loading
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create driver account'
                  : role === 'user'
                    ? 'Sign in as Driver'
                    : 'Sign in as Admin'}
            </button>

            <div className="login-foot">
              <span className="text-soft" style={{ fontSize: '1.3rem' }}>
                {mode === 'signup'
                  ? 'Already have an account? Switch to Sign in above.'
                  : 'New driver? Switch to Sign up above.'}
              </span>
            </div>
          </form>
        </div>
      </div>

      <style>{loginCss}</style>
    </div>
  )
}

function Feat({ icon, title, sub }) {
  return (
    <div className="feat">
      <div className="feat__icon">{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '1.4rem', color: '#fff' }}>{title}</div>
        <div style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem' }}>{sub}</div>
      </div>
    </div>
  )
}

const authLoadingCss = `
.auth-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: var(--neutral-warm);
  color: var(--text-black-soft);
}
.auth-loading__spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--ceramic);
  border-top-color: var(--green-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
`

const loginCss = `
.login-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--neutral-warm);
}
@media (min-width: 960px) {
  .login-root { grid-template-columns: 1.05fr 0.95fr; }
}
.login-hero {
  background: var(--green-house);
  color: #fff;
  padding: var(--space-7) var(--outer-gutter-lg);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.login-hero::after {
  content: '';
  position: absolute;
  inset: auto -100px -120px auto;
  width: 360px; height: 360px;
  background: radial-gradient(circle at 30% 30%, var(--green-accent) 0%, transparent 70%);
  opacity: 0.6;
  pointer-events: none;
}
.login-hero__inner { max-width: 520px; position: relative; z-index: 2; }
.login-hero__title {
  color: #fff;
  font-size: clamp(2.8rem, 8vw, 4.4rem);
  line-height: 1.1;
  font-weight: 600;
}
.login-hero__feats {
  margin-top: var(--space-6);
  display: flex; flex-direction: column; gap: var(--space-3);
}
.feat { display: flex; align-items: flex-start; gap: 14px; }
.feat__icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--green-accent);
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.logo-mark {
  width: 40px; height: 40px; border-radius: 12px;
  background: var(--green-accent); color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 2.2rem;
  letter-spacing: -0.5px;
}
.logo-word { color: #fff; font-weight: 700; font-size: 2rem; letter-spacing: -0.5px; }
.logo-word__tld { color: var(--gold); font-weight: 600; font-size: 1.4rem; margin-left: 2px; letter-spacing: 0; }
.login-form-wrap {
  padding: var(--space-7) var(--outer-gutter-lg);
  display: flex; align-items: center; justify-content: center;
}
.login-card {
  background: #fff;
  width: 100%; max-width: 460px;
  border-radius: var(--r-card);
  padding: var(--space-6) var(--space-5);
  box-shadow: var(--shadow-card);
}
.login-card h1 { font-size: 2.4rem; }
.mode-switch, .role-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--ceramic);
  border-radius: var(--r-pill);
  padding: 4px;
  margin-top: var(--space-4);
}
.mode-switch__tab, .role-switch__tab {
  border: none; background: transparent;
  padding: 10px 12px;
  border-radius: var(--r-pill);
  font-size: 1.4rem; font-weight: 600;
  color: var(--text-black-soft);
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  transition: var(--transition-fast);
}
.mode-switch__tab.is-active, .role-switch__tab.is-active {
  background: #fff; color: var(--green-starbucks);
  box-shadow: var(--shadow-card);
}
.login-alert {
  font-size: 1.3rem;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: var(--space-3);
}
.login-alert--error {
  background: #fdecea;
  color: #b42318;
}
.login-alert--info {
  background: var(--green-light-33);
  color: var(--green-house);
}
.login-foot { text-align: center; margin-top: var(--space-4); }
@media (max-width: 640px) {
  .login-hero { padding: var(--space-5) var(--space-3); padding-top: max(var(--space-5), env(safe-area-inset-top, 0px)); }
  .login-form-wrap { padding: var(--space-4) var(--space-3); padding-bottom: max(var(--space-4), env(safe-area-inset-bottom, 0px)); }
  .login-card { padding: var(--space-4) var(--space-3); }
  .login-card h1 { font-size: 2rem; }
  .login-hero__feats { margin-top: var(--space-4); }
}
`
