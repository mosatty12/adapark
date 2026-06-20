import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, haversineMetres } from '../../context/AppContext.jsx'
import { MapPin, Zap, Search, Crown, AlertCircle, ParkingMeter, Navigation, LocateFixed, MapPinOff } from 'lucide-react'
import { formatTL } from '../../lib/formatters.js'
import { spotCounts, effectiveCrowdLevel } from '../../lib/parkingStats.js'
import RealMap from '../../components/RealMap.jsx'

const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`)

const CROWD_LABEL = {
  quiet: { label: 'Quiet', cls: 'pill--ok' },
  normal: { label: 'Normal', cls: 'pill--info' },
  busy: { label: 'Busy', cls: 'pill--warn' },
  overflow: { label: 'Overflow', cls: 'pill--bad' },
}

export default function UserMap() {
  const { parkings, hourlyRate, user, tiers, parkByLocation, showToast } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [hoverId, setHoverId] = useState(null)
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locStatus, setLocStatus] = useState('idle')
  const watchRef = useRef(null)

  const beginWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocStatus('unavailable')
      return
    }
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current)
    }
    setLocStatus('locating')
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('granted')
      },
      (err) => {
        setLocStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }, [])

  useEffect(() => {
    beginWatch()
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
  }, [beginWatch])

  const nearest = useMemo(() => {
    if (!userLocation) return null
    let best = null
    let bestDist = Infinity
    for (const p of parkings) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue
      const d = haversineMetres(userLocation.lat, userLocation.lng, p.lat, p.lng)
      if (d < bestDist) {
        bestDist = d
        best = p
      }
    }
    return best ? { parking: best, distance: bestDist } : null
  }, [userLocation, parkings])

  const directionsHref = useMemo(() => {
    if (!nearest) return null
    const d = nearest.parking
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${d.lat},${d.lng}&travelmode=driving`
    }
    return `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`
  }, [nearest, userLocation])

  const handleParkNearest = async () => {
    if (!userLocation) return handleParkHere()
    setLocating(true)
    const res = await parkByLocation({ latitude: userLocation.lat, longitude: userLocation.lng })
    setLocating(false)
    if (res && !res.error && res.parking) {
      navigate(`/app/parking/${res.parking.id}`)
    }
  }

  const handleParkHere = () => {
    if (!('geolocation' in navigator)) {
      showToast('Location is not available on this device.', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const res = await parkByLocation({ latitude, longitude })
        setLocating(false)
        if (res && !res.error && res.parking) {
          navigate(`/app/parking/${res.parking.id}`)
        }
      },
      (err) => {
        setLocating(false)
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable it to park here.'
            : 'Could not read your location. Please try again.'
        showToast(msg, 'error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const sorted = useMemo(
    () =>
      [...parkings]
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.area.toLowerCase().includes(query.toLowerCase()))
        .map((p) => ({
          ...p,
          distanceM: userLocation && typeof p.lat === 'number' && typeof p.lng === 'number'
            ? haversineMetres(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : null,
        }))
        .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity)),
    [parkings, query, userLocation]
  )

  const sub = tiers.find((t) => t.id === user.subscriptionId)
  const activeBookings = user.bookings.filter((b) => b.active)

  return (
    <div className="page page--wide">
      {/* Greeting + active booking strip */}
      <div className="map-page-header row between">
        <div>
          <h1 style={{ marginBottom: 6 }}>Good evening, {user.name.split(' ')[0]}</h1>
          <p className="text-soft">
            {sub ? <>You're on the <b style={{ color: 'var(--green-starbucks)' }}>{sub.name}</b> plan</> : <>Pay-as-you-go at ₺{hourlyRate}/hour</>}
            <span style={{ margin: '0 10px' }}>·</span>
            {sorted.length} garages near {user.vehicle.plate}
          </p>
        </div>
        <button
          className="btn btn--primary btn--lg"
          onClick={handleParkHere}
          disabled={locating}
          title="Use your current location to park instantly"
        >
          {locating ? (
            <><LocateFixed size={16} className="spin" /> Locating…</>
          ) : (
            <><Navigation size={16} /> Park here</>
          )}
        </button>
      </div>

      {activeBookings.length > 0 && (
        <ActiveBookingStrip bookings={activeBookings} />
      )}

      <LocationBanner
        status={locStatus}
        nearest={nearest}
        directionsHref={directionsHref}
        onRetry={beginWatch}
        onPark={handleParkNearest}
        parking={locating}
        onHover={setHoverId}
      />

      <div className="map-grid">
        {/* MAP */}
        <div className="map-grid__map card" style={{ padding: 0, overflow: 'hidden' }}>
          <RealMap
            parkings={parkings}
            highlightId={hoverId || nearest?.parking.id}
            onHover={setHoverId}
            userLocation={userLocation}
            directionsHref={directionsHref}
          />
        </div>

        {/* SIDEBAR */}
        <div className="map-grid__sidebar">
          <div className="card" style={{ padding: 'var(--space-3)' }}>
            <div className="row gap-2" style={{ background: 'var(--neutral-cool)', borderRadius: 'var(--r-pill)', padding: '4px 12px' }}>
              <Search size={16} color="var(--text-black-soft)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search garage or area"
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, padding: '8px 0', fontSize: '1.4rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <h3 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>Nearest to you</h3>
          <p className="text-soft" style={{ fontSize: '1.3rem', marginBottom: 'var(--space-3)' }}>Sorted by distance · live vacancy</p>

          <div className="stack gap-3">
            {sorted.map((p) => {
              const { vacant, total, pct: occPct } = spotCounts(p)
              const pctFree = total ? Math.round((vacant / total) * 100) : 0
              const crowd = CROWD_LABEL[effectiveCrowdLevel(p)]
              const distLabel = p.distanceM != null ? fmtDist(p.distanceM) : '—'
              return (
                <Link
                  to={`/app/parking/${p.id}`}
                  key={p.id}
                  className={`parking-card ${hoverId === p.id ? 'is-hover' : ''}`}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <div className="parking-card__thumb" style={{ background: p.image }}>
                    <ParkingMeter size={28} color="rgba(255,255,255,0.85)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-black)' }}>{p.name}</div>
                      <div className="row gap-1 text-soft" style={{ fontSize: '1.25rem' }}>
                        {occPct}% full
                      </div>
                    </div>
                    <div className="text-soft" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={12} /> {p.area} · {distLabel}
                    </div>
                    <div className="row between" style={{ marginTop: 8 }}>
                      <div className="row gap-2">
                        <span className={`pill ${crowd.cls}`}>{crowd.label}</span>
                        {p.amenities.includes('EV Charging') && (
                          <span className="pill pill--info"><Zap size={12} /> EV</span>
                        )}
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: vacant > 5 ? 'var(--green-starbucks)' : vacant > 0 ? '#8a6d04' : 'var(--red)' }}>
                        {vacant}/{total} free <span className="text-soft" style={{ fontWeight: 400 }}>({pctFree}%)</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {sorted.length === 0 && (
              <div className="card card--flat" style={{ textAlign: 'center', color: 'var(--text-black-soft)' }}>No matches found.</div>
            )}
          </div>
        </div>
      </div>

      <style>{mapCss}</style>
    </div>
  )
}

function LocationBanner({ status, nearest, directionsHref, onRetry, onPark, parking, onHover }) {
  if (status === 'granted' && nearest) {
    const empty = nearest.parking.layout.spots.filter((s) => s.status === 'empty').length
    return (
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div
          className="card"
          style={{ background: 'var(--green-house)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}
          onMouseEnter={() => onHover && onHover(nearest.parking.id)}
          onMouseLeave={() => onHover && onHover(null)}
        >
          <div className="row gap-3">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocateFixed size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: 'var(--text-white-soft)', fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nearest to your live location</div>
              <div style={{ fontWeight: 700, fontSize: '1.6rem' }}>
                {nearest.parking.name} — {fmtDist(nearest.distance)}
              </div>
              <div style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem' }}>{empty} spot{empty === 1 ? '' : 's'} free right now</div>
            </div>
          </div>
          <div className="row gap-2">
            {directionsHref && (
              <a className="btn btn--inverted" href={directionsHref} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Get directions
              </a>
            )}
            <Link to={`/app/parking/${nearest.parking.id}`} className="btn btn--on-dark-outline">View lot</Link>
            <button className="btn btn--on-dark-outline" onClick={onPark} disabled={parking}>
              {parking ? <><LocateFixed size={16} className="spin" /> Parking…</> : <><Navigation size={16} /> Park here</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  let icon = <LocateFixed size={18} color="var(--green-accent)" className={status === 'locating' ? 'spin' : ''} />
  let title = 'Finding your location…'
  let body = 'Allow location access so we can show where you are and the nearest lot.'
  let showRetry = false

  if (status === 'denied') {
    icon = <MapPinOff size={18} color="var(--red)" />
    title = 'Location permission denied'
    body = 'Enable location for this site in your browser, then try again.'
    showRetry = true
  } else if (status === 'unavailable') {
    icon = <MapPinOff size={18} color="var(--red)" />
    title = 'Location is unavailable'
    body = 'This device or browser does not support live location.'
  } else if (status === 'error') {
    icon = <AlertCircle size={18} color="#8a6d04" />
    title = "Couldn't read your location"
    body = 'We lost your GPS signal. Try again to resume live tracking.'
    showRetry = true
  } else if (status === 'idle') {
    return null
  }

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card row between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--neutral-cool)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-black)' }}>{title}</div>
            <div className="text-soft" style={{ fontSize: '1.3rem' }}>{body}</div>
          </div>
        </div>
        {showRetry && (
          <button className="btn btn--primary" onClick={onRetry}>
            <LocateFixed size={16} /> Enable location
          </button>
        )}
      </div>
    </div>
  )
}

function ActiveBookingStrip({ bookings }) {
  const { parkings, cancelBooking } = useApp()
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card" style={{ background: 'var(--green-house)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="row gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>You have {bookings.length} active booking{bookings.length > 1 ? 's' : ''}</div>
            <div style={{ color: 'var(--text-white-soft)', fontSize: '1.3rem' }}>
              {bookings.map((b) => {
                const p = parkings.find((x) => x.id === b.parkingId)
                return `Spot ${b.spotId} at ${p?.name || b.parkingId} for ${b.hours}h`
              }).join(' · ')}
            </div>
          </div>
        </div>
        <div className="row gap-2">
          {bookings.map((b) => (
            <Link key={b.id} to={`/app/parking/${b.parkingId}`} className="btn btn--inverted">View {b.spotId}</Link>
          ))}
          {bookings.length === 1 && (
            <button className="btn btn--on-dark-outline" onClick={() => cancelBooking(bookings[0].id)}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}

const mapCss = `
.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.map-page-header { align-items: flex-end; margin-bottom: var(--space-5); min-width: 0; }
@media (max-width: 640px) {
  .map-page-header { flex-direction: column; align-items: stretch; gap: var(--space-3); }
  .map-page-header .btn { width: 100%; }
  .map-page-header p { font-size: 1.3rem; }
}
.map-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}
@media (min-width: 920px) {
  .map-grid { grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr); }
}
.map-grid__map {
  min-height: 440px;
  height: 68vh;
  position: sticky;
  top: 96px;
}
@media (max-width: 919px) {
  .map-grid__map { height: 360px; position: static; min-height: 360px; }
}
@media (max-width: 640px) {
  .map-grid__map { height: 280px; min-height: 280px; }
  .parking-card__thumb { width: 52px; height: 52px; }
}
.parking-card {
  background: #fff;
  border-radius: var(--r-card);
  padding: var(--space-3);
  display: flex; align-items: stretch; gap: var(--space-3);
  box-shadow: var(--shadow-card);
  transition: var(--transition-fast);
  color: var(--text-black);
}
.parking-card:hover { text-decoration: none; box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
.parking-card.is-hover { box-shadow: 0 0 0 2px var(--green-accent), var(--shadow-card-hover); }
.parking-card__thumb {
  width: 64px; height: 64px;
  border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
`
