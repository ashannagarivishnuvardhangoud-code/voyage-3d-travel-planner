import 'dotenv/config'
import mongoose from 'mongoose'
import { Destination } from './models/index.js'

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env before seeding destinations.')
const destinations = [
  { name: 'Bali', country: 'Indonesia', description: 'Temple mornings, emerald rice terraces, and slow afternoons by the sea.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85', dailyCost: 95, durationDays: 7, bestTime: 'Apr – Oct', categories: ['Beaches', 'Culture', 'Adventure'], coordinates: { lat: -8.4095, lng: 115.1889 }, featured: true },
  { name: 'Kyoto', country: 'Japan', description: 'A quieter rhythm among lantern-lit lanes, gardens, and timeless tea houses.', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85', dailyCost: 145, durationDays: 5, bestTime: 'Mar – May', categories: ['Culture', 'City breaks'], coordinates: { lat: 35.0116, lng: 135.7681 }, featured: true },
  { name: 'Paris', country: 'France', description: 'Long lunches, neighborhood walks, and a little art around every corner.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85', dailyCost: 210, durationDays: 4, bestTime: 'Apr – Jun', categories: ['Culture', 'City breaks'], coordinates: { lat: 48.8566, lng: 2.3522 }, featured: true },
  { name: 'Swiss Alps', country: 'Switzerland', description: 'Alpine rail journeys, clear mountain lakes, and trails with room to breathe.', imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=85', dailyCost: 245, durationDays: 6, bestTime: 'Jun – Sep', categories: ['Mountains', 'Adventure'], coordinates: { lat: 46.8182, lng: 8.2275 }, featured: true },
  { name: 'Goa', country: 'India', description: 'Easy coastal days, colorful markets, and fresh seafood at sunset.', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85', dailyCost: 55, durationDays: 4, bestTime: 'Nov – Feb', categories: ['Beaches', 'Relaxation'], coordinates: { lat: 15.2993, lng: 74.124 }, featured: true },
  { name: 'Manali', country: 'India', description: 'Pine-scented air, mountain roads, and a base for high-altitude adventures.', imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85', dailyCost: 48, durationDays: 5, bestTime: 'Mar – Jun', categories: ['Mountains', 'Adventure'], coordinates: { lat: 32.2396, lng: 77.1887 }, featured: false },
  { name: 'Jaipur', country: 'India', description: 'Pink-hued palaces, craft-filled bazaars, and stories written in stone.', imageUrl: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85', dailyCost: 62, durationDays: 3, bestTime: 'Oct – Mar', categories: ['Culture', 'City breaks'], coordinates: { lat: 26.9124, lng: 75.7873 }, featured: false },
  { name: 'Singapore', country: 'Singapore', description: 'A garden city of hawker feasts, bold architecture, and pocket-sized escapes.', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=85', dailyCost: 170, durationDays: 4, bestTime: 'Feb – Apr', categories: ['City breaks', 'Food'], coordinates: { lat: 1.3521, lng: 103.8198 }, featured: false },
]

try {
  await mongoose.connect(process.env.MONGODB_URI)
  await Destination.bulkWrite(destinations.map(item => ({ updateOne: { filter: { name: item.name, country: item.country }, update: { $set: item }, upsert: true } })))
  console.log(`Seeded ${destinations.length} destinations.`)
} finally { await mongoose.disconnect() }
