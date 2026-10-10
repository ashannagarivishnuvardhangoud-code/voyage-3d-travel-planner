import { Router } from 'express'
import { z } from 'zod'
import { Destination } from '../models/index.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { objectId, validate } from '../middleware/validate.js'
const router = Router()
const id = z.object({ params: z.object({ id: objectId }) })
const input = z.object({ name: z.string().trim().min(2).max(80), country: z.string().min(2), description: z.string().max(2000).optional(), imageUrl: z.string().url().or(z.literal('')).optional(), dailyCost: z.coerce.number().min(0), durationDays: z.coerce.number().int().min(1).max(90), bestTime: z.string().optional(), categories: z.array(z.string()).optional(), coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(), featured: z.boolean().optional() })
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24))
  const filter = {}
  if (req.query.category && req.query.category !== 'All') filter.categories = String(req.query.category)
  if (req.query.search) filter.$or = [{ name: { $regex: String(req.query.search).slice(0, 80), $options: 'i' } }, { country: { $regex: String(req.query.search).slice(0, 80), $options: 'i' } }]
  const sort = req.query.sort === 'price-low' ? { dailyCost: 1 } : req.query.sort === 'price-high' ? { dailyCost: -1 } : { featured: -1, name: 1 }
  const [items, total] = await Promise.all([Destination.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Destination.countDocuments(filter)])
  res.json({ items, total, page, pages: Math.ceil(total / limit) })
})
router.get('/:id', validate(id), async (req, res) => {
  const destination = await Destination.findById(req.params.id)
  if (!destination) return res.status(404).json({ error: 'Destination not found.' })
  res.json({ destination })
})
router.post('/', requireAuth, requireAdmin, validate(z.object({ body: input })), async (req, res) => { const destination = await Destination.create(req.validated.body); res.status(201).json({ destination }) })
router.put('/:id', requireAuth, requireAdmin, validate(z.object({ params: id.shape.params, body: input.partial() })), async (req, res) => {
  const destination = await Destination.findByIdAndUpdate(req.params.id, { $set: req.validated.body }, { new: true, runValidators: true })
  if (!destination) return res.status(404).json({ error: 'Destination not found.' })
  res.json({ destination })
})
router.delete('/:id', requireAuth, requireAdmin, validate(id), async (req, res) => {
  const destination = await Destination.findByIdAndDelete(req.params.id)
  if (!destination) return res.status(404).json({ error: 'Destination not found.' })
  res.json({ message: 'Destination removed.' })
})
export default router
