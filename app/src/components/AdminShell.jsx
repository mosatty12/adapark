import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { LayoutDashboard, ParkingSquare, AlertOctagon, Tags, Users, LogOut, Shield } from 'lucide-react'
import { topnavCss } from './UserShell.jsx'

export default function AdminShell() {
  const { auth, signOut } = useApp()
  const navigate = useNavigate()
  const logout = async () => { await signOut(); navigate('/login') }
  return (
    <div className="app-shell">
      <header className="topnav admin-topnav">
        <div className="topnav__inner">
          <NavLink to="/admin" className="topnav__brand">
            <img src="/logo-mark-admin.svg" alt="" className="logo-mark-sm" width="32" height="32" />
            <span><span className="brand-text-full">Adapark </span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>Admin</span></span>
          </NavLink>
          <nav className="topnav__links">
            <NavLink end to="/admin" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><LayoutDashboard size={16}/> Overview</NavLink>
            <NavLink to="/admin/parkings" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><ParkingSquare size={16}/> Parkings</NavLink>
            <NavLink to="/admin/violations" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><AlertOctagon size={16}/> Violations</NavLink>
            <NavLink to="/admin/pricing" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><Tags size={16}/> Pricing</NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => 'topnav__link ' + (isActive ? 'is-active' : '')}><Users size={16}/> Users</NavLink>
          </nav>
          <div className="topnav__right">
            <span className="topnav__user" title={auth?.name}>
              <Shield size={14}/>
              <span className="topnav__user-name">{auth?.name}</span>
            </span>
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
      <style>{`
        .admin-topnav { border-bottom: 2px solid var(--gold-lightest); }
        @media (max-width: 1100px) { .brand-text-full { display: none; } }
      `}</style>
    </div>
  )
}
