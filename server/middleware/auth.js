import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Session is no longer valid.' })
    req.user = user
    next()
  } catch { res.status(401).json({ error: 'Your session has expired. Please sign in again.' }) }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' })
  next()
}
