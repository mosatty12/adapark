import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  PARKINGS as INITIAL_PARKINGS,
  VIOLATIONS as INITIAL_VIOLATIONS,
  HOURLY_RATE_TL,
  SUBSCRIPTION_TIERS,
  PENALTY_RULES,
  formatTL,
} from '../data/mockData.js'
import { supabase } from '../supabase.js'
import {
  emptyUser,
  profileToUser,
  userToProfilePatch,
  bookingFromRow,
  penaltyFromRow,
  transactionFromRow,
} from '../lib/profileUtils.js'
import {
  isWithinLotBounds,
  nearestEmptySpot,
  nearestSpot,
} from '../lib/geoUtils.js'

const AppContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function nextRenewalDate() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function applySpotRows(parkings, rows) {
  if (!rows?.length) return parkings
  const statusByKey = new Map(rows.map((r) => [`${r.parking_id}:${r.spot_id}`, r.status]))
  return parkings.map((p) => ({
    ...p,
    layout: {
      ...p.layout,
      spots: p.layout.spots.map((s) => {
        const next = statusByKey.get(`${p.id}:${s.id}`)
        return next ? { ...s, status: next } : s
      }),
    },
  }))
}

async function fetchSpotStatuses() {
  const { data, error } = await supabase.from('spot_status').select('parking_id, spot_id, status')
  if (error) throw error
  return data || []
}

