import { Router } from 'express'
import { z } from 'zod'
import { Expense, Notification, Trip } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { objectId, validate } from '../middleware/validate.js'
const router = Router()
router.use(requireAuth)
const input = z.object({ title: z.string().trim().min(1).max(120), category: z.enum(['Flights', 'Accommodation', 'Food', 'Transportation', 'Activities', 'Shopping', 'Miscellaneous']), amount: z.coerce.number().positive(), currency: z.string().length(3).default('USD'), date: z.coerce.date(), paymentMethod: z.string().max(40).default('Card'), trip: z.string().optional(), notes: z.string().max(1000).optional() })
const id = z.object({ params: z.object({ id: objectId }) })
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100))
  const filter = { user: req.user.id }
  if (req.query.trip) filter.trip = req.query.trip
  if (req.query.category) filter.category = req.query.category
  if (req.query.from || req.query.to) filter.date = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(req.query.to) } : {}) }
  if (req.query.search) filter.title = { $regex: String(req.query.search).slice(0, 80), $options: 'i' }
  const [items, total] = await Promise.all([Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).populate('trip', 'name destinationName currency'), Expense.countDocuments(filter)])
  res.json({ items, total, page, pages: Math.ceil(total / limit) })
})
router.post('/', validate(z.object({ body: input })), async (req, res) => {
  const data = { ...req.validated.body, user: req.user.id }
  let linkedTrip = null
  if (data.trip) { linkedTrip = await Trip.findOne({ _id: data.trip, user: req.user.id }); if (!linkedTrip) return res.status(404).json({ error: 'Trip not found.' }) }
  const expense = await Expense.create(data)
  if (linkedTrip?.budget > 0 && (data.currency || 'USD') === linkedTrip.currency) {
    const spent = await Expense.aggregate([{ $match: { user: linkedTrip.user, trip: linkedTrip._id, currency: linkedTrip.currency } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    const amount = spent[0]?.total || 0, threshold = amount >= linkedTrip.budget ? linkedTrip.budget : linkedTrip.budget * .8
    if (amount >= threshold) {
      const type = amount >= linkedTrip.budget ? 'budget-overspend' : 'budget-warning'
      if (!await Notification.exists({ user: req.user.id, trip: linkedTrip.id, type })) await Notification.create({ user: req.user.id, trip: linkedTrip.id, type, title: type === 'budget-overspend' ? 'Trip budget reached' : 'Budget check-in', body: `${linkedTrip.name}: ${linkedTrip.currency} ${new Intl.NumberFormat('en', { style: 'currency', currency: linkedTrip.currency }).format(amount)} spent of ${linkedTrip.currency} ${new Intl.NumberFormat('en', { style: 'currency', currency: linkedTrip.currency }).format(linkedTrip.budget)}.` })
    }
  }
  res.status(201).json({ expense })
})
router.get('/:id', validate(id), async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id }).populate('trip', 'name destinationName currency')
  if (!expense) return res.status(404).json({ error: 'Expense not found.' })
  res.json({ expense })
})
router.put('/:id', validate(z.object({ params: id.shape.params, body: input.partial() })), async (req, res) => {
  const data = req.validated.body
  if (data.trip) { const trip = await Trip.exists({ _id: data.trip, user: req.user.id }); if (!trip) return res.status(404).json({ error: 'Trip not found.' }) }
  const expense = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: data }, { new: true, runValidators: true })
  if (!expense) return res.status(404).json({ error: 'Expense not found.' })
  res.json({ expense })
})
router.delete('/:id', validate(id), async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!expense) return res.status(404).json({ error: 'Expense not found.' })
  res.json({ message: 'Expense removed.' })
})
export default router
