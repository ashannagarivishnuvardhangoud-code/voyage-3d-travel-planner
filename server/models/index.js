import mongoose from 'mongoose'

const { Schema, model } = mongoose
const base = { timestamps: true }

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['traveler', 'admin'], default: 'traveler' },
  preferences: { currency: { type: String, default: 'USD' }, homeAirport: String },
}, base)

const destinationSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true }, country: { type: String, required: true },
  description: { type: String, default: '' }, imageUrl: { type: String, default: '' },
  dailyCost: { type: Number, min: 0, default: 0 }, durationDays: { type: Number, min: 1, default: 3 },
  bestTime: { type: String, default: '' }, categories: [{ type: String }],
  coordinates: { lat: Number, lng: Number }, featured: { type: Boolean, default: false },
}, base)

const tripSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  destination: { type: Schema.Types.ObjectId, ref: 'Destination' }, destinationName: { type: String, required: true },
  country: { type: String, default: '' }, imageUrl: { type: String, default: '' },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  travelers: { type: Number, min: 1, max: 30, default: 1 }, budget: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'USD', uppercase: true }, description: { type: String, default: '' },
  preferences: [{ type: String }], status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
}, base)

const activitySchema = new Schema({
  trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true }, description: String, date: { type: Date, required: true },
  startTime: String, endTime: String, location: String, estimatedCost: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'USD' }, category: { type: String, enum: ['sightseeing', 'food', 'transport', 'adventure', 'shopping', 'relaxation'], default: 'sightseeing' },
  notes: String, bookingReference: String, coordinates: { lat: Number, lng: Number }, order: { type: Number, default: 0 },
}, base)
activitySchema.index({ user: 1, trip: 1, date: 1, startTime: 1 })

const expenseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, trip: { type: Schema.Types.ObjectId, ref: 'Trip', index: true },
  title: { type: String, required: true, trim: true }, category: { type: String, enum: ['Flights', 'Accommodation', 'Food', 'Transportation', 'Activities', 'Shopping', 'Miscellaneous'], required: true },
  amount: { type: Number, required: true, min: 0.01 }, currency: { type: String, default: 'USD', uppercase: true },
  date: { type: Date, required: true }, paymentMethod: { type: String, default: 'Card' }, notes: String,
}, base)
expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, trip: 1, date: -1 })

const packingSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true }, name: { type: String, required: true, trim: true }, category: String, packed: { type: Boolean, default: false } }, base)
packingSchema.index({ user: 1, trip: 1, createdAt: 1 })
const journalSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true }, date: { type: Date, default: Date.now }, title: { type: String, required: true }, body: String, imageUrl: String, location: String }, base)
const favoriteSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, destination: { type: Schema.Types.ObjectId, ref: 'Destination', required: true } }, base)
favoriteSchema.index({ user: 1, destination: 1 }, { unique: true })
const notificationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: String, body: String, readAt: Date, type: String, trip: { type: Schema.Types.ObjectId, ref: 'Trip' }, activity: { type: Schema.Types.ObjectId, ref: 'Activity' } }, base)
notificationSchema.index({ user: 1, activity: 1, type: 1 }, { unique: true, partialFilterExpression: { activity: { $exists: true } } })
const sharedTripSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true }, token: { type: String, required: true, unique: true }, revokedAt: Date, expiresAt: Date }, base)

export const User = model('User', userSchema)
export const Destination = model('Destination', destinationSchema)
export const Trip = model('Trip', tripSchema)
export const Activity = model('Activity', activitySchema)
export const Expense = model('Expense', expenseSchema)
export const PackingItem = model('PackingItem', packingSchema)
export const JournalEntry = model('JournalEntry', journalSchema)
export const Favorite = model('Favorite', favoriteSchema)
export const Notification = model('Notification', notificationSchema)
export const SharedTrip = model('SharedTrip', sharedTripSchema)
