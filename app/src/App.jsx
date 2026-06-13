import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext.jsx'
import Toast from './components/Toast.jsx'

import Login from './pages/Login.jsx'
import UserShell from './components/UserShell.jsx'
import AdminShell from './components/AdminShell.jsx'

import UserMap from './pages/user/UserMap.jsx'
import ParkingDetail from './pages/user/ParkingDetail.jsx'
import Subscription from './pages/user/Subscription.jsx'
import Wallet from './pages/user/Wallet.jsx'
import Penalties from './pages/user/Penalties.jsx'
import History from './pages/user/History.jsx'
import Account from './pages/user/Account.jsx'

import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminParkings from './pages/admin/AdminParkings.jsx'
import AdminParkingEdit from './pages/admin/AdminParkingEdit.jsx'
import AdminViolations from './pages/admin/AdminViolations.jsx'
import AdminPricing from './pages/admin/AdminPricing.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'

function ProtectedRoute({ role, children }) {
  const { auth, authLoading } = useApp()
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
        <p>Loading…</p>
        <style>{`
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
        `}</style>
      </div>
    )
  }
  if (!auth) return <Navigate to="/login" replace />
  if (role && auth.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* User routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute role="user">
              <UserShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserMap />} />
          <Route path="parking/:id" element={<ParkingDetail />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="penalties" element={<Penalties />} />
          <Route path="history" element={<History />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="parkings" element={<AdminParkings />} />
          <Route path="parkings/:id" element={<AdminParkingEdit />} />
          <Route path="violations" element={<AdminViolations />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toast />
    </>
  )
}
