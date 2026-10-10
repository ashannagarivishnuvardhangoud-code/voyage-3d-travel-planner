import { initialDemoData, starterDestinations } from '../data.js'

const STORE = 'voyage3d-demo-records'
const TOKEN = 'voyage3d-token'
const USER = 'voyage3d-user'
const isDemo = () => localStorage.getItem(TOKEN) === 'demo-token'
const freshId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const currencyForNotice = (amount, code) => { const unit = /^[A-Z]{3}$/.test(code || '') ? code : 'USD'; return `${unit} ${new Intl.NumberFormat(undefined, { style: 'currency', currency: unit, maximumFractionDigits: 0 }).format(amount)}` }

function localData() {
  try {
    const saved = localStorage.getItem(STORE)
    if (saved) return JSON.parse(saved)
  } catch { /* a corrupted demo cache is replaced with a fresh sample */ }
  const data = initialDemoData()
  localStorage.setItem(STORE, JSON.stringify(data))
  return data
}
function saveLocal(data) { localStorage.setItem(STORE, JSON.stringify(data)); return data }

async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  const url = new URL(`/api${path}`, window.location.origin)
  if (query) Object.entries(query).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))
  const token = localStorage.getItem(TOKEN)
  const response = await fetch(url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth && token && token !== 'demo-token' ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`)
  return data
}

export const api = {
  tokenKey: TOKEN,
  userKey: USER,
  async health() { try { return await request('/health', { auth: false }) } catch { return { ok: false, database: 'unavailable' } } },
  async login(email, password) {
    const data = await request('/auth/login', { method: 'POST', auth: false, body: { email, password } })
    localStorage.setItem(TOKEN, data.token); localStorage.setItem(USER, JSON.stringify(data.user)); return data.user
  },
  async register(name, email, password) {
    const data = await request('/auth/register', { method: 'POST', auth: false, body: { name, email, password } })
    localStorage.setItem(TOKEN, data.token); localStorage.setItem(USER, JSON.stringify(data.user)); return data.user
  },
  enterDemo() {
    localData()
    const user = { id: 'demo-traveler', name: 'Alex Morgan', email: 'alex@voyage.demo', role: 'traveler', demo: true }
    localStorage.setItem(TOKEN, 'demo-token'); localStorage.setItem(USER, JSON.stringify(user)); return user
  },
  signOut() { localStorage.removeItem(TOKEN); localStorage.removeItem(USER) },
  async me() {
    if (isDemo()) return JSON.parse(localStorage.getItem(USER) || 'null')
    const { user } = await request('/auth/me')
    localStorage.setItem(USER, JSON.stringify(user)); return user
  },
  async updateProfile(payload) {
    if (isDemo()) { const user = { ...JSON.parse(localStorage.getItem(USER)), ...payload }; localStorage.setItem(USER, JSON.stringify(user)); return user }
    const { user } = await request('/auth/me', { method: 'PUT', body: payload }); localStorage.setItem(USER, JSON.stringify(user)); return user
  },
  async getDestinations(query = {}) {
    try { return (await request('/destinations', { auth: false, query })).items }
    catch {
      let items = starterDestinations
      const q = (query.search || '').toLowerCase()
      if (q) items = items.filter(x => `${x.name} ${x.country}`.toLowerCase().includes(q))
      if (query.category && query.category !== 'All') items = items.filter(x => x.categories.includes(query.category))
      if (query.sort === 'price-low') items = [...items].sort((a, b) => a.dailyCost - b.dailyCost)
      if (query.sort === 'price-high') items = [...items].sort((a, b) => b.dailyCost - a.dailyCost)
      return items
    }
  },
  async getWorkspace() {
    if (isDemo()) {
      const data = localData()
      return { ...data, notifications: data.notifications || [], destinations: starterDestinations, mode: 'demo' }
    }
    const [trips, expenses, favorites, notifications] = await Promise.all([request('/trips'), request('/expenses'), request('/favorites'), request('/notifications')])
    const packing = [], journal = []
    for (const trip of trips.items) {
      const [p, j] = await Promise.all([request(`/trips/${trip._id}/packing`), request(`/trips/${trip._id}/journal`)]).catch(() => [{ items: [] }, { items: [] }])
      packing.push(...p.items); journal.push(...j.items)
    }
    return { trips: trips.items, activities: trips.items.flatMap(t => t.activities || []), expenses: expenses.items, favorites: favorites.items.map(f => f.destination?._id || f.destination), packing, journal, notifications: notifications.items, destinations: await this.getDestinations(), mode: 'live' }
  },
  async createTrip(payload) {
    if (isDemo()) { const data = localData(); const trip = { ...payload, _id: freshId('trip'), currency: payload.currency || 'USD', status: 'upcoming' }; data.trips.unshift(trip); saveLocal(data); return trip }
    return (await request('/trips', { method: 'POST', body: payload })).trip
  },
  async updateTrip(id, payload) {
    if (isDemo()) { const data = localData(); const index = data.trips.findIndex(x => x._id === id); if (index < 0) throw new Error('Trip not found.'); data.trips[index] = { ...data.trips[index], ...payload }; saveLocal(data); return data.trips[index] }
    return (await request(`/trips/${id}`, { method: 'PUT', body: payload })).trip
  },
  async deleteTrip(id) {
    if (isDemo()) { const data = localData(); data.trips = data.trips.filter(x => x._id !== id); data.activities = data.activities.filter(x => x.trip !== id); data.expenses = data.expenses.map(e => e.trip === id ? { ...e, trip: undefined, tripName: 'Personal expense' } : e); data.packing = data.packing.filter(x => x.trip !== id); data.journal = data.journal.filter(x => x.trip !== id); saveLocal(data); return }
    await request(`/trips/${id}`, { method: 'DELETE' })
  },
  async createExpense(payload) {
    if (isDemo()) { const data = localData(); const trip = data.trips.find(x => x._id === payload.trip); const expense = { ...payload, _id: freshId('expense'), currency: payload.currency || 'USD', tripName: trip?.name }; data.expenses.unshift(expense); if (trip && trip.budget > 0 && expense.currency === trip.currency) { const spend = data.expenses.filter(x => x.trip === trip._id && x.currency === trip.currency).reduce((s, x) => s + Number(x.amount || 0), 0); const type = spend >= trip.budget ? 'budget-overspend' : spend >= trip.budget * .8 ? 'budget-warning' : null; if (type && !data.notifications.some(n => n.trip === trip._id && n.type === type)) data.notifications.unshift({ _id: freshId('notice'), trip: trip._id, type, title: type === 'budget-overspend' ? 'Trip budget reached' : 'Budget check-in', body: `${trip.name}: ${currencyForNotice(spend, trip.currency)} spent of ${currencyForNotice(trip.budget, trip.currency)}.`, createdAt: new Date().toISOString(), readAt: null }) } saveLocal(data); return expense }
    return (await request('/expenses', { method: 'POST', body: payload })).expense
  },
  async updateExpense(id, payload) {
    if (isDemo()) { const data = localData(); const index = data.expenses.findIndex(x => x._id === id); if (index < 0) throw new Error('Expense not found.'); data.expenses[index] = { ...data.expenses[index], ...payload }; saveLocal(data); return data.expenses[index] }
    return (await request(`/expenses/${id}`, { method: 'PUT', body: payload })).expense
  },
  async deleteExpense(id) {
    if (isDemo()) { const data = localData(); data.expenses = data.expenses.filter(x => x._id !== id); saveLocal(data); return }
    await request(`/expenses/${id}`, { method: 'DELETE' })
  },
  async createActivity(tripId, payload) {
    if (isDemo()) { const data = localData(); const activity = { ...payload, _id: freshId('activity'), trip: tripId }; data.activities.push(activity); saveLocal(data); return activity }
    return (await request(`/trips/${tripId}/activities`, { method: 'POST', body: payload })).activity
  },
  async updateActivity(id, payload) {
    if (isDemo()) { const data = localData(); const index = data.activities.findIndex(x => x._id === id); if (index < 0) throw new Error('Activity not found.'); data.activities[index] = { ...data.activities[index], ...payload }; saveLocal(data); return data.activities[index] }
    return (await request(`/activities/${id}`, { method: 'PUT', body: payload })).activity
  },
  async reorderActivities(tripId, activityIds) {
    if (isDemo()) { const data = localData(); activityIds.forEach((id, order) => { const item = data.activities.find(x => x._id === id); if (item) item.order = order }); saveLocal(data); return }
    return request(`/trips/${tripId}/activities/reorder`, { method: 'PUT', body: { activityIds } })
  },
  async deleteActivity(id) {
    if (isDemo()) { const data = localData(); data.activities = data.activities.filter(x => x._id !== id); saveLocal(data); return }
    await request(`/activities/${id}`, { method: 'DELETE' })
  },
  async toggleFavorite(destinationId) {
    if (isDemo()) { const data = localData(); const exists = data.favorites.includes(destinationId); data.favorites = exists ? data.favorites.filter(x => x !== destinationId) : [...data.favorites, destinationId]; saveLocal(data); return !exists }
    const favorites = (await request('/favorites')).items
    const existing = favorites.find(x => (x.destination?._id || x.destination) === destinationId)
    if (existing) { await request(`/favorites/${existing._id}`, { method: 'DELETE' }); return false }
    await request('/favorites', { method: 'POST', body: { destination: destinationId } }); return true
  },
  async addPacking(tripId, payload) {
    if (isDemo()) { const data = localData(); const item = { ...payload, _id: freshId('packing'), trip: tripId, packed: false }; data.packing.push(item); saveLocal(data); return item }
    return (await request(`/trips/${tripId}/packing`, { method: 'POST', body: payload })).item
  },
  async updatePacking(id, payload) {
    if (isDemo()) { const data = localData(); const item = data.packing.find(x => x._id === id); if (!item) throw new Error('Packing item not found.'); Object.assign(item, payload); saveLocal(data); return item }
    return (await request(`/packing/${id}`, { method: 'PUT', body: payload })).item
  },
  async deletePacking(id) {
    if (isDemo()) { const data = localData(); data.packing = data.packing.filter(x => x._id !== id); saveLocal(data); return }
    await request(`/packing/${id}`, { method: 'DELETE' })
  },
  async addJournal(tripId, payload) {
    if (isDemo()) { const data = localData(); const entry = { ...payload, _id: freshId('journal'), trip: tripId }; data.journal.unshift(entry); saveLocal(data); return entry }
    return (await request(`/trips/${tripId}/journal`, { method: 'POST', body: payload })).entry
  },
  async updateJournal(id, payload) {
    if (isDemo()) { const data = localData(); const entry = data.journal.find(x => x._id === id); if (!entry) throw new Error('Journal entry not found.'); Object.assign(entry, payload); saveLocal(data); return entry }
    return (await request(`/journal/${id}`, { method: 'PUT', body: payload })).entry
  },
  async deleteJournal(id) {
    if (isDemo()) { const data = localData(); data.journal = data.journal.filter(x => x._id !== id); saveLocal(data); return }
    await request(`/journal/${id}`, { method: 'DELETE' })
  },
  async shareTrip(id) {
    if (isDemo()) return { id: freshId('share'), token: 'demo', url: `${window.location.origin}/shared/demo?trip=${encodeURIComponent(id)}` }
    const share = (await request(`/trips/${id}/share`, { method: 'POST', body: {} })).share
    return { ...share, url: `${window.location.origin}/shared/${share.token}` }
  },
  async markNotificationRead(id) {
    if (isDemo()) { const data = localData(); const item = data.notifications.find(x => x._id === id); if (item) item.readAt = new Date().toISOString(); saveLocal(data); return item }
    return (await request(`/notifications/${id}/read`, { method: 'PUT', body: {} })).item
  },
  async adminOverview() { return request('/admin/overview') },
  async createDestination(payload) { return (await request('/destinations', { method: 'POST', body: payload })).destination },
  async updateDestination(id, payload) { return (await request(`/destinations/${id}`, { method: 'PUT', body: payload })).destination },
  async deleteDestination(id) { return request(`/destinations/${id}`, { method: 'DELETE' }) },
}
