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
  return {
    name: user.name,
    phone: user.phone,
    plate: user.vehicle?.plate || null,
    vehicle_make: user.vehicle?.make || null,
    vehicle_color: user.vehicle?.color || null,
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
