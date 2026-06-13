import { useApp } from '../context/AppContext.jsx'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : Info
  const color = toast.type === 'success' ? 'var(--green-accent)' : toast.type === 'error' ? 'var(--red)' : 'var(--green-house)'
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--space-3) + 7rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--shadow-card-hover)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 200,
        border: `1px solid ${color}`,
        color: 'var(--text-black)',
        fontSize: '1.4rem',
        fontWeight: 600,
        animation: 'modalIn 0.18s ease',
      }}
    >
      <Icon size={18} color={color} />
      {toast.msg}
    </div>
  )
}
