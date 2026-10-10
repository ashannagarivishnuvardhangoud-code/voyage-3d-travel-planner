import { Router } from 'express'
import { z } from 'zod'
import { Activity, Expense, JournalEntry, PackingItem, SharedTrip, Trip } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { objectId, validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)
const tripFields = { name: z.string().trim().min(2).max(100), destination: z.string().optional(), destinationName: z.string().trim().min(2), country: z.string().optional(), imageUrl: z.string().url().or(z.literal('')).optional(), startDate: z.coerce.date(), endDate: z.coerce.date(), travelers: z.coerce.number().int().min(1).max(30).default(1), budget: z.coerce.number().min(0).default(0), currency: z.string().length(3).default('USD'), description: z.string().max(2000).optional(), preferences: z.array(z.string()).optional() }
const tripInput = z.object(tripFields).refine(v => v.endDate >= v.startDate, { message: 'End date must be after start date.', path: ['endDate'] })
const tripUpdateInput = z.object(tripFields).partial().refine(v => !v.startDate || !v.endDate || v.endDate >= v.startDate, { message: 'End date must be after start date.', path: ['endDate'] })
const idParams = z.object({ params: z.object({ id: objectId }) })
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50))
  const [items, total] = await Promise.all([Trip.find({ user: req.user.id }).sort({ startDate: -1 }).skip((page - 1) * limit).limit(limit).populate('destination', 'name country imageUrl'), Trip.countDocuments({ user: req.user.id })])
  const tripIds = items.map(x => x._id)
  const activities = await Activity.find({ user: req.user.id, trip: { $in: tripIds } }).sort({ date: 1, startTime: 1 })
  res.json({ items: items.map(t => ({ ...t.toObject(), activities: activities.filter(a => String(a.trip) === String(t._id)) })), page, pages: Math.ceil(total / limit), total })
})
router.post('/', validate(z.object({ body: tripInput })), async (req, res) => {
  const trip = await Trip.create({ ...req.validated.body, user: req.user.id })
  res.status(201).json({ trip })
})
router.get('/:id', validate(idParams), async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id }).populate('destination')
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  const activities = await Activity.find({ trip: trip.id, user: req.user.id }).sort({ date: 1, startTime: 1 })
  res.json({ trip: { ...trip.toObject(), activities } })
})
router.put('/:id', validate(z.object({ params: idParams.shape.params, body: tripUpdateInput })), async (req, res) => {
  const trip = await Trip.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: req.validated.body }, { new: true, runValidators: true })
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  res.json({ trip })
})
router.delete('/:id', validate(idParams), async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  await Activity.deleteMany({ trip: trip.id, user: req.user.id })
  await Promise.all([
    PackingItem.deleteMany({ trip: trip.id, user: req.user.id }),
    JournalEntry.deleteMany({ trip: trip.id, user: req.user.id }),
    Expense.updateMany({ trip: trip.id, user: req.user.id }, { $unset: { trip: 1 } }),
    SharedTrip.updateMany({ trip: trip.id, user: req.user.id, revokedAt: null }, { $set: { revokedAt: new Date() } }),
  ])
  res.json({ message: 'Trip and its activities were removed.' })
})
router.put('/:tripId/activities/reorder', validate(z.object({ params: z.object({ tripId: objectId }), body: z.object({ activityIds: z.array(objectId).min(1).max(100) }) })), async (req, res) => {
  const trip = await Trip.exists({ _id: req.params.tripId, user: req.user.id })
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  const ids = req.validated.body.activityIds
  const existing = await Activity.find({ _id: { $in: ids }, trip: req.params.tripId, user: req.user.id }).select('_id')
  if (existing.length !== ids.length) return res.status(400).json({ error: 'Every activity must belong to this trip.' })
  await Activity.bulkWrite(ids.map((activityId, order) => ({ updateOne: { filter: { _id: activityId, trip: req.params.tripId, user: req.user.id }, update: { $set: { order } } } })))
  res.json({ message: 'Activities reordered.' })
})
router.get('/:tripId/activities', validate(z.object({ params: z.object({ tripId: objectId }) })), async (req, res) => {
  const trip = await Trip.exists({ _id: req.params.tripId, user: req.user.id })
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  res.json({ items: await Activity.find({ trip: req.params.tripId, user: req.user.id }).sort({ date: 1, startTime: 1, order: 1 }) })
})
router.post('/:tripId/activities', validate(z.object({ params: z.object({ tripId: objectId }), body: z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(1000).optional(), date: z.coerce.date(), startTime: z.string().optional(), endTime: z.string().optional(), location: z.string().optional(), estimatedCost: z.coerce.number().min(0).default(0), currency: z.string().length(3).default('USD'), category: z.enum(['sightseeing', 'food', 'transport', 'adventure', 'shopping', 'relaxation']).default('sightseeing'), notes: z.string().optional(), bookingReference: z.string().optional(), coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(), order: z.coerce.number().optional() }) })), async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.tripId, user: req.user.id })
  if (!trip) return res.status(404).json({ error: 'Trip not found.' })
  if (req.validated.body.date < trip.startDate || req.validated.body.date > trip.endDate) return res.status(400).json({ error: 'Activity date must fall within your trip dates.' })
  const activity = await Activity.create({ ...req.validated.body, user: req.user.id, trip: trip.id })
  res.status(201).json({ activity })
})
export default router
