// Static parking lot definitions for EMU campus garages.
// Spot occupancy is synced live from Supabase spot_status.

export const HOURLY_RATE_TL = 50

export const SUBSCRIPTION_TIERS = [
  {
    id: 'commuter',
    name: 'Commuter',
    monthly: 499.99,
    annual: 4799.90,
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
    annual: 8639.90,
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
  { id: 'OVERSTAY', label: 'Overstay (over booked window)', baseFee: 75, perHour: 25 },
  { id: 'WRONG_SPOT', label: 'Parking outside your assigned spot', baseFee: 150, perHour: 0 },
  { id: 'NO_BOOKING', label: 'Parking without a booking', baseFee: 200, perHour: 30 },
  { id: 'BLOCKING', label: 'Blocking access lane / disabled spot', baseFee: 400, perHour: 0 },
  { id: 'EXPIRED_DOC', label: 'Expired vehicle documents (auto-detect)', baseFee: 100, perHour: 0 },
]

const PARKING_SHAPES = {
  emuElectrical: generateLot(6, 6, [
    { row: 0, col: 0, type: 'disabled' },
    { row: 0, col: 1, type: 'disabled' },
    { row: 1, col: 0, type: 'ev' },
    { row: 1, col: 1, type: 'ev' },
  ]),
  emuIndustrial: buildIndustrialLot(),
  emuComputer: generateLot(6, 6),
  emuArtsScience: generateLot(6, 6),
}

function buildIndustrialLot() {
  const south = [
    [-10.3, -10.3], [-7.7, -10.3], [-5.1, -10.3],
    [-2.5, -10.3], [0.1, -10.3], [2.7, -10.3], [5.3, -10.3],
  ]
  const east = [
    [11.0, -6.5], [11.0, -3.9], [11.0, -1.3],
    [11.0, 1.3], [11.0, 3.9], [11.0, 6.5],
  ]
  // Centre island — 5 extra stalls (Google Maps satellite), added without moving perimeter spots
  const middle = [
    [-5.2, 0], [-2.6, 0], [0, 0], [2.6, 0], [5.2, 0],
  ]
  const north = [
    [-10.3, 10.3], [-7.7, 10.3], [-5.1, 10.3],
    [-2.5, 10.3], [0.1, 10.3], [2.7, 10.3], [5.3, 10.3],
  ]

  const VERTICAL = { w: 2.4, h: 4.8 }
  const HORIZONTAL = { w: 4.8, h: 2.4 }
  const spots = []

  const push = (prefix, list, dims, rowIdx, special = {}) => {
    list.forEach(([cx, cy], i) => {
      const id = `${prefix}${i + 1}`
      spots.push({
        id,
        row: rowIdx,
        col: i,
        type: special[i] || 'standard',
        status: 'empty',
        cx,
        cy,
        w: dims.w,
        h: dims.h,
      })
    })
  }

  push('A', south, VERTICAL, 0)
  push('B', east, HORIZONTAL, 1)
  push('M', middle, VERTICAL, 1)
  push('C', north, VERTICAL, 2, { 6: 'disabled' })

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
      spots.push({
        id,
        row: r,
        col: c,
        type: sp?.type || 'standard',
        status: 'empty',
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
    hourlyOverride: 50,
    coords: { x: 40, y: 46 },
    lat: 35.14458,
    lng: 33.90765,
    image: '#1E3932',
    layout: PARKING_SHAPES.emuElectrical,
    crowdLevel: 'normal',
    suggestedFeeChange: 0,
    address: 'Electrical & Electronic Engineering Dept., EMU, Gazimağusa',
    amenities: ['EV Charging', 'Covered'],
  },
  {
    id: 'emu-industrial',
    name: 'EMU Industrial Engineering Parking',
    area: 'Industrial Eng., EMU',
    hourlyOverride: 45,
    coords: { x: 62, y: 56 },
    lat: 35.14534336939159,
    lng: 33.90671136518162,
    image: '#006241',
    layout: PARKING_SHAPES.emuIndustrial,
    crowdLevel: 'normal',
    suggestedFeeChange: 0,
    address: 'Industrial Engineering Dept., EMU, Gazimağusa',
    amenities: ['Open-air'],
  },
  {
    id: 'emu-computer',
    name: 'EMU Computer Engineering Parking',
    area: 'Computer Eng., EMU',
    hourlyOverride: 50,
    coords: { x: 52, y: 40 },
    lat: 35.1456265,
    lng: 33.9087053,
    image: '#2D4A3E',
    layout: PARKING_SHAPES.emuComputer,
    crowdLevel: 'normal',
    suggestedFeeChange: 0,
    address: 'Computer Engineering Dept., Albert Einstein St., EMU, Gazimağusa',
    amenities: ['EV Charging', 'Covered'],
  },
  {
    id: 'emu-arts-science',
    name: 'EMU Arts and Sciences Parking',
    area: 'Arts & Sciences, EMU',
    hourlyOverride: 45,
    coords: { x: 35, y: 52 },
    lat: 35.1438308,
    lng: 33.9106462,
    image: '#3E5C4A',
    layout: PARKING_SHAPES.emuArtsScience,
    crowdLevel: 'normal',
    suggestedFeeChange: 0,
    address: 'Faculty of Arts & Sciences, Aristóteles St., EMU, Gazimağusa',
    amenities: ['Open-air'],
  },
]
