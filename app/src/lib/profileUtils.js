export function isPlateMissing(userOrProfile) {
  const plate =
    userOrProfile?.vehicle?.plate ??
    userOrProfile?.plate ??
    ''
  return !String(plate).trim()
}

export function emptyUser() {
  return {
    name: '',
    email: '',
    phone: '',
    vehicle: { plate: '', make: '', color: '' },
    subscriptionId: null,
    subscriptionRenewal: null,
    subscriptionBilling: 'monthly',
    walletBalanceTL: 0,
    starsRewards: 0,
    bookings: [],
    history: [],
    penalties: [],
    transactions: [],
  }
}

export function profileToUser(profile) {
  return {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    vehicle: {
      plate: profile.plate || '',
      make: profile.vehicle_make || '',
      color: profile.vehicle_color || '',
    },
    subscriptionId: profile.subscription_id || null,
    subscriptionRenewal: profile.subscription_renewal || null,
    subscriptionBilling: profile.subscription_billing || 'monthly',
    walletBalanceTL: Number(profile.wallet_balance) || 0,
    starsRewards: profile.stars_rewards || 0,
    bookings: [],
    history: [],
    penalties: [],
    transactions: [],
  }
}

export function userToProfilePatch(user) {
  const plate = user.vehicle?.plate?.trim().toUpperCase()
  return {
    name: user.name,
    phone: user.phone,
    plate: plate || null,
    vehicle_make: user.vehicle?.make?.trim() || null,
    vehicle_color: user.vehicle?.color?.trim() || null,
  }
}

export function bookingFromRow(row) {
  return {
    id: row.id,
    parkingId: row.parking_id,
    spotId: row.spot_id,
    hours: Number(row.hours) || 0,
    cost: Number(row.cost) || 0,
    paymentMethod: row.payment_method,
    paid: row.payment_method,
    start: row.starts_at,
    end: row.ends_at,
    active: row.active,
    cancelled: row.cancelled,
  }
}

export function penaltyFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount) || 0,
    parkingId: row.parking_id,
    date: row.date,
    status: row.status,
    paidVia: row.paid_via || null,
  }
}

export function transactionFromRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    delta: Number(row.delta) || 0,
    date: (row.created_at || '').slice(0, 10),
  }
}

export function adminViolationFromRow(row) {
  return {
    id: row.id,
    plate: row.profiles?.plate || row.plate || '—',
    parkingId: row.parking_id,
    spotId: null,
    type: row.type,
    detectedAt: (row.created_at || row.date || '').slice(0, 16).replace('T', ' '),
    amount: Number(row.amount) || 0,
    status: row.status,
    userId: row.user_id,
    vehicleId: row.vehicle_id || null,
  }
}