export function AppProvider({ children }) {
  const [auth, setAuth] = useState(null) // { role, name, userId, email }
  const [authLoading, setAuthLoading] = useState(true)

  const [parkings, setParkings] = useState(INITIAL_PARKINGS)
  const [violations, setViolations] = useState(INITIAL_VIOLATIONS)
  const [user, setUser] = useState(emptyUser)
  const [hourlyRate, setHourlyRate] = useState(HOURLY_RATE_TL)
  const [tiers, setTiers] = useState(SUBSCRIPTION_TIERS)
  const [penaltyRules, setPenaltyRules] = useState(PENALTY_RULES)

  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type, id: Date.now() })
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3000)
  }

  const loadUserData = async (userId) => {
    const [bookingsRes, penaltiesRes, txnsRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('penalties').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

    const allBookings = (bookingsRes.data || []).map(bookingFromRow)
    const penalties = (penaltiesRes.data || []).map(penaltyFromRow)
    const transactions = (txnsRes.data || []).map(transactionFromRow)

    setUser((u) => ({
      ...u,
      bookings: allBookings.filter((b) => b.active && !b.cancelled),
      history: allBookings.filter((b) => !b.active || b.cancelled),
      penalties,
      transactions,
    }))
  }

  const applyProfile = async (profile) => {
    setAuth({
      role: profile.role,
      name: profile.name,
      userId: profile.id,
      email: profile.email,
    })
    if (profile.role === 'user') {
      setUser(profileToUser(profile))
      await loadUserData(profile.id)
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id)
          await applyProfile(profile)
        } catch {
          showToast('Could not load profile. Run supabase/profiles.sql in Supabase.', 'error')
        }
      }
      if (mounted) setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuth(null)
        setUser(emptyUser())
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let timer

    const refreshSpots = async () => {
      try {
        const rows = await fetchSpotStatuses()
        if (mounted) setParkings((prev) => applySpotRows(prev, rows))
      } catch {
        // Table may not exist yet — run app/supabase/parking_spots.sql
      }
    }

    refreshSpots()
    timer = window.setInterval(refreshSpots, 5000)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  const signIn = async (email, password, expectedRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    let profile
    try {
      profile = await fetchProfile(data.user.id)
    } catch {
      await supabase.auth.signOut()
      return { error: 'Profile not found. Run app/supabase/profiles.sql in your Supabase SQL Editor.' }
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut()
      return { error: 'Your account has been suspended.' }
    }

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut()
      const actual = profile.role === 'admin' ? 'admin' : 'driver'
      const expected = expectedRole === 'admin' ? 'admin' : 'driver'
      return { error: `This account is registered as a ${actual}, not a ${expected}.` }
    }

    await applyProfile(profile)
    return { error: null, role: profile.role }
  }

  const signUp = async (email, password, name, plate = '') => {
    const cleanPlate = plate.trim().toUpperCase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'user', plate: cleanPlate } },
    })
    if (error) return { error: error.message }

    if (!data.session) {
      return { error: null, needsConfirmation: true }
    }

    // Persist the plate on the freshly-created profile row.
    if (cleanPlate) {
      await supabase.from('profiles').update({ plate: cleanPlate }).eq('id', data.user.id)
    }

    try {
      const profile = await fetchProfile(data.user.id)
      await applyProfile(profile)
      return { error: null, needsConfirmation: false, role: 'user' }
    } catch {
      return {
        error: null,
        needsConfirmation: true,
        message: 'Account created. Confirm your email, then sign in.',
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuth(null)
    setUser(emptyUser())
  }

  const saveUserProfile = async () => {
    if (!auth?.userId) return { error: 'Not signed in' }

    const { error } = await supabase
      .from('profiles')
      .update(userToProfilePatch(user))
      .eq('id', auth.userId)

    if (error) return { error: error.message }

    setAuth((prev) => (prev ? { ...prev, name: user.name } : prev))
    return { error: null }
  }

  const updateParking = (id, patch) => {
    setParkings((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const updateSpot = (parkingId, spotId, patch) => {
    setParkings((prev) =>
      prev.map((p) => {
        if (p.id !== parkingId) return p
        return {
          ...p,
          layout: {
            ...p.layout,
            spots: p.layout.spots.map((s) => (s.id === spotId ? { ...s, ...patch } : s)),
          },
        }
      })
    )

    if (patch.status) {
      supabase
        .from('spot_status')
        .upsert(
          {
            parking_id: parkingId,
            spot_id: spotId,
            status: patch.status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'parking_id,spot_id' }
        )
        .then(({ error }) => {
          if (error) console.error('spot_status upsert:', error.message)
        })
    }
  }

  const requireUser = () => {
    if (!auth?.userId) {
      showToast('Please sign in again.', 'error')
      return null
    }
    return auth.userId
  }

  const bookSpot = async (parkingId, spotId, hours, paymentMethod) => {
    const userId = requireUser()
    if (!userId) return null
    const parking = parkings.find((p) => p.id === parkingId)
    if (!parking) return null

    const cost =
      paymentMethod === 'subscription'
        ? 0
        : Math.max(1, hours) * (parking.hourlyOverride ?? hourlyRate)
    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + hours * 60 * 60 * 1000)
    const bookingId = 'BK-' + Math.floor(10000 + Math.random() * 90000)
    const booking = {
      id: bookingId,
      parkingId,
      spotId,
      hours,
      cost,
      paymentMethod,
      paid: paymentMethod,
      start: startsAt.toISOString(),
      end: endsAt.toISOString(),
      active: true,
      cancelled: false,
    }

    updateSpot(parkingId, spotId, { status: 'mine' })
    setUser((u) => ({ ...u, bookings: [...u.bookings, booking] }))

    const { error } = await supabase.from('bookings').insert({
      id: bookingId,
      user_id: userId,
      parking_id: parkingId,
      spot_id: spotId,
      hours,
      cost,
      payment_method: paymentMethod,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      active: true,
    })

    if (error) {
      updateSpot(parkingId, spotId, { status: 'empty' })
      setUser((u) => ({ ...u, bookings: u.bookings.filter((x) => x.id !== bookingId) }))
      showToast(error.message, 'error')
      return null
    }

    if (cost > 0) {
      const stars = Math.floor(cost / 10)
      await applyWalletChange(userId, {
        balanceDelta: paymentMethod === 'wallet' ? -cost : 0,
        starsDelta: stars,
        txn: { kind: 'park', label: `Booking ${bookingId} · ${parking.name}`, delta: -cost },
      })
    }

    showToast(`Spot ${spotId} reserved successfully`, 'success')
    return booking
  }

  const parkByLocation = async ({ latitude, longitude }) => {
    const userId = requireUser()
    if (!userId) return { error: 'Please sign in again.' }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const msg = 'Could not read your location.'
      showToast(msg, 'error')
      return { error: msg }
    }

    let nearest = null
    let nearestDist = Infinity
    for (const p of parkings) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue
      const d = haversineMetres(latitude, longitude, p.lat, p.lng)
      if (d < nearestDist) {
        nearestDist = d
        nearest = p
      }
    }

    const THRESHOLD_METRES = 200
    if (!nearest || nearestDist > THRESHOLD_METRES) {
      const msg = 'You are not at any known parking lot.'
      showToast(msg, 'error')
      return { error: msg }
    }

    if (nearest.layout.shape === 'real' && !isWithinLotBounds(nearest, latitude, longitude)) {
      const msg = 'You are near this lot but not inside a parking stall.'
      showToast(msg, 'error')
      return { error: msg }
    }

    const emptySpots = nearest.layout.spots.filter((s) => s.status === 'empty')
    if (emptySpots.length === 0) {
      const msg = 'This lot is full.'
      showToast(msg, 'error')
      return { error: msg }
    }

    let spot = emptySpots[0]
    const matched = nearest.layout.shape === 'real' ? nearestSpot(nearest, latitude, longitude) : null

    if (matched?.spot) {
      if (matched.spot.status === 'empty') {
        spot = matched.spot
      } else {
        const fallback = nearestEmptySpot(nearest, latitude, longitude)
        if (fallback?.spot) {
          showToast(
            `Spot ${matched.spot.id} looks taken — booked ${fallback.spot.id} instead.`,
            'info'
          )
          spot = fallback.spot
        } else {
          const msg = 'This lot is full.'
          showToast(msg, 'error')
          return { error: msg }
        }
      }
    } else if (nearest.layout.shape === 'real') {
      const fallback = nearestEmptySpot(nearest, latitude, longitude)
      if (fallback?.spot) spot = fallback.spot
    }

    const paymentMethod = user.subscriptionId ? 'subscription' : 'wallet'
    const booking = await bookSpot(nearest.id, spot.id, 2, paymentMethod)
    if (!booking) {
      return { error: 'Could not complete your booking.' }
    }

    showToast(`Parked at ${nearest.name}, spot ${spot.id}`, 'success')
    return { error: null, parking: nearest, spot, booking }
  }

  const cancelBooking = async (bookingId) => {
    const b = user.bookings.find((x) => x.id === bookingId)
    if (!b) return
    updateSpot(b.parkingId, b.spotId, { status: 'empty' })
    setUser((u) => ({
      ...u,
      bookings: u.bookings.filter((x) => x.id !== bookingId),
      history: [{ ...b, active: false, end: new Date().toISOString(), cancelled: true }, ...u.history],
    }))

    const { error } = await supabase
      .from('bookings')
      .update({ active: false, cancelled: true, ends_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Booking cancelled', 'info')
  }

  // Updates profiles wallet/stars and (optionally) records a transaction, locally + in DB.
  const applyWalletChange = async (userId, { balanceDelta = 0, starsDelta = 0, txn = null }) => {
    let nextBalance
    let nextStars
    setUser((u) => {
      nextBalance = +(u.walletBalanceTL + balanceDelta).toFixed(2)
      nextStars = u.starsRewards + starsDelta
      return {
        ...u,
        walletBalanceTL: nextBalance,
        starsRewards: nextStars,
        transactions: txn
          ? [{ id: 'tmp-' + Date.now(), date: new Date().toISOString().slice(0, 10), ...txn }, ...(u.transactions || [])]
          : u.transactions,
      }
    })

    if (balanceDelta !== 0 || starsDelta !== 0) {
      await supabase
        .from('profiles')
        .update({ wallet_balance: nextBalance, stars_rewards: nextStars })
        .eq('id', userId)
    }
    if (txn) {
      await supabase.from('transactions').insert({ user_id: userId, ...txn })
    }
  }

  const topUp = async (amount) => {
    const userId = requireUser()
    if (!userId || !amount || amount <= 0) return
    await applyWalletChange(userId, {
      balanceDelta: amount,
      txn: { kind: 'topup', label: `Top-up · ${formatTL(amount)}`, delta: amount },
    })
    showToast(`Added ${formatTL(amount)} to wallet`, 'success')
  }

  const subscribe = async (tierId, billing = 'monthly') => {
    const userId = requireUser()
    if (!userId) return
    const renewal = nextRenewalDate()
    setUser((u) => ({ ...u, subscriptionId: tierId, subscriptionBilling: billing, subscriptionRenewal: renewal }))

    const { error } = await supabase
      .from('profiles')
      .update({ subscription_id: tierId, subscription_billing: billing, subscription_renewal: renewal })
      .eq('id', userId)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    const t = tiers.find((x) => x.id === tierId)
    showToast(`Subscribed to ${t?.name} (${billing})`, 'success')
  }

  const cancelSubscription = async () => {
    const userId = requireUser()
    if (!userId) return
    setUser((u) => ({ ...u, subscriptionId: null }))

    const { error } = await supabase
      .from('profiles')
      .update({ subscription_id: null, subscription_renewal: null })
      .eq('id', userId)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Subscription cancelled', 'info')
  }

  const payPenalty = async (penaltyId, source = 'wallet') => {
    const userId = requireUser()
    if (!userId) return
    const penalty = user.penalties.find((p) => p.id === penaltyId)
    setUser((u) => ({
      ...u,
      penalties: u.penalties.map((p) =>
        p.id === penaltyId ? { ...p, status: 'paid', paidVia: source } : p
      ),
    }))

    const { error } = await supabase
      .from('penalties')
      .update({ status: 'paid', paid_via: source })
      .eq('id', penaltyId)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    if (source === 'wallet' && penalty) {
      await applyWalletChange(userId, {
        balanceDelta: -penalty.amount,
        txn: { kind: 'penalty', label: `Penalty ${penalty.id}`, delta: -penalty.amount },
      })
    }
    showToast('Penalty paid', 'success')
  }

  const disputePenalty = async (penaltyId) => {
    const userId = requireUser()
    if (!userId) return
    setUser((u) => ({
      ...u,
      penalties: u.penalties.map((p) =>
        p.id === penaltyId ? { ...p, status: 'disputed' } : p
      ),
    }))

    const { error } = await supabase
      .from('penalties')
      .update({ status: 'disputed' })
      .eq('id', penaltyId)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Dispute submitted for review', 'info')
  }

  const issueViolation = (v) => {
    const id = 'V-' + Math.floor(1000 + Math.random() * 9000)
    setViolations((prev) => [{ id, status: 'pending', detectedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), ...v }, ...prev])
    showToast(`Violation ${id} issued`, 'success')
  }
  const updateViolation = (id, patch) => {
    setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  const updateTier = (id, patch) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const updatePenaltyRule = (id, patch) => {
    setPenaltyRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const value = useMemo(
    () => ({
      auth, authLoading, signIn, signUp, signOut, saveUserProfile,
      parkings, setParkings, updateParking, updateSpot,
      violations, setViolations, issueViolation, updateViolation,
      user, setUser,
      hourlyRate, setHourlyRate,
      tiers, setTiers, updateTier,
      penaltyRules, setPenaltyRules, updatePenaltyRule,
      bookSpot, cancelBooking, parkByLocation,
      subscribe, cancelSubscription,
      payPenalty, disputePenalty,
      topUp,
      toast, showToast,
    }),
    [auth, authLoading, parkings, violations, user, hourlyRate, tiers, penaltyRules, toast]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
