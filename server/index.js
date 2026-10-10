import 'express-async-errors'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import tripRoutes from './routes/trips.js'
import activityRoutes from './routes/activities.js'
import expenseRoutes from './routes/expenses.js'
import destinationRoutes from './routes/destinations.js'
import extraRoutes from './routes/extras.js'
import adminRoutes from './routes/admin.js'
import { errorHandler, notFound } from './middleware/errors.js'

const app = express()
const port = Number(process.env.PORT) || 4000
app.disable('x-powered-by')
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
    connectSrc: ["'self'"], workerSrc: ["'self'", 'blob:'], objectSrc: ["'none'"], baseUri: ["'self'"],
    formAction: ["'self'"], frameAncestors: ["'none'"],
  } },
}))
const clientOrigins = process.env.CLIENT_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean)
if (clientOrigins?.length) app.use(cors({ origin: clientOrigins }))
else if (process.env.NODE_ENV !== 'production') app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }))
app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is not connected. Configure MONGODB_URI to enable persistent accounts and records.' })
  next()
})
app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/destinations', destinationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', extraRoutes)

if (process.env.NODE_ENV === 'production') {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(here, '../dist')
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  app.use(notFound)
}
app.use(errorHandler)

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB connection failed:', err.message))
} else {
  console.warn('MONGODB_URI is not set; persistent API records are unavailable. The client will use clearly labeled local demo storage.')
}
app.listen(port, () => console.log(`VOYAGE 3D API listening on http://localhost:${port}`))
