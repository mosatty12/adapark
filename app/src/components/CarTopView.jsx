/**
 * Top-down car illustration for occupied parking stalls.
 * Drawn nose-up in a 24x42 portrait viewBox; pass orientation="h" to lay it
 * across for horizontal stalls (e.g. the east column of a real lot).
 * Body color follows `currentColor`; glass / lamp tints follow CSS vars so each
 * spot status can recolor it.
 */
export default function CarTopView({ orientation = 'v', className = '' }) {
  const horizontal = orientation === 'h'
  return (
    <svg
      className={`carart ${className}`}
      viewBox={horizontal ? '0 0 42 24' : '0 0 24 42'}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={horizontal ? 'translate(42 0) rotate(90)' : undefined}>
        <rect className="carart__body" x="3.4" y="1.8" width="17.2" height="38.4" rx="6" />
        <rect className="carart__mirror" x="1.4" y="13" width="2.4" height="3.4" rx="1.2" />
        <rect className="carart__mirror" x="20.2" y="13" width="2.4" height="3.4" rx="1.2" />
        <path className="carart__glass" d="M6.8 16 L17.2 16 L15.6 9.4 Q12 7.6 8.4 9.4 Z" />
        <rect className="carart__roof" x="8.2" y="16.6" width="7.6" height="10.4" rx="2" />
        <path className="carart__glass" d="M8 27.6 L16 27.6 L15.1 31.6 Q12 33.2 8.9 31.6 Z" />
        <rect className="carart__lamp" x="5.6" y="2.4" width="3.4" height="1.9" rx="0.9" />
        <rect className="carart__lamp" x="15" y="2.4" width="3.4" height="1.9" rx="0.9" />
        <rect className="carart__tail" x="5.8" y="37.4" width="3.2" height="1.6" rx="0.8" />
        <rect className="carart__tail" x="15" y="37.4" width="3.2" height="1.6" rx="0.8" />
      </g>
    </svg>
  )
}
