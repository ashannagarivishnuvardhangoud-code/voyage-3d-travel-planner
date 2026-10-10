import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(100) }) })
const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1) }) })
function authResponse(user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } }
}
router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.validated.body
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'An account with this email already exists.' })
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash })
  res.status(201).json(authResponse(user))
})
router.post('/login', validate(loginSchema), async (req, res) => {
  const user = await User.findOne({ email: req.validated.body.email.toLowerCase() }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(req.validated.body.password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' })
  res.json(authResponse(user))
})
router.get('/me', requireAuth, (req, res) => res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, avatarUrl: req.user.avatarUrl, preferences: req.user.preferences } }))
const profileSchema = z.object({ name: z.string().trim().min(2).max(80).optional(), preferences: z.object({ currency: z.string().length(3).optional(), homeAirport: z.string().max(8).optional() }).optional() })
router.put('/me', requireAuth, validate(z.object({ body: profileSchema })), async (req, res) => {
  const data = req.validated.body
  const user = await User.findByIdAndUpdate(req.user.id, { $set: data }, { new: true, runValidators: true })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, preferences: user.preferences } })
})
export default router
