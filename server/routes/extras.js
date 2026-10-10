import { Router } from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { Activity, Destination, Favorite, JournalEntry, Notification, PackingItem, SharedTrip, Trip } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { objectId, validate } from '../middleware/validate.js'

const router = Router()
const id = z.object({ params: z.object({ id: objectId }) })
router.get('/shared/:token', async (req, res) => {
  const share = await SharedTrip.findOne({ token: req.params.token, revokedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
  if (!share) return res.status(404).json({ error: 'This shared trip is unavailable.' })
  const trip = await Trip.findById(share.trip).populate('destination')
  if (!trip) return res.status(404).json({ error: 'This trip is unavailable.' })
  const activities = await Activity.find({ trip: trip.id }).sort({ date: 1, startTime: 1 })
  res.json({ trip: { ...trip.toObject(), activities } })
})
router.use(requireAuth)

router.get('/favorites', async (req, res) => res.json({ items: await Favorite.find({ user: req.user.id }).populate('destination') }))
router.post('/favorites', validate(z.object({ body: z.object({ destination: objectId }) })), async (req, res) => {
  const exists = await Destination.exists({ _id: req.validated.body.destination })
  if (!exists) return res.status(404).json({ error: 'Destination not found.' })
  const favorite = await Favorite.findOneAndUpdate({ user: req.user.id, destination: req.validated.body.destination }, { $setOnInsert: { user: req.user.id, destination: req.validated.body.destination } }, { upsert: true, new: true }).populate('destination')
  res.status(201).json({ favorite })
})
router.delete('/favorites/:id', validate(id), async (req, res) => {
  const favorite = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!favorite) return res.status(404).json({ error: 'Favorite not found.' })
  res.json({ message: 'Favorite removed.' })
})

router.get('/trips/:tripId/packing', validate(z.object({ params: z.object({ tripId: objectId }) })), async (req, res) => {
  if (!await Trip.exists({ _id: req.params.tripId, user: req.user.id })) return res.status(404).json({ error: 'Trip not found.' })
  res.json({ items: await PackingItem.find({ trip: req.params.tripId, user: req.user.id }).sort({ createdAt: 1 }) })
})
router.post('/trips/:tripId/packing', validate(z.object({ params: z.object({ tripId: objectId }), body: z.object({ name: z.string().trim().min(1).max(120), category: z.string().max(50).optional() }) })), async (req, res) => {
  if (!await Trip.exists({ _id: req.params.tripId, user: req.user.id })) return res.status(404).json({ error: 'Trip not found.' })
  const item = await PackingItem.create({ ...req.validated.body, trip: req.params.tripId, user: req.user.id })
  res.status(201).json({ item })
})
router.put('/packing/:id', validate(z.object({ params: id.shape.params, body: z.object({ name: z.string().trim().min(1).max(120).optional(), category: z.string().max(50).optional(), packed: z.boolean().optional() }) })), async (req, res) => {
  const item = await PackingItem.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: req.validated.body }, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ error: 'Packing item not found.' })
  res.json({ item })
})
router.delete('/packing/:id', validate(id), async (req, res) => {
  const item = await PackingItem.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!item) return res.status(404).json({ error: 'Packing item not found.' })
  res.json({ message: 'Packing item removed.' })
})

router.get('/trips/:tripId/journal', validate(z.object({ params: z.object({ tripId: objectId }) })), async (req, res) => {
  if (!await Trip.exists({ _id: req.params.tripId, user: req.user.id })) return res.status(404).json({ error: 'Trip not found.' })
  res.json({ items: await JournalEntry.find({ trip: req.params.tripId, user: req.user.id }).sort({ date: -1 }) })
})
router.post('/trips/:tripId/journal', validate(z.object({ params: z.object({ tripId: objectId }), body: z.object({ title: z.string().trim().min(1).max(120), body: z.string().max(4000).optional(), date: z.coerce.date().optional(), imageUrl: z.string().url().or(z.literal('')).optional(), location: z.string().max(120).optional() }) })), async (req, res) => {
  if (!await Trip.exists({ _id: req.params.tripId, user: req.user.id })) return res.status(404).json({ error: 'Trip not found.' })
  const entry = await JournalEntry.create({ ...req.validated.body, trip: req.params.tripId, user: req.user.id })
  res.status(201).json({ entry })
})
router.put('/journal/:id', validate(z.object({ params: id.shape.params, body: z.object({ title: z.string().min(1).max(120).optional(), body: z.string().max(4000).optional(), date: z.coerce.date().optional(), imageUrl: z.string().url().or(z.literal('')).optional(), location: z.string().max(120).optional() }) })), async (req, res) => {
  const entry = await JournalEntry.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: req.validated.body }, { new: true, runValidators: true })
  if (!entry) return res.status(404).json({ error: 'Journal entry not found.' })
  res.json({ entry })
})
router.delete('/journal/:id', validate(id), async (req, res) => {
  const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!entry) return res.status(404).json({ error: 'Journal entry not found.' })
  res.json({ message: 'Journal entry removed.' })
})

router.get('/notifications', async (req, res) => {
  const from = new Date(); from.setHours(0, 0, 0, 0)
  const until = new Date(from); until.setDate(until.getDate() + 3)
  const upcoming = await Activity.find({ user: req.user.id, date: { $gte: from, $lt: until } }).select('_id trip name date startTime')
  for (const activity of upcoming) {
    await Notification.updateOne({ user: req.user.id, activity: activity._id, type: 'activity-reminder' }, { $setOnInsert: { user: req.user.id, activity: activity._id, trip: activity.trip, type: 'activity-reminder', title: `Coming up: ${activity.name}`, body: `${activity.date.toLocaleDateString()}${activity.startTime ? ` at ${activity.startTime}` : ''}` } }, { upsert: true })
  }
  res.json({ items: await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50) })
})
router.put('/notifications/:id/read', validate(id), async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: { readAt: new Date() } }, { new: true })
  if (!item) return res.status(404).json({ error: 'Notification not found.' })
  res.json({ item })
})

router.post('/trips/:tripId/share', validate(z.object({ params: z.object({ tripId: objectId }) })), async (req, res) => {
  if (!await Trip.exists({ _id: req.params.tripId, user: req.user.id })) return res.status(404).json({ error: 'Trip not found.' })
  const token = crypto.randomBytes(24).toString('base64url')
  const share = await SharedTrip.create({ user: req.user.id, trip: req.params.tripId, token })
  res.status(201).json({ share: { id: share.id, token, url: `${req.protocol}://${req.get('host')}/shared/${token}` } })
})
router.delete('/share/:id', validate(id), async (req, res) => {
  const share = await SharedTrip.findOneAndUpdate({ _id: req.params.id, user: req.user.id, revokedAt: null }, { $set: { revokedAt: new Date() } }, { new: true })
  if (!share) return res.status(404).json({ error: 'Share link not found.' })
  res.json({ message: 'Share link revoked.' })
})
export default router
