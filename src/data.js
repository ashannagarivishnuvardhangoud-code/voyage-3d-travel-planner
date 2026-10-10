const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export const starterDestinations = [
  { _id: 'dest-bali', name: 'Bali', country: 'Indonesia', description: 'Temple mornings, emerald rice terraces, and slow afternoons by the sea.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85', dailyCost: 95, durationDays: 7, bestTime: 'Apr – Oct', categories: ['Beaches', 'Culture', 'Adventure'], coordinates: { lat: -8.4095, lng: 115.1889 }, featured: true },
  { _id: 'dest-kyoto', name: 'Kyoto', country: 'Japan', description: 'A quieter rhythm among lantern-lit lanes, gardens, and timeless tea houses.', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85', dailyCost: 145, durationDays: 5, bestTime: 'Mar – May', categories: ['Culture', 'City breaks'], coordinates: { lat: 35.0116, lng: 135.7681 }, featured: true },
  { _id: 'dest-paris', name: 'Paris', country: 'France', description: 'Long lunches, neighborhood walks, and a little art around every corner.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85', dailyCost: 210, durationDays: 4, bestTime: 'Apr – Jun', categories: ['Culture', 'City breaks'], coordinates: { lat: 48.8566, lng: 2.3522 }, featured: true },
  { _id: 'dest-alps', name: 'Swiss Alps', country: 'Switzerland', description: 'Alpine rail journeys, clear mountain lakes, and trails with room to breathe.', imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=85', dailyCost: 245, durationDays: 6, bestTime: 'Jun – Sep', categories: ['Mountains', 'Adventure'], coordinates: { lat: 46.8182, lng: 8.2275 }, featured: true },
  { _id: 'dest-goa', name: 'Goa', country: 'India', description: 'Easy coastal days, colorful markets, and fresh seafood at sunset.', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85', dailyCost: 55, durationDays: 4, bestTime: 'Nov – Feb', categories: ['Beaches', 'Relaxation'], coordinates: { lat: 15.2993, lng: 74.124 }, featured: false },
  { _id: 'dest-manali', name: 'Manali', country: 'India', description: 'Pine-scented air, mountain roads, and a base for high-altitude adventures.', imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85', dailyCost: 48, durationDays: 5, bestTime: 'Mar – Jun', categories: ['Mountains', 'Adventure'], coordinates: { lat: 32.2396, lng: 77.1887 }, featured: false },
  { _id: 'dest-jaipur', name: 'Jaipur', country: 'India', description: 'Pink-hued palaces, craft-filled bazaars, and stories written in stone.', imageUrl: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85', dailyCost: 62, durationDays: 3, bestTime: 'Oct – Mar', categories: ['Culture', 'City breaks'], coordinates: { lat: 26.9124, lng: 75.7873 }, featured: false },
  { _id: 'dest-singapore', name: 'Singapore', country: 'Singapore', description: 'A garden city of hawker feasts, bold architecture, and pocket-sized escapes.', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=85', dailyCost: 170, durationDays: 4, bestTime: 'Feb – Apr', categories: ['City breaks', 'Food'], coordinates: { lat: 1.3521, lng: 103.8198 }, featured: false },
]

export function initialDemoData() {
  const trip1 = { _id: 'trip-kyoto', name: 'A week in Kyoto', destinationName: 'Kyoto', country: 'Japan', imageUrl: starterDestinations[1].imageUrl, startDate: plusDays(32), endDate: plusDays(38), travelers: 2, budget: 3200, currency: 'USD', description: 'Slow days, good food, and a little temple hopping.', status: 'upcoming' }
  const trip2 = { _id: 'trip-goa', name: 'Long weekend in Goa', destinationName: 'Goa', country: 'India', imageUrl: starterDestinations[4].imageUrl, startDate: plusDays(-60), endDate: plusDays(-56), travelers: 2, budget: 850, currency: 'USD', description: 'A few days by the water.', status: 'completed' }
  return {
    trips: [trip1, trip2],
    activities: [
      { _id: 'act-1', trip: trip1._id, name: 'Fushimi Inari early walk', category: 'sightseeing', date: plusDays(32), startTime: '08:00', endTime: '10:00', location: 'Fushimi Inari Taisha', estimatedCost: 0, currency: 'USD', coordinates: { lat: 34.9671, lng: 135.7727 } },
      { _id: 'act-2', trip: trip1._id, name: 'Market lunch at Nishiki', category: 'food', date: plusDays(32), startTime: '12:30', endTime: '14:00', location: 'Nishiki Market', estimatedCost: 35, currency: 'USD', coordinates: { lat: 35.0048, lng: 135.7649 } },
      { _id: 'act-3', trip: trip1._id, name: 'Philosopher’s Path', category: 'relaxation', date: plusDays(33), startTime: '10:00', endTime: '12:00', location: 'Sakyo Ward', estimatedCost: 0, currency: 'USD', coordinates: { lat: 35.027, lng: 135.794 } },
    ],
    expenses: [
      { _id: 'exp-1', title: 'Ryokan deposit', category: 'Accommodation', amount: 480, currency: 'USD', date: plusDays(-6), trip: trip1._id, paymentMethod: 'Card', tripName: trip1.name },
      { _id: 'exp-2', title: 'Rail pass', category: 'Transportation', amount: 165, currency: 'USD', date: plusDays(-8), trip: trip1._id, paymentMethod: 'Card', tripName: trip1.name },
      { _id: 'exp-3', title: 'Dinner by the river', category: 'Food', amount: 74, currency: 'USD', date: plusDays(-12), trip: trip2._id, paymentMethod: 'Card', tripName: trip2.name },
      { _id: 'exp-4', title: 'Museum tickets', category: 'Activities', amount: 42, currency: 'USD', date: plusDays(-18), trip: trip2._id, paymentMethod: 'Cash', tripName: trip2.name },
      { _id: 'exp-5', title: 'Airport transfer', category: 'Transportation', amount: 32, currency: 'USD', date: plusDays(-20), trip: trip2._id, paymentMethod: 'Card', tripName: trip2.name },
    ],
    packing: [{ _id: 'pack-1', trip: trip1._id, name: 'Passport', category: 'Essentials', packed: true }, { _id: 'pack-2', trip: trip1._id, name: 'Walking shoes', category: 'Clothing', packed: false }, { _id: 'pack-3', trip: trip1._id, name: 'Travel adapter', category: 'Essentials', packed: false }],
    journal: [{ _id: 'journal-1', trip: trip2._id, title: 'Golden hour at Palolem', body: 'We found a quiet stretch of sand after a long swim. Dinner was simple, fresh, and exactly right.', location: 'Palolem Beach', date: plusDays(-57), imageUrl: starterDestinations[4].imageUrl }],
    favorites: ['dest-bali', 'dest-alps'],
    notifications: [],
  }
}
