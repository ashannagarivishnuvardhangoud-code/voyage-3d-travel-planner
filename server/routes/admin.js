import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { Destination, Expense, Trip, User } from '../models/index.js'

const router = Router()
router.use(requireAuth, requireAdmin)
router.get('/overview', async (req, res) => {
  const [users, destinations, trips, expenses, latestUsers] = await Promise.all([
    User.countDocuments(), Destination.countDocuments(), Trip.countDocuments(), Expense.countDocuments(),
    User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(8),
  ])
  res.json({ counts: { users, destinations, trips, expenses }, latestUsers })
})
export default router
