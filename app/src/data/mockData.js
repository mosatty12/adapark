// ====== Mock data for the smart-parking system ======
// All prices in TL (Turkish Lira). Operates across North Cyprus (KKTC).

export const HOURLY_RATE_TL = 50

export const SUBSCRIPTION_TIERS = [
  {
    id: 'commuter',
    name: 'Commuter',
    monthly: 499.99,
    annual: 4799.90, // ~20% off
    annualMonthlyEq: 399.99,
    color: 'green-light',
    perks: [
      '60 included parking hours / month',
      'Single-city access (Lefkoşa)',
      'Standard support',
      'Pay-as-you-go after included hours',
    ],
    overageRate: 45,
  },
  {
    id: 'pro',
    name: 'Pro Driver',
    monthly: 899.99,
    annual: 8639.90, // ~20% off
    annualMonthlyEq: 719.99,
    color: 'green-accent',
    popular: true,
    perks: [
      '150 included parking hours / month',
      'All cities, all garages',
      'Priority booking up to 24h ahead',
      'Free first 30-min over time-window',
      'Email + chat support',
    ],
    overageRate: 35,
  },
  {
    id: 'fleet',
    name: 'Fleet',
    monthly: 1599.99,
    annual: 15359.90,
    annualMonthlyEq: 1279.99,
    color: 'green-house',
    perks: [
      'Unlimited included hours, up to 4 vehicles',
      'All cities + reserved corporate spots',
      'Priority booking up to 7 days ahead',
      'Dedicated account manager',
      'Penalty-shield: 2 forgiven / month',
    ],
    overageRate: 25,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    monthly: 2499.99,
    annual: 23999.90,
    annualMonthlyEq: 1999.99,
    color: 'gold',
    perks: [
      'Unlimited hours, up to 8 vehicles',
      'Valet at premium garages',
      'Concierge valet parking',
      '24/7 phone support',
      'Penalty-shield: unlimited',
    ],
    overageRate: 0,
  },
]

export const PENALTY_RULES = [
  { id: 'OVERSTAY',  label: 'Overstay (over booked window)',         baseFee: 75,  perHour: 25 },
  { id: 'WRONG_SPOT', label: 'Parking outside your assigned spot',   baseFee: 150, perHour: 0  },
  { id: 'NO_BOOKING', label: 'Parking without a booking',            baseFee: 200, perHour: 30 },
  { id: 'BLOCKING',   label: 'Blocking access lane / disabled spot', baseFee: 400, perHour: 0  },
  { id: 'EXPIRED_DOC', label: 'Expired vehicle documents (auto-detect)', baseFee: 100, perHour: 0 },
]

// ====== Parkings ======
// Eastern Mediterranean University (EMU) campus, Gazimağusa (Famagusta)
const PARKING_SHAPES = {
  // Each parking has rows of spots; each spot has type (standard/disabled/ev/compact)
  emuElectrical: generateLot(6, 6, [{ row: 0, col: 0, type: 'disabled' }, { row: 0, col: 1, type: 'disabled' }, { row: 1, col: 0, type: 'ev' }, { row: 1, col: 1, type: 'ev' }]),
  // Real lot geometry parsed from the EMU Industrial Eng. simulation world (sim_world.sdf).
  // A U-shaped perimeter lot: stalls along the south, east, and north edges around a
  // central driving aisle, with the entrance on the west side.
  emuIndustrial: buildIndustrialLot(),
}

