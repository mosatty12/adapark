const METRES_PER_DEG_LAT = 111320

function cosLat(lat) {
  return Math.cos((lat * Math.PI) / 180)
}

function rotateForward(cx, cy, headingDeg) {
  if (!headingDeg) return { x: cx, y: cy }
  const rad = (headingDeg * Math.PI) / 180
  return {
    x: cx * Math.cos(rad) - cy * Math.sin(rad),
    y: cx * Math.sin(rad) + cy * Math.cos(rad),
  }
}

function rotateInverse(x, y, headingDeg) {
  if (!headingDeg) return { x, y }
  const rad = (-headingDeg * Math.PI) / 180
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  }
}

/** Virtual spot centre (cx east, cy north in metres) → real lat/lng. */
export function spotToLatLng(parking, spot) {
  if (typeof parking?.lat !== 'number' || typeof parking?.lng !== 'number') return null
  if (typeof spot?.cx !== 'number' || typeof spot?.cy !== 'number') return null

  const heading = parking.heading ?? 0
  const { x, y } = rotateForward(spot.cx, spot.cy, heading)
  return {
    lat: parking.lat + y / METRES_PER_DEG_LAT,
    lng: parking.lng + x / (METRES_PER_DEG_LAT * cosLat(parking.lat)),
  }
}

/** Real lat/lng → local metres (x east, y north) from the lot anchor. */
export function latLngToLocal(parking, lat, lng) {
  const dLat = lat - parking.lat
  const dLng = lng - parking.lng
  const x = dLng * METRES_PER_DEG_LAT * cosLat(parking.lat)
  const y = dLat * METRES_PER_DEG_LAT
  return rotateInverse(x, y, parking.heading ?? 0)
}

function spotDistanceMetres(parking, spot, lat, lng) {
  const local = latLngToLocal(parking, lat, lng)
  const dx = spot.cx - local.x
  const dy = spot.cy - local.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Closest spot in a real lot, regardless of status. */
export function nearestSpot(parking, lat, lng) {
  if (parking?.layout?.shape !== 'real') return null
  const spots = (parking.layout.spots || []).filter(
    (s) => typeof s.cx === 'number' && typeof s.cy === 'number'
  )
  if (spots.length === 0) return null

  let best = null
  let bestDist = Infinity
  for (const spot of spots) {
    const d = spotDistanceMetres(parking, spot, lat, lng)
    if (d < bestDist) {
      bestDist = d
      best = spot
    }
  }
  return best ? { spot: best, distanceMetres: bestDist } : null
}

/** Closest empty spot in a real lot. */
export function nearestEmptySpot(parking, lat, lng) {
  if (parking?.layout?.shape !== 'real') return null
  const empty = (parking.layout.spots || []).filter(
    (s) => s.status === 'empty' && typeof s.cx === 'number' && typeof s.cy === 'number'
  )
  if (empty.length === 0) return null

  let best = null
  let bestDist = Infinity
  for (const spot of empty) {
    const d = spotDistanceMetres(parking, spot, lat, lng)
    if (d < bestDist) {
      bestDist = d
      best = spot
    }
  }
  return best ? { spot: best, distanceMetres: bestDist } : null
}

export function isWithinLotBounds(parking, lat, lng, padMetres = 4) {
  if (parking?.layout?.shape !== 'real' || !parking.layout.bounds) return true
  const { x, y } = latLngToLocal(parking, lat, lng)
  const b = parking.layout.bounds
  return (
    x >= b.minX - padMetres &&
    x <= b.maxX + padMetres &&
    y >= b.minY - padMetres &&
    y <= b.maxY + padMetres
  )
}
