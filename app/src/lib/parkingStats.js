export function spotCounts(parking) {
  const spots = parking?.layout?.spots || []
  const total = spots.length
  const occupied = spots.filter((s) => s.status !== 'empty').length
  const pct = total ? Math.round((occupied / total) * 100) : 0
  return { total, occupied, vacant: total - occupied, pct }
}

export function crowdLevelFromPct(pct) {
  if (pct >= 90) return 'overflow'
  if (pct >= 70) return 'busy'
  if (pct >= 40) return 'normal'
  return 'quiet'
}

export function effectiveCrowdLevel(parking) {
  return parking.crowdLevel || crowdLevelFromPct(spotCounts(parking).pct)
}