// Builds the real-shape Industrial Engineering lot from the simulation coordinates.
// Coordinates are in metres, matching sim_world.sdf (x = east, y = north).
function buildIndustrialLot() {
  // [centre-x, centre-y, status]; geometry mirrors the parked cars in the sim.
  // Layout: 7 stalls south, 7 stalls north, 6 stalls east, none on the west (entrance side).
  const south = [
    [-10.3, -10.3, 'filled'], [-7.7, -10.3, 'empty'], [-5.1, -10.3, 'filled'],
    [-2.5, -10.3, 'filled'], [0.1, -10.3, 'empty'], [2.7, -10.3, 'filled'], [5.3, -10.3, 'empty'],
  ]
  const east = [
    [9.1, -6.5, 'filled'], [9.1, -3.9, 'empty'], [9.1, -1.3, 'filled'],
    [9.1, 1.3, 'empty'], [9.1, 3.9, 'filled'], [9.1, 6.5, 'empty'],
  ]
  const north = [
    [-10.3, 10.3, 'filled'], [-7.7, 10.3, 'empty'], [-5.1, 10.3, 'filled'],
    [-2.5, 10.3, 'filled'], [0.1, 10.3, 'empty'], [2.7, 10.3, 'filled'], [5.3, 10.3, 'empty'],
  ]

  const VERTICAL = { w: 2.4, h: 4.8 }    // cars nose in north/south (south + north rows)
  const HORIZONTAL = { w: 4.8, h: 2.4 }  // cars nose in east/west (east column)
  const spots = []

  const push = (prefix, list, dims, rowIdx, special = {}) => {
    list.forEach(([cx, cy, status], i) => {
      const id = `${prefix}${i + 1}`
      spots.push({ id, row: rowIdx, col: i, type: special[i] || 'standard', status, cx, cy, w: dims.w, h: dims.h })
    })
  }

  push('A', south, VERTICAL, 0, { 0: 'disabled', 1: 'ev' })
  push('B', east, HORIZONTAL, 1, { 1: 'ev' })
  push('C', north, VERTICAL, 2, { 0: 'disabled' })

  return {
    shape: 'real',
    rows: 3,
    cols: 7,
    bounds: { minX: -13.6, maxX: 13.6, minY: -12.8, maxY: 12.8 },
    spots,
  }
}

function generateLot(rows, cols, special = []) {
  const spots = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sp = special.find((s) => s.row === r && s.col === c)
      const id = `${String.fromCharCode(65 + r)}${c + 1}`
      // pseudo-random initial occupancy (deterministic so same on every load)
      const seed = (r * 7 + c * 11 + rows + cols) % 10
      let status = 'empty'
      if (seed < 4) status = 'filled'
      else if (seed === 4) status = 'booked'
      spots.push({
        id,
        row: r,
        col: c,
        type: sp?.type || 'standard',
        status,
      })
    }
  }
  return { rows, cols, spots }
}

export const PARKINGS = [
  {
    id: 'emu-electrical',
    name: 'EMU Electrical Engineering Parking',
    area: 'Electrical & Electronic Eng., EMU',
    distanceKm: 0.3,
    rating: 4.5,
    crowdLevel: 'busy',         // quiet | normal | busy | overflow
    suggestedFeeChange: +10,    // % suggestion
    hourlyOverride: 50,
    coords: { x: 40, y: 46 },   // mock map %
    lat: 35.14458,              // EMU Electrical & Electronic Eng. building
    lng: 33.90765,
    image: '#1E3932',
    layout: PARKING_SHAPES.emuElectrical,
    revenueMonthTL: 84_200,
    occupancyPct: 72,
    streetCrowdedness: 0.75,
    address: 'Electrical & Electronic Engineering Dept., EMU, Gazimağusa',
    amenities: ['EV Charging', 'CCTV', 'Covered'],
  },
  {
    id: 'emu-industrial',
    name: 'EMU Industrial Engineering Parking',
    area: 'Industrial Eng., EMU',
    distanceKm: 0.6,
    rating: 4.3,
    crowdLevel: 'normal',
    suggestedFeeChange: 0,
    hourlyOverride: 45,
    coords: { x: 62, y: 56 },
    lat: 35.14534336939159,     // exact location from sim_world.sdf
    lng: 33.90671136518162,
    image: '#006241',
    layout: PARKING_SHAPES.emuIndustrial,
    revenueMonthTL: 61_500,
    occupancyPct: 55,
    streetCrowdedness: 0.5,
    address: 'Industrial Engineering Dept., EMU, Gazimağusa',
    amenities: ['CCTV', 'Open-air'],
  },
]

