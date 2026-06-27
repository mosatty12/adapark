import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { isPlateMissing } from '../lib/profileUtils.js'
import { Map, CreditCard, Wallet as WalletIcon, AlertTriangle, History, User as UserIcon, LogOut } from 'lucide-react'

export default function UserShell() {
  const { auth, signOut, user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const plateMissing = isPlateMissing(user)
  const onAccountPage = location.pathname.startsWith('/app/account')

  if (plateMissing && !onAccountPage) {
    return <Navigate to="/app/account?setup=plate" replace />
  }

  const logout = async () => { await signOut(); navigate('/login') }
  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav__inner">
          <NavLink to="/app" className="topnav__brand">
            <img src="/logo-mark.svg" alt="" className="logo-mark-sm" width="32" height="32" />
            <span>Adapark</span>
          </NavLink>
          <nav className="topnav__links">
            <NavLink end to="/app" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><Map size={16}/> Map</NavLink>
            <NavLink to="/app/subscription" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><CreditCard size={16}/> Subscription</NavLink>
            <NavLink to="/app/wallet" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><WalletIcon size={16}/> Wallet</NavLink>
            <NavLink to="/app/penalties" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><AlertTriangle size={16}/> Penalties</NavLink>
            <NavLink to="/app/history" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><History size={16}/> History</NavLink>
          </nav>
          <div className="topnav__right">
            <NavLink to="/app/account" className="topnav__user" title={auth?.name || user.name}>
              <UserIcon size={16}/>
              <span className="topnav__user-name">{auth?.name || user.name}</span>
            </NavLink>
            <button className="btn btn--dark-outline" onClick={logout}>
              <LogOut size={14}/>
              <span className="topnav__btn-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <style>{topnavCss}</style>
    </div>
  )
}

export const topnavCss = `
.topnav {
  position: sticky; top: 0; z-index: 50;
  background: #fff;
  box-shadow: var(--shadow-nav);
  padding-top: env(safe-area-inset-top, 0px);
}
.topnav__inner {
  max-width: 1440px;
  margin: 0 auto;
  height: 68px;
  padding: 0 var(--outer-gutter);
  display: flex; align-items: center; gap: var(--space-3);
}
@media (min-width: 1024px) {
  .topnav__inner { height: 80px; padding: 0 var(--outer-gutter-lg); gap: var(--space-4); }
}
.topnav__brand {
  display: inline-flex; align-items: center; gap: 10px;
  font-weight: 700; font-size: 1.8rem; color: var(--green-starbucks);
  letter-spacing: -0.4px;
}
.topnav__brand:hover { text-decoration: none; }
.logo-mark-sm {
  width: 32px; height: 32px;
  display: block;
  flex-shrink: 0;
}
.topnav__links {
  display: flex; align-items: center; gap: 2px;
  flex: 1;
  min-width: 0;
  margin-left: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
}
.topnav__links::-webkit-scrollbar { display: none; }
.topnav__link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  border-radius: var(--r-pill);
  font-size: 1.35rem; font-weight: 600;
  color: var(--text-black-soft);
  white-space: nowrap;
  transition: var(--transition-fast);
}
.topnav__link:hover { background: var(--ceramic); color: var(--text-black); text-decoration: none; }
.topnav__link.is-active {
  background: var(--green-light-33);
  color: var(--green-starbucks);
}
.topnav__right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.topnav__user {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: var(--r-pill);
  background: var(--neutral-cool);
  color: var(--text-black);
  font-weight: 600; font-size: 1.35rem;
  white-space: nowrap;
}
.topnav__user:hover { text-decoration: none; background: var(--ceramic); }
.topnav__user-name { white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.topnav__btn-label { white-space: nowrap; }
@media (max-width: 1180px) {
  .topnav__user-name { display: none; }
  .topnav__user { padding: 0; width: 36px; height: 36px; border-radius: 50%; justify-content: center; gap: 0; }
}
@media (max-width: 880px) {
  .topnav__brand > span:last-child { display: none; }
}
@media (max-width: 640px) {
  .topnav__btn-label { display: none; }
  .topnav__right .btn { padding: 0; width: 36px; height: 36px; border-radius: 50%; justify-content: center; }
  .topnav__inner {
    height: auto;
    min-height: 52px;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }
  .topnav__brand { font-size: 1.5rem; }
  .topnav__links {
    order: 3;
    flex: 1 1 100%;
    margin-left: 0;
    -webkit-overflow-scrolling: touch;
  }
  .topnav__link { padding: 6px 10px; font-size: 1.25rem; }
}
`
