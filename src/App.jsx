import React, { createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Compass, Globe2, Heart, Leaf, MapPin, Menu, MousePointer2, Plane, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react'
import { api } from './services/api.js'
import { starterDestinations } from './data.js'
import { AnimatedGlobe, Brand, Button, DestinationCard, EmptyState, LoadingCards, Modal, PageTitle, SectionHeading, Toast } from './components.jsx'
const loadView = name => import('./views.jsx').then(module => ({ default: module[name] }))
const Dashboard = lazy(() => loadView('Dashboard'))
const Destinations = lazy(() => loadView('Destinations'))
const Trips = lazy(() => loadView('Trips'))
const Itinerary = lazy(() => loadView('Itinerary'))
const MapPage = lazy(() => loadView('MapPage'))
const Expenses = lazy(() => loadView('Expenses'))
const Packing = lazy(() => loadView('Packing'))
const Journal = lazy(() => loadView('Journal'))
const Wishlist = lazy(() => loadView('Wishlist'))
const Profile = lazy(() => loadView('Profile'))
const Admin = lazy(() => loadView('Admin'))

const SessionContext = createContext(null)
export const useSession = () => useContext(SessionContext)
const savedUser = () => { try { return JSON.parse(localStorage.getItem(api.userKey) || 'null') } catch { return null } }

export default function App() {
  const [user, setUser] = useState(savedUser)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const sessionValue = useMemo(() => ({ user, setUser }), [user])

  useEffect(() => {
    if (!user) { setWorkspace(null); return }
    let active = true
    setLoading(true)
    api.getWorkspace().then(data => { if (active) setWorkspace(data) }).catch(error => { if (active) setToast({ type: 'error', message: error.message }) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user?.id])

  const refresh = async () => { const data = await api.getWorkspace(); setWorkspace(data); return data }
  const run = async (operation, message) => {
    try { const result = await operation(); await refresh(); setToast({ type: 'success', message }); return result }
    catch (error) { setToast({ type: 'error', message: error.message || 'That action could not be completed.' }); return undefined }
  }
  const enterDemo = () => { const demoUser = api.enterDemo(); setUser(demoUser); navigate('/app/dashboard') }
  const signOut = () => { api.signOut(); setUser(null); setWorkspace(null); navigate('/') }
  const goTo = (path) => { setMobileMenu(false); navigate(path) }
  const requirePlanner = (path = '/app/dashboard') => user ? goTo(path) : goTo(`/login?next=${encodeURIComponent(path)}`)

  const login = async (email, password) => { const signed = await api.login(email, password); setUser(signed); navigate(new URLSearchParams(location.search).get('next') || '/app/dashboard') }
  const register = async (name, email, password) => { const signed = await api.register(name, email, password); setUser(signed); navigate(new URLSearchParams(location.search).get('next') || '/app/dashboard') }

  const dashboardProps = { user, workspace, loading, run, goTo, requirePlanner, onSignOut: signOut, onTripSave: payload => run(() => api.createTrip(payload), 'Your trip has been created.'), onExpenseSave: payload => run(() => api.createExpense(payload), 'Expense added to your records.') }
  return <SessionContext.Provider value={sessionValue}><Suspense fallback={<div className="page-loading-fallback"><span className="loading-orbit" />Opening your travel space…</div>}>
    <Routes>
      <Route path="/" element={<Landing user={user} go={requirePlanner} publicGo={goTo} />} />
      <Route path="/destinations" element={<PublicDestinations user={user} go={requirePlanner} />} />
      <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace /> : <AuthPage mode="login" onSubmit={login} onDemo={enterDemo} />} />
      <Route path="/register" element={user ? <Navigate to="/app/dashboard" replace /> : <AuthPage mode="register" onSubmit={register} onDemo={enterDemo} />} />
      <Route path="/shared/:token" element={<SharedPage />} />
      <Route path="/app/*" element={user ? <PlannerApp user={user} workspace={workspace} loading={loading} toast={toast} setToast={setToast} goTo={goTo} onSignOut={signOut} onMobileMenu={() => setMobileMenu(!mobileMenu)} mobileMenu={mobileMenu} run={run} refresh={refresh} dashboardProps={dashboardProps} /> : <Navigate to="/login?next=%2Fapp%2Fdashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense></SessionContext.Provider>
}

function Landing({ user, go, publicGo }) {
  const [scrolled, setScrolled] = useState(false)
  const [searchPlace, setSearchPlace] = useState('')
  const [dates, setDates] = useState('')
  const [travelerCount, setTravelerCount] = useState('2 travelers')
  const [budget, setBudget] = useState('')
  useEffect(() => { const scroll = () => setScrolled(window.scrollY > 28); window.addEventListener('scroll', scroll); return () => window.removeEventListener('scroll', scroll) }, [])
  const features = [
    { icon: CalendarDays, title: 'An itinerary that fits you', text: 'Bring your ideas together in a flexible, day-by-day plan.' },
    { icon: Wallet, title: 'Your budget, in view', text: 'Track every little thing and keep your travel spend in balance.' },
    { icon: Globe2, title: 'The whole trip, on a map', text: 'See your destinations and activity stops in one clear view.' },
  ]
  return <div className="landing-page">
    <header className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}><Link to="/" aria-label="Voyage 3D home"><Brand /></Link><nav><a href="#destinations">Destinations</a><a href="#how-it-works">How it works</a><a href="#features">Features</a></nav><div className="nav-actions">{user ? <Link className="nav-login" to="/app/dashboard">My workspace <ArrowRight size={15} /></Link> : <><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary nav-cta" to="/register">Start planning <ArrowRight size={15} /></Link></>}</div></header>
    <main>
      <section className="hero"><div className="hero-image" /><div className="hero-grain" />
        <div className="hero-inner"><motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          <div className="hero-kicker"><span className="kicker-line" /> YOUR TRAVEL, THOUGHTFULLY PLANNED</div>
          <h1>Your Next Adventure<br /><em>Starts Here.</em></h1>
          <p>Plan unforgettable journeys, build your perfect itinerary, and keep every expense under control.</p>
          <div className="hero-buttons"><Button onClick={() => go('/app/trips')} icon={ArrowRight}>Plan my trip</Button><a href="#destinations" className="hero-secondary">Explore destinations <ArrowDownIcon /></a></div>
          <div className="hero-social"><div className="avatar-stack"><span>A</span><span>M</span><span>J</span><span>+</span></div><p><b>A little more room to wander.</b><br />Made for your kind of travel.</p></div>
        </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .2 }}><AnimatedGlobe /><div className="floating-note note-top"><span className="note-icon"><MapPin size={15} /></span><span><b>Somewhere new</b><small>is calling</small></span></div><div className="floating-note note-bottom"><div className="note-mini-image" /><span><b>7 days in Kyoto</b><small>Coming up next</small></span><ArrowUpRight size={16} /></div></motion.div>
        </div>
        <div className="hero-bottom"><span>34°N · 135°E</span><span>MAKE THE JOURNEY YOURS</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <section className="search-section"><form className="quick-search" onSubmit={e => { e.preventDefault(); const params = new URLSearchParams({ search: searchPlace, start: dates, travelers: travelerCount.replace(/\D/g, '') || '2', budget }); go(`/destinations?${params.toString()}`) }}><label><span><MapPin size={16} /></span><div><small>WHERE TO?</small><input value={searchPlace} onChange={e => setSearchPlace(e.target.value)} placeholder="Explore a destination" /></div></label><i /><label><span><CalendarDays size={16} /></span><div><small>WHEN?</small><input type="text" value={dates} onChange={e => setDates(e.target.value)} placeholder="Add your dates" onFocus={e => e.currentTarget.type = 'date'} /></div></label><i /><label><span><MousePointer2 size={16} /></span><div><small>WHO'S GOING?</small><select value={travelerCount} onChange={e => setTravelerCount(e.target.value)}><option>1 traveler</option><option>2 travelers</option><option>3 travelers</option><option>4+ travelers</option></select></div></label><i /><label><span><Wallet size={16} /></span><div><small>YOUR BUDGET</small><select value={budget} onChange={e => setBudget(e.target.value)}><option value="">Any budget</option><option value="1000">Under $1,000</option><option value="3000">$1,000–$3,000</option><option value="6000">$3,000+</option></select></div></label><Button type="submit" icon={ArrowRight}>Find your trip</Button></form></section>
      <section className="landing-section destinations-section" id="destinations"><div className="landing-section-head"><div><span className="eyebrow">A FEW PLACES TO BEGIN</span><h2>Somewhere on your mind?</h2><p>A little inspiration for wherever the road takes you.</p></div><button className="text-link" onClick={() => publicGo('/destinations')}>See all destinations <ChevronRight size={16} /></button></div><div className="landing-destination-grid">{starterDestinations.slice(0, 3).map((d, i) => <motion.article key={d._id} className={`landing-destination landing-destination-${i + 1}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: i * .08 }} onClick={() => publicGo('/destinations')}><img loading="lazy" src={d.imageUrl} alt={`${d.name}, ${d.country}`} /><div className="landing-destination-shade" /><span className="landing-destination-number">0{i + 1} / {d.categories[0]?.toUpperCase()}</span><div><span>{d.country}</span><h3>{d.name}</h3><p>From USD ${d.dailyCost} / day · est.</p></div><ArrowUpRight className="destination-up" size={22} /></motion.article>)}</div></section>
      <section className="experience-band" id="how-it-works"><div className="experience-photo"><img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85" alt="Mountain lake framed by green slopes" loading="lazy" /><div className="experience-caption"><Sparkles size={15} /><span>SPACE TO FIND YOUR OWN WAY</span></div></div><div className="experience-copy"><span className="eyebrow">THE ART OF GETTING AWAY</span><h2>More dreaming.<br /><em>Less juggling.</em></h2><p>Good trips happen when the details feel light. Keep the days, the spending, and all those little ideas together — then leave room for the unexpected.</p><div className="step-list"><div><span>01</span><p><b>Start with a place</b><small>Find a destination that feels like you.</small></p></div><div><span>02</span><p><b>Make it your own</b><small>Shape each day around what you love.</small></p></div><div><span>03</span><p><b>Go with a little more ease</b><small>Keep your plans and spending in one view.</small></p></div></div><Button variant="outline" onClick={() => publicGo('/destinations')} icon={ArrowRight}>Find your somewhere</Button></div></section>
      <section className="feature-section" id="features"><div className="feature-top"><span className="eyebrow">A CALMER WAY TO TRAVEL</span><h2>All the good bits,<br />in one place.</h2><p>Thoughtful tools to help you make the most of the moments between here and there.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, text }, i) => <motion.div key={title} className="feature-card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}><div className="feature-icon"><Icon size={20} /></div><span className="feature-index">0{i + 1}</span><h3>{title}</h3><p>{text}</p><div className="feature-line" /></motion.div>)}</div></section>
      <section className="quote-section"><span className="eyebrow">SAMPLE TRAVELER NOTE</span><blockquote>“The best journeys answer questions that in the beginning you didn't even think to ask.”</blockquote><div className="quote-author"><span>— SAMPLE TESTIMONIAL · CARLA</span><div className="quote-stars">★★★★★</div></div><div className="quote-orbit orbit-one" /><div className="quote-orbit orbit-two" /></section>
      <section className="landing-cta"><div className="cta-glow" /><span className="eyebrow">YOUR NEXT CHAPTER IS OUT THERE</span><h2>Take the scenic route.</h2><p>Make a little space for the places you've been thinking about.</p><Button onClick={() => go('/app/trips')} icon={ArrowRight}>Plan my trip</Button><span className="cta-footnote">FREE TO GET STARTED · YOUR PLANS STAY YOURS</span></section>
    </main><footer className="landing-footer"><Brand /><div><a href="#destinations">Destinations</a><a href="#features">Features</a><Link to="/login">Log in</Link><Link to="/register">Get started</Link></div><span>© 2026 VOYAGE 3D · MADE FOR THE WAY YOU WANDER.</span></footer>
  </div>
}
function ArrowDownIcon() { return <span className="arrow-down">↓</span> }

function PublicDestinations({ user, go }) {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; api.getDestinations().then(items => { if (active) setDestinations(items) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const plan = (destination, intent = {}) => { const query = new URLSearchParams({ destination: destination.name, start: intent.start || '', travelers: String(intent.travelers || 2), budget: intent.budget || '' }); const target = `/app/trips?${query}`; navigate(user ? target : `/register?next=${encodeURIComponent(target)}`) }
  return <div className="public-explorer"><header className="public-explorer-nav"><Link to="/"><Brand /></Link><div><Link to="/">Home</Link>{user ? <Link to="/app/dashboard">My workspace</Link> : <Link to="/login">Log in</Link>}<Link className="button button-primary" to={user ? '/app/trips' : '/register'}>Plan a trip <ArrowRight size={15} /></Link></div></header><main><div className="public-explorer-intro"><span className="eyebrow">A FEW PLACES TO BEGIN</span><h1>Find your somewhere.</h1><p>Browse destinations without signing in. Cost and seasonal details are planning estimates.</p></div><Destinations workspace={{ destinations, favorites: [] }} loading={loading} onFavorite={() => user ? navigate('/app/destinations') : navigate('/login?next=%2Fapp%2Fdestinations')} onPlan={plan} /></main><footer className="public-explorer-footer"><span>VOYAGE 3D · Destination content is sample planning information.</span><Link to="/">Back home</Link></footer></div>
}

function AuthPage({ mode, onSubmit, onDemo }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const submit = async e => {
    e.preventDefault(); setError('')
    if (!isLogin && form.password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    try { if (isLogin) await onSubmit(form.email, form.password); else await onSubmit(form.name, form.email, form.password) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="auth-page"><div className="auth-art"><img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90" alt="A quiet alpine lake at sunrise" /><div className="auth-art-shade" /><Link to="/" className="auth-brand"><Brand light /></Link><div className="auth-art-copy"><span className="eyebrow">FIND YOUR OWN WAY</span><h2>Collect moments.<br /><em>Keep the memories.</em></h2><p>Thoughtful plans for the places that stay with you.</p></div><span className="auth-art-credit">46°34′N 7°59′E · SWISS ALPS</span></div><div className="auth-panel"><Link to="/" className="auth-mobile-brand"><Brand /></Link><div className="auth-form-wrap"><span className="eyebrow">{isLogin ? 'WELCOME BACK' : 'YOUR NEXT CHAPTER'}</span><h1>{isLogin ? 'Good to see you.' : 'Let’s get you going.'}</h1><p className="auth-lead">{isLogin ? 'Sign in and pick up right where the daydream left off.' : 'Create your free account and start shaping a trip.'}</p>
      <form onSubmit={submit} className="auth-form">{!isLogin && <label>Your name<input required minLength="2" autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan" /></label>}<label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<div className="password-field"><input required minLength={isLogin ? 1 : 8} type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={isLogin ? 'Your password' : 'At least 8 characters'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{error && <div className="form-error">{error}</div>}<Button type="submit" className="auth-submit" disabled={busy}>{busy ? 'One moment…' : isLogin ? 'Sign in' : 'Create my account'} <ArrowRight size={17} /></Button></form>
      <div className="auth-divider"><span />or<span /></div><button onClick={onDemo} className="demo-button"><Sparkles size={16} /> Explore the demo workspace</button><p className="auth-switch">{isLogin ? 'New around here?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p><small className="auth-demo-note">Demo mode uses sample data saved in this browser. Persistent accounts require a configured MongoDB backend.</small>
    </div><div className="auth-bottom"><span>PRIVATE BY DESIGN</span><span>© 2026 VOYAGE 3D</span></div></div></div>
}

function PlannerApp({ user, workspace, loading, toast, setToast, goTo, onSignOut, onMobileMenu, mobileMenu, run, refresh, dashboardProps }) {
  const location = useLocation()
  const [tripModal, setTripModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const handledPlan = useRef('')
  const saveTrip = payload => { setTripModal(false); return run(() => api.createTrip(payload), 'Your trip has been created.') }
  const saveExpense = payload => { setExpenseModal(false); return run(() => api.createExpense(payload), 'Expense added to your records.') }
  const favorite = destination => run(() => api.toggleFavorite(destination._id), 'Wishlist updated.')
  const deleteTrip = id => { if (window.confirm('Delete this trip and its activities, packing list, and journal entries?')) return run(() => api.deleteTrip(id), 'Trip removed.') }
  const deleteExpense = id => { if (window.confirm('Delete this expense? This cannot be undone.')) return run(() => api.deleteExpense(id), 'Expense removed.') }
  const startPlan = (destination, intent = {}) => {
    const start = intent.start && intent.start >= new Date().toISOString().slice(0, 10) ? intent.start : (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10) })()
    const travelers = Math.max(1, Number(intent.travelers) || 2)
    const end = new Date(`${start}T12:00:00`); end.setDate(end.getDate() + Math.max(2, Number(destination.durationDays || 5)) - 1)
    const estimate = Math.round(Number(destination.dailyCost || 0) * Math.max(2, Number(destination.durationDays || 5)) * travelers)
    const budget = intent.budget === '1000' ? Math.min(estimate || 1000, 1000) : intent.budget === '3000' ? Math.min(Math.max(estimate, 1000), 3000) : estimate || 2500
    setPendingPlan({ name: `A trip to ${destination.name}`, destinationName: destination.name, country: destination.country, imageUrl: destination.imageUrl, startDate: start, endDate: end.toISOString().slice(0, 10), travelers, budget, currency: 'USD' })
    setTripModal(true)
  }
  useEffect(() => {
    if (location.pathname !== '/app/trips' || !workspace) return
    const params = new URLSearchParams(location.search), name = params.get('destination'), key = params.toString()
    if (!name || !key || handledPlan.current === key) return
    const destination = workspace.destinations?.find(item => item.name === name)
    if (!destination) return
    handledPlan.current = key
    startPlan(destination, { start: params.get('start'), travelers: params.get('travelers'), budget: params.get('budget') })
    navigate('/app/trips', { replace: true })
  }, [location.pathname, location.search, workspace])
  const notices = workspace?.notifications || []
  const unreadNotices = notices.filter(item => !item.readAt).length
  const markNoticeRead = item => { if (!item.readAt && item._id) run(() => api.markNotificationRead(item._id), 'Notification marked as read.') }
  const actions = { run, refresh, favorite, saveTrip, deleteTrip, deleteExpense, setTripModal, setExpenseModal, startPlan }
  const destinationCount = workspace?.destinations?.length || starterDestinations.length
  const nav = [
    { label: 'OVERVIEW', items: [{ to: '/app/dashboard', icon: Compass, name: 'Dashboard' }, { to: '/app/destinations', icon: Globe2, name: 'Discover' }] },
    { label: 'YOUR TRAVEL', items: [{ to: '/app/trips', icon: Plane, name: 'My trips' }, { to: '/app/itinerary', icon: CalendarDays, name: 'Itinerary' }, { to: '/app/map', icon: MapPin, name: 'Travel map' }] },
    { label: 'KEEP IT TOGETHER', items: [{ to: '/app/expenses', icon: Wallet, name: 'Expenses' }, { to: '/app/packing', icon: Check, name: 'Packing list' }, { to: '/app/journal', icon: Leaf, name: 'Travel journal' }, { to: '/app/wishlist', icon: Heart, name: 'Wishlist' }] },
  ]
  return <div className="workspace"><aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Link to="/"><Brand /></Link><button className="mobile-close icon-button" onClick={onMobileMenu}><X size={18} /></button></div><button className="workspace-switch"><span className="workspace-avatar">{user.name?.[0] || 'A'}</span><span><b>Personal space</b><small>{user.role === 'admin' ? 'Administrator' : 'Traveler account'}</small></span><ChevronRight size={15} /></button><div className="sidebar-nav">{nav.map(group => <div key={group.label} className="nav-group"><div className="nav-label">{group.label}</div>{group.items.map(({ to, icon: Icon, name }) => <Link key={to} to={to} className={`side-link ${location.pathname === to ? 'active' : ''}`} onClick={() => mobileMenu && onMobileMenu()}><Icon size={17} /><span>{name}</span>{name === 'Wishlist' && workspace?.favorites?.length > 0 && <i>{workspace.favorites.length}</i>}</Link>)}</div>)}{user.role === 'admin' && <div className="nav-group"><div className="nav-label">PLATFORM</div><Link to="/app/admin" className={`side-link ${location.pathname === '/app/admin' ? 'active' : ''}`}><ShieldCheck size={17} /><span>Admin studio</span></Link></div>}</div><div className="sidebar-bottom"><div className="sidebar-tip"><span><Sparkles size={15} /></span><b>A little room for wonder</b><p>Save places that feel like a maybe.</p><button onClick={() => goTo('/app/destinations')}>Find inspiration <ArrowRight size={13} /></button></div><button className="profile-mini" onClick={() => goTo('/app/profile')}><span className="profile-avatar">{user.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'A'}</span><span><b>{user.name || 'Traveler'}</b><small>{user.email}</small></span><ChevronRight size={15} /></button></div></aside>
    <div className="workspace-main"><header className="workspace-topbar"><button aria-label="Open navigation" className="icon-button mobile-menu-button" onClick={onMobileMenu}><Menu size={19} /></button><div className="breadcrumbs"><span>My workspace</span><ChevronRight size={13} /><b>{location.pathname.split('/').pop()?.replace('-', ' ') || 'dashboard'}</b></div><div className="topbar-right"><div className={`data-mode ${workspace?.mode === 'demo' ? 'mode-demo' : ''}`}><span />{workspace?.mode === 'demo' ? 'DEMO DATA' : loading ? 'CONNECTING' : 'LIVE SYNC'}</div><div className="topbar-separator" /><button className="icon-button notification-button" aria-label={`Notifications${unreadNotices ? `, ${unreadNotices} unread` : ''}`} onClick={() => setNotificationOpen(!notificationOpen)}>{unreadNotices > 0 ? <span className="notification-count">{unreadNotices}</span> : <span className="notification-dot" />}<CalendarDays size={17} /></button><button className="topbar-user" onClick={() => goTo('/app/profile')}><span className="profile-avatar">{user.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'A'}</span><span>{user.name?.split(' ')[0] || 'Traveler'}</span></button>{notificationOpen && <div className="notification-popover"><div className="notification-heading"><b>Travel notes</b><span>{unreadNotices ? `${unreadNotices} unread` : 'All caught up'}</span></div>{notices.length ? notices.map(item => <button className={`notification-item ${item.readAt ? 'is-read' : ''}`} key={item._id} onClick={() => markNoticeRead(item)}><span className={`notice-symbol ${item.type?.startsWith('budget') ? 'notice-budget' : ''}`}>{item.type?.startsWith('budget') ? <Wallet size={14} /> : <CalendarDays size={14} />}</span><span><b>{item.title}</b><small>{item.body}</small></span>{!item.readAt && <i />}</button>) : <div className="notification-empty"><Sparkles size={16} /><span>No reminders right now. We’ll surface nearby activities and budget check-ins here.</span></div>}<small>In-app reminders from your saved plans</small></div>}</div></header>
      {workspace?.mode === 'demo' && <div className="demo-ribbon"><Sparkles size={13} /> You’re exploring sample demo data saved only in this browser. Connect MongoDB and sign in to use persistent personal records.</div>}
      <main className="workspace-content"><Routes>
        <Route path="dashboard" element={<Dashboard {...dashboardProps} workspace={workspace} loading={loading} />} />
        <Route path="destinations" element={<Destinations workspace={workspace} loading={loading} onFavorite={favorite} onPlan={startPlan} />} />
        <Route path="trips" element={<Trips workspace={workspace} onCreate={() => { setPendingPlan(null); setTripModal(true) }} onEdit={id => { const t = workspace?.trips?.find(x => x._id === id); setPendingPlan(t); setTripModal(true) }} onDelete={deleteTrip} onDuplicate={id => { const trip = workspace?.trips?.find(x => x._id === id); if (trip) { const start = new Date(); start.setDate(start.getDate() + 21); const end = new Date(start); end.setDate(end.getDate() + Math.max(2, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))); setPendingPlan({ ...trip, _id: undefined, name: `${trip.name} (copy)`, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }); setTripModal(true) } }} onShare={async id => { const share = await run(() => api.shareTrip(id), 'Read-only trip link created.'); if (share?.url) { await navigator.clipboard?.writeText(share.url).catch(() => {}); setToast({ type: 'success', message: 'Read-only link copied to clipboard.' }) } }} />} />
        <Route path="itinerary" element={<Itinerary workspace={workspace} onAdd={payload => run(() => api.createActivity(payload.trip, payload.data), 'Activity added to your itinerary.')} onUpdate={(id, p) => run(() => api.updateActivity(id, p), 'Activity updated.')} onDelete={id => { if (window.confirm('Remove this activity?')) run(() => api.deleteActivity(id), 'Activity removed.') }} onReorder={(tripId, ids) => run(() => api.reorderActivities(tripId, ids), 'Your day has been reordered.')} />} />
        <Route path="map" element={<MapPage workspace={workspace} />} />
        <Route path="expenses" element={<Expenses workspace={workspace} onCreate={() => setExpenseModal(true)} onDelete={deleteExpense} onUpdate={(id, p) => run(() => api.updateExpense(id, p), 'Expense updated.')} />} />
        <Route path="packing" element={<Packing workspace={workspace} onAdd={(tripId, payload) => run(() => api.addPacking(tripId, payload), 'Packing item added.')} onUpdate={(id, payload) => run(() => api.updatePacking(id, payload), 'Packing item updated.')} onToggle={(id, packed) => run(() => api.updatePacking(id, { packed }), 'Packing list updated.')} onDelete={id => run(() => api.deletePacking(id), 'Packing item removed.')} />} />
        <Route path="journal" element={<Journal workspace={workspace} onAdd={(tripId, payload) => run(() => api.addJournal(tripId, payload), 'Memory saved to your journal.')} onUpdate={(id, payload) => run(() => api.updateJournal(id, payload), 'Journal entry updated.')} onDelete={id => { if (window.confirm('Delete this journal entry?')) run(() => api.deleteJournal(id), 'Journal entry removed.') }} />} />
        <Route path="wishlist" element={<Wishlist workspace={workspace} onFavorite={favorite} onPlan={startPlan} />} />
        <Route path="profile" element={<Profile user={user} onSave={async p => { const updated = await run(() => api.updateProfile(p), 'Profile saved.'); localStorage.setItem(api.userKey, JSON.stringify(updated)); window.location.reload() }} onSignOut={onSignOut} />} />
        <Route path="admin" element={<Admin workspace={workspace} user={user} onRefresh={refresh} run={run} />} />
        <Route path="*" element={<Dashboard {...dashboardProps} workspace={workspace} loading={loading} />} />
      </Routes></main></div>
      {tripModal && <TripModal key={pendingPlan?._id || 'new'} initial={pendingPlan} destinations={workspace?.destinations || starterDestinations} onClose={() => setTripModal(false)} onSubmit={payload => run(() => pendingPlan?._id ? api.updateTrip(pendingPlan._id, payload) : api.createTrip(payload), pendingPlan?._id ? 'Trip details updated.' : 'Your trip has been created.').then(result => { if (result) setTripModal(false) })} />}
      {expenseModal && <ExpenseModal trips={workspace?.trips || []} onClose={() => setExpenseModal(false)} onSubmit={payload => run(() => api.createExpense(payload), 'Expense added to your records.').then(result => { if (result) setExpenseModal(false) })} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
  </div>
}

function TripModal({ initial, destinations, onClose, onSubmit }) {
  const today = new Date(); const dateValue = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
  const [form, setForm] = useState({ name: initial?.name || '', destinationName: initial?.destinationName || initial?.destination?.name || '', country: initial?.country || '', imageUrl: initial?.imageUrl || initial?.destination?.imageUrl || '', startDate: initial?.startDate?.slice(0, 10) || dateValue(14), endDate: initial?.endDate?.slice(0, 10) || dateValue(19), travelers: initial?.travelers || 2, budget: initial?.budget || 2500, currency: initial?.currency || 'USD', description: initial?.description || '' })
  const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const chooseDestination = e => { const destination = destinations.find(d => d.name === e.target.value); setForm(f => ({ ...f, destinationName: e.target.value, country: destination?.country || '', imageUrl: destination?.imageUrl || '' })) }
  const submit = async e => { e.preventDefault(); if (form.endDate < form.startDate) return; setBusy(true); await onSubmit({ ...form, travelers: Number(form.travelers), budget: Number(form.budget), destination: destinations.find(d => d.name === form.destinationName)?._id }); setBusy(false) }
  return <Modal title={initial?._id ? 'Edit your trip' : 'A new adventure'} subtitle="A few details to get your plans started." onClose={onClose}>
    <form className="modal-form" onSubmit={submit}><label>Trip name<input required minLength="2" maxLength="100" value={form.name} onChange={e => set('name', e.target.value)} placeholder="A week of slow mornings" /></label><div className="form-row"><label>Destination<select required value={form.destinationName} onChange={chooseDestination}><option value="">Choose a place</option>{destinations.map(d => <option key={d._id} value={d.name}>{d.name}, {d.country}</option>)}</select></label><label>Travelers<input required type="number" min="1" max="30" value={form.travelers} onChange={e => set('travelers', e.target.value)} /></label></div><div className="form-row"><label>Start date<input required type="date" min={initial?._id ? undefined : today.toISOString().slice(0, 10)} value={form.startDate} onChange={e => set('startDate', e.target.value)} /></label><label>End date<input required type="date" min={form.startDate} value={form.endDate} onChange={e => set('endDate', e.target.value)} /></label></div><div className="form-row"><label>Total budget<input type="number" required min="0" step="50" value={form.budget} onChange={e => set('budget', e.target.value)} /></label><label>Currency<select value={form.currency} onChange={e => set('currency', e.target.value)}>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'].map(x => <option key={x}>{x}</option>)}</select></label></div><label>A note for this trip <small className="optional">optional</small><textarea rows="2" maxLength="2000" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What are you looking forward to?" /></label><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><Button type="submit" disabled={busy} icon={ArrowRight}>{busy ? 'Saving…' : initial?._id ? 'Save changes' : 'Create trip'}</Button></div></form>
  </Modal>
}

function ExpenseModal({ trips, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', category: 'Food', amount: '', currency: 'USD', date: new Date().toISOString().slice(0, 10), paymentMethod: 'Card', trip: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const submit = async e => { e.preventDefault(); setBusy(true); await onSubmit({ ...form, amount: Number(form.amount), trip: form.trip || undefined }); setBusy(false) }
  return <Modal title="Add an expense" subtitle="Keep your travel spending in view." onClose={onClose}>
    <form className="modal-form" onSubmit={submit}><label>What was it for?<input autoFocus required maxLength="120" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="A lovely little lunch" /></label><div className="form-row"><label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></label><label>Currency<select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'].map(x => <option key={x}>{x}</option>)}</select></label></div><div className="form-row"><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Flights', 'Accommodation', 'Food', 'Transportation', 'Activities', 'Shopping', 'Miscellaneous'].map(x => <option key={x}>{x}</option>)}</select></label><label>Date<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label></div><div className="form-row"><label>Related trip<select value={form.trip} onChange={e => { const trip = trips.find(x => x._id === e.target.value); setForm({ ...form, trip: e.target.value, currency: trip?.currency || form.currency }) }}><option value="">Not linked to a trip</option>{trips.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label><label>Payment method<select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>{['Card', 'Cash', 'Bank transfer', 'Digital wallet', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label></div><label>Notes <small className="optional">optional</small><textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add a little context" /></label><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><Button type="submit" disabled={busy} icon={Check}>{busy ? 'Saving…' : 'Save expense'}</Button></div></form>
  </Modal>
}

function SharedPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const [trip, setTrip] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(true)
  useEffect(() => {
    if (token === 'demo') {
      try { const data = JSON.parse(localStorage.getItem('voyage3d-demo-records') || '{}'); const item = data.trips?.find(t => t._id === searchParams.get('trip')); if (item) { setTrip({ ...item, activities: (data.activities || []).filter(a => a.trip === item._id) }); setBusy(false); return } } catch { /* fall through to unavailable state */ }
    }
    fetch(`/api/shared/${token}`).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'This shared trip is unavailable.'); return d.trip }).then(setTrip).catch(e => setError(e.message)).finally(() => setBusy(false))
  }, [token, searchParams])
  return <div className="shared-page"><div className="shared-top"><Link to="/"><Brand /></Link><span>READ-ONLY TRIP PREVIEW</span></div>{busy ? <p className="shared-message">Opening trip…</p> : error ? <div className="shared-message"><Compass size={27} /><h1>Trip link unavailable</h1><p>{error}</p><Link to="/" className="text-link">Back to Voyage <ArrowRight size={15} /></Link></div> : <div className="shared-card"><img src={trip.imageUrl || trip.destination?.imageUrl} alt={trip.destinationName} /><span className="eyebrow">SHARED WITH YOU</span><h1>{trip.name}</h1><p><MapPin size={15} /> {trip.destinationName}, {trip.country}</p><p><CalendarDays size={15} /> {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</p><div className="shared-days">{(trip.activities || []).map(a => <div key={a._id}><span>{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><b>{a.name}</b><small>{a.startTime} {a.location && `· ${a.location}`}</small></div>)}</div><small className="shared-readonly">This is a read-only trip link. Only the trip owner can make changes.</small></div>}</div>
}
