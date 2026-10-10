import { Router } from 'express'
import { z } from 'zod'
import { Activity, Trip } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { objectId, validate } from '../middleware/validate.js'
const router = Router()
router.use(requireAuth)
const params = z.object({ params: z.object({ id: objectId }) })
router.put('/:id', validate(z.object({ params: params.shape.params, body: z.object({ name: z.string().trim().min(1).max(120).optional(), description: z.string().max(1000).optional(), date: z.coerce.date().optional(), startTime: z.string().optional(), endTime: z.string().optional(), location: z.string().optional(), estimatedCost: z.coerce.number().min(0).optional(), currency: z.string().length(3).optional(), category: z.enum(['sightseeing', 'food', 'transport', 'adventure', 'shopping', 'relaxation']).optional(), notes: z.string().optional(), bookingReference: z.string().optional(), order: z.coerce.number().optional(), coordinates: z.object({ lat: z.number(), lng: z.number() }).optional() }) })), async (req, res) => {
  const activity = await Activity.findOne({ _id: req.params.id, user: req.user.id })
  if (!activity) return res.status(404).json({ error: 'Activity not found.' })
  const trip = await Trip.findOne({ _id: activity.trip, user: req.user.id })
  if (req.validated.body.date && (req.validated.body.date < trip.startDate || req.validated.body.date > trip.endDate)) return res.status(400).json({ error: 'Activity date must fall within your trip dates.' })
  Object.assign(activity, req.validated.body)
  await activity.save()
  res.json({ activity })
})
router.delete('/:id', validate(params), async (req, res) => {
  const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!activity) return res.status(404).json({ error: 'Activity not found.' })
  res.json({ message: 'Activity removed.' })
})
export default router
