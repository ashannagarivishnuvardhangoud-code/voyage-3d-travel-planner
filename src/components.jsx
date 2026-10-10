import React, { lazy, Suspense, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Compass, Heart, MapPin, Plus, Sparkles, X } from 'lucide-react'

const GlobeCanvas = lazy(() => import('./Globe.jsx'))
const MapCanvas = lazy(() => import('./MapImpl.jsx'))

export function Brand({ light = false, compact = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Compass size={18} strokeWidth={2.2} /></span><span><b>VOYAGE</b>{!compact && <small>3D · EXPLORE MORE</small>}</span></div>
}

export function AnimatedGlobe() {
  const reduced = useReducedMotion()
  return <div className="globe-stage" aria-label="Slowly rotating decorative 3D globe">
    <div className="globe-halo" />
    <div className="globe-fallback"><span>VOYAGE</span></div>
    {!reduced && <Suspense fallback={null}><GlobeCanvas /></Suspense>}
    <div className="globe-label"><span className="pulse-dot" /> YOUR NEXT CHAPTER</div>
  </div>
}

export function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => { const onKey = e => e.key === 'Escape' && onClose?.(); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
    <motion.div initial={{ opacity: 0, y: 16, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button aria-label="Close dialog" className="icon-button" onClick={onClose}><X size={18} /></button></div>
      {children}
    </motion.div>
  </div>
}

export function PageTitle({ eyebrow, title, description, actions }) {
  return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-title-actions">{actions}</div>}</div>
}

export function SectionHeading({ title, link, onLink }) {
  return <div className="section-heading"><h2>{title}</h2>{link && <button className="text-link" onClick={onLink}>{link}<ChevronRight size={15} /></button>}</div>
}

export function Button({ children, variant = 'primary', icon: Icon, className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{Icon && <Icon size={16} strokeWidth={2.1} />}{children}</button>
}

export function DestinationCard({ destination, favorite, onFavorite, onPlan, onDetails }) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })
  return <motion.article className="destination-card" style={{ rotateX: tilt.x, rotateY: tilt.y, transformPerspective: 900 }} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: -((e.clientY - r.top) / r.height - .5) * 5, y: ((e.clientX - r.left) / r.width - .5) * 5 }) }} onMouseLeave={() => setTilt({ x: 0, y: 0 })} whileHover={{ y: -4 }} transition={{ duration: .2 }}>
    <div className="destination-cover"><img loading="lazy" src={destination.imageUrl} alt={`${destination.name}, ${destination.country}`} /><div className="cover-shade" />
      <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} aria-label={favorite ? `Remove ${destination.name} from wishlist` : `Save ${destination.name} to wishlist`} onClick={() => onFavorite(destination)}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
      <span className="destination-tag"><MapPin size={12} /> {destination.country}</span>
      <div className="cover-title"><h3>{destination.name}</h3><span>Est. USD ${destination.dailyCost}<small> / day</small></span></div>
    </div>
    <div className="destination-info"><p>{destination.description}</p><div className="destination-bottom"><span className="muted"><CalendarDays size={14} /> {destination.durationDays} days · {destination.bestTime}</span><button className="round-arrow" onClick={() => onDetails ? onDetails(destination) : onPlan(destination)} aria-label={onDetails ? `View details for ${destination.name}` : `Plan a trip to ${destination.name}`}><ArrowUpRight size={17} /></button></div></div>
  </motion.article>
}

export function StatCard({ label, value, note, icon: Icon, color = 'sage', trend }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={18} /></div><div className="stat-label">{label}</div><motion.strong key={`${label}-${value}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>{value}</motion.strong><div className="stat-foot">{trend && <span className="trend"><ArrowUpRight size={13} />{trend}</span>}{note}</div></div>
}

export function EmptyState({ icon: Icon = Sparkles, title, body, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22} /></span><h3>{title}</h3><p>{body}</p>{action && <Button onClick={onAction} icon={Plus}>{action}</Button>}</div>
}

export function LoadingCards() { return <div className="destination-grid">{[1, 2, 3].map(x => <div key={x} className="skeleton-card"><div /><span /><span /></div>)}</div> }

export function TravelMap({ points = [], className = '' }) {
  const valid = points.filter(p => p.coordinates && Number.isFinite(p.coordinates.lat) && Number.isFinite(p.coordinates.lng))
  const center = valid.length ? [valid[0].coordinates.lat, valid[0].coordinates.lng] : [30, 10]
  if (!valid.length) return <div className={`map-empty ${className}`}><MapPin size={23} /><b>No mapped locations yet</b><span>Add coordinates to a destination or activity to see it here.</span></div>
  return <div className={`map-frame ${className}`}><Suspense fallback={<div className="map-empty"><span>Loading map…</span></div>}><MapCanvas points={valid} center={center} /></Suspense></div>
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`toast toast-${toast.type || 'success'}`} role="status"><span className="toast-check"><Check size={15} /></span>{toast.message}<button aria-label="Dismiss message" onClick={onClose}><X size={15} /></button></motion.div>
}

export function Chip({ children, tone = 'muted' }) { return <span className={`chip chip-${tone}`}>{children}</span> }