// ====== Penalty / violation events ======
export const VIOLATIONS = [
  { id: 'V-1041', plate: 'MGS 312', parkingId: 'emu-electrical', spotId: 'B3', type: 'OVERSTAY',   detectedAt: '2026-05-07 11:22', detectedBy: 'CCTV-01', amount: 175, status: 'pending',  evidenceColor: '#c82014' },
  { id: 'V-1042', plate: 'MGS 904', parkingId: 'emu-industrial', spotId: 'A1', type: 'WRONG_SPOT', detectedAt: '2026-05-07 12:09', detectedBy: 'CCTV-02', amount: 150, status: 'pending',  evidenceColor: '#1E3932' },
  { id: 'V-1043', plate: 'GZY 451', parkingId: 'emu-electrical', spotId: 'C2', type: 'NO_BOOKING', detectedAt: '2026-05-07 13:41', detectedBy: 'CCTV-01', amount: 230, status: 'paid',     evidenceColor: '#cba258' },
  { id: 'V-1044', plate: 'LFK 671', parkingId: 'emu-industrial', spotId: 'D5', type: 'BLOCKING',   detectedAt: '2026-05-07 14:02', detectedBy: 'CCTV-02', amount: 400, status: 'pending',  evidenceColor: '#33433d' },
]

// ====== Revenue / stats time series (mock) ======
export const REVENUE_LAST_7 = [
  { day: 'Fri', total: 142_300 },
  { day: 'Sat', total: 188_900 },
  { day: 'Sun', total: 174_500 },
  { day: 'Mon', total: 152_100 },
  { day: 'Tue', total: 162_800 },
  { day: 'Wed', total: 178_400 },
  { day: 'Thu', total: 195_700 },
]

export const HOURLY_OCCUPANCY = [
  4, 3, 2, 2, 3, 8, 22, 48, 71, 78, 82, 84, 80, 76, 74, 78, 86, 92, 88, 70, 54, 38, 22, 12,
]

export const TOP_REVENUE_PARKINGS = ['emu-electrical', 'emu-industrial']

// ====== Default user state ======
export const DEFAULT_USER = {
  name: 'Ayşe Demir',
  email: 'ayse.demir@adapark.kktc',
  phone: '+90 533 555 4421', // North Cyprus mobile prefix is +90 5xx
  vehicle: { plate: 'LFK 504', make: 'Renault Megane', color: 'Slate Gray' },
  subscriptionId: 'commuter', // null => one-time only
  subscriptionRenewal: '2026-06-12',
  walletBalanceTL: 320.5,
  starsRewards: 240,
  bookings: [],   // active or upcoming bookings
  history: [
    { id: 'BK-9881', parkingId: 'emu-electrical', spotId: 'B3', start: '2026-05-04 09:30', end: '2026-05-04 12:00', cost: 125, paid: 'subscription' },
    { id: 'BK-9899', parkingId: 'emu-industrial', spotId: 'D2', start: '2026-05-05 18:10', end: '2026-05-05 22:40', cost: 295, paid: 'one-time' },
  ],
  penalties: [
    { id: 'P-7714', type: 'OVERSTAY',   amount: 100, parkingId: 'emu-electrical', date: '2026-04-22', status: 'paid' },
    { id: 'P-7831', type: 'WRONG_SPOT', amount: 150, parkingId: 'emu-industrial', date: '2026-05-03', status: 'unpaid' },
  ],
}

// ====== Currency formatter ======
export const formatTL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(n)

export const formatTLShort = (n) => {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(1)}k`
  return `₺${n.toFixed(0)}`
}
