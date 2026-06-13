// Lightweight pure-SVG chart components — no external libs.

export function BarChart({ data, height = 180, color = 'var(--green-accent)', formatY }) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 28)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{
                width: '100%', maxWidth: 56,
                height: Math.max(h, 4),
                background: color,
                opacity: 0.9,
                borderRadius: '4px 4px 0 0',
                position: 'relative',
              }}
                title={formatY ? formatY(d.value) : d.value}
              />
              <div style={{ fontSize: '1.2rem', color: 'var(--text-black-soft)', marginTop: 6, fontWeight: 600 }}>{d.label}</div>
            </div>
          )
        })}
      </div>
      {formatY && (
        <div style={{ fontSize: '1.2rem', color: 'var(--text-black-soft)', marginTop: 8 }}>
          Peak {formatY(max)} · Total {formatY(data.reduce((s, d) => s + d.value, 0))}
        </div>
      )}
    </div>
  )
}

export function LineChart({ data, height = 200, color = 'var(--green-starbucks)' }) {
  const max = Math.max(...data) || 1
  const step = 100 / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 20) - 10}`).join(' ')
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="lcGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.4" points={points} />
      <polygon fill="url(#lcGrad)" points={`${points} 100,${height} 0,${height}`} />
    </svg>
  )
}

export function Donut({ value, total, label, color = 'var(--green-accent)', size = 150 }) {
  const pct = total > 0 ? value / total : 0
  const r = 60, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--ceramic)" strokeWidth="14" />
      <circle
        cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${pct * c} ${c}`}
        strokeDashoffset={c / 4}
        transform="rotate(-90 80 80)"
        strokeLinecap="round"
      />
      <text x="80" y="78" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--text-black)">{Math.round(pct * 100)}%</text>
      <text x="80" y="100" textAnchor="middle" fontSize="11" fill="var(--text-black-soft)">{label}</text>
    </svg>
  )
}
