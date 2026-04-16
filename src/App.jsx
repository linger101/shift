import { useState, useEffect, useCallback } from 'react'
import { BARS, ALL_TYPES, ALL_VIBES, ALL_AREAS, PRICE_LABELS } from './data/bars'
import BarMap from './components/BarMap'
import * as db from './lib/supabase'

// ─── Shared Components ───

function Stars({ r, onRate, sz = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 1, cursor: onRate ? 'pointer' : 'default' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)} style={{ fontSize: sz, color: s <= r ? 'var(--gold)' : 'var(--bd-light)', transition: 'color .15s' }}>★</span>
      ))}
    </div>
  )
}

function Chip({ children, active, onClick, variant = 'default' }) {
  const styles = {
    default: { bg: active ? 'var(--green)' : 'rgba(200,169,110,0.08)', c: active ? '#fff' : 'var(--text-dim)', bd: active ? 'var(--green-bright)' : 'var(--bd)' },
    type: { bg: active ? 'rgba(74,103,65,0.25)' : 'rgba(200,169,110,0.06)', c: active ? 'var(--green)' : 'var(--text-dim)', bd: active ? 'var(--green-dim)' : 'var(--bd)' },
    vibe: { bg: active ? 'rgba(200,169,110,0.2)' : 'rgba(200,169,110,0.06)', c: active ? 'var(--gold)' : 'var(--text-dim)', bd: active ? 'var(--gold-dim)' : 'var(--bd)' },
  }
  const s = styles[variant]
  return (
    <button onClick={onClick} style={{
      padding: '5px 13px', borderRadius: 4, border: `1px solid ${s.bd}`, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.c, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-display)', letterSpacing: '0.3px', textTransform: 'uppercase'
    }}>{children}</button>
  )
}

// ─── Bar Card ───

function BarCard({ bar, user, reviews, onFav, onOpen }) {
  const isFav = user?.favorites?.includes(bar.id)
  const uRevs = reviews.filter(r => r.bar_id === bar.id)
  const avg = uRevs.length ? (uRevs.reduce((a, r) => a + r.rating, 0) / uRevs.length) : null
  const [hov, setHov] = useState(false)

  return (
    <div onClick={() => onOpen(bar)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg-hover)' : 'var(--bg-card)', borderRadius: 4, padding: '18px 20px',
        cursor: 'pointer', border: `1px solid ${hov ? 'var(--gold-dim)' : 'var(--bd)'}`,
        transition: 'all .25s', borderLeft: `3px solid ${hov ? 'var(--gold)' : 'var(--green)'}`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{bar.name}</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>{bar.hood} · {bar.area}</p>
        </div>
        {user && (
          <button onClick={e => { e.stopPropagation(); onFav(bar.id) }} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: isFav ? 'var(--gold)' : 'var(--bd-light)', padding: 0, transition: 'color .2s'
          }}>{isFav ? '★' : '☆'}</button>
        )}
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.55 }}>{bar.desc}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        <span style={{ background: 'rgba(74,103,65,0.12)', color: 'var(--green)', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(74,103,65,0.2)' }}>{bar.type}</span>
        <span style={{ background: 'rgba(200,169,110,0.1)', color: 'var(--gold-dim)', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', border: '1px solid rgba(200,169,110,0.15)' }}>{PRICE_LABELS[bar.price]}</span>
        {bar.music && <span style={{ background: 'rgba(160,82,45,0.1)', color: 'var(--red-bright)', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(160,82,45,0.15)' }}>♪ Live</span>}
        {bar.karaoke && <span style={{ background: 'rgba(139,118,71,0.1)', color: 'var(--gold-dim)', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(139,118,71,0.2)' }}>🎤 Karaoke</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
        {bar.vibe.slice(0, 4).map(v => (
          <span key={v} style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-faint)', padding: '2px 7px', borderRadius: 3, fontSize: 9, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{v}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars r={Math.round(bar.rating)} sz={13} />
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-display)' }}>{bar.rating} · {bar.revCt.toLocaleString()}</span>
        </div>
        {avg !== null && <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Friends: {avg.toFixed(1)}★</span>}
      </div>
    </div>
  )
}

// ─── Detail Modal ───

function Detail({ bar, user, reviews, onClose, onFav, onReview }) {
  const [txt, setTxt] = useState('')
  const [rt, setRt] = useState(0)
  const bRevs = reviews.filter(r => r.bar_id === bar.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const isFav = user?.favorites?.includes(bar.id)

  const submit = async () => {
    if (!rt || !txt.trim()) return
    await onReview({ bar_id: bar.id, user_id: user.id, username: user.username, rating: rt, text: txt.trim() })
    setTxt(''); setRt(0)
  }

  const m = { bg: '#1C1710', card: '#251F17', bd: '#3D3425', tx: '#E8DCC8', txD: '#B8A88E', txF: '#7A6E5E' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 30, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: m.bg, borderRadius: 6, width: '100%', maxWidth: 520, maxHeight: '88vh', overflow: 'auto', border: `1px solid ${m.bd}`, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: m.tx, fontFamily: 'var(--font-display)' }}>{bar.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: m.txF, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{bar.hood} · {bar.area}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {user && <button onClick={() => onFav(bar.id)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: isFav ? '#C8A96E' : '#4A3D2E' }}>{isFav ? '★' : '☆'}</button>}
            <button onClick={onClose} style={{ background: m.card, border: `1px solid ${m.bd}`, width: 30, height: 30, borderRadius: 4, color: m.txD, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>
        <p style={{ color: m.txD, lineHeight: 1.65, fontSize: 14, margin: '0 0 16px' }}>{bar.desc}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <span style={{ background: 'rgba(74,103,65,0.3)', color: '#6B9B5E', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid #3A5233' }}>{bar.type}</span>
          <span style={{ background: 'rgba(200,169,110,0.15)', color: '#C8A96E', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', border: '1px solid rgba(200,169,110,0.25)' }}>{PRICE_LABELS[bar.price]}</span>
          {bar.music && <span style={{ background: 'rgba(160,82,45,0.2)', color: '#C0623A', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(160,82,45,0.3)' }}>♪ Live Music</span>}
          {bar.karaoke && <span style={{ background: 'rgba(139,118,71,0.15)', color: '#C8A96E', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(139,118,71,0.25)' }}>🎤 Karaoke</span>}
          {bar.vibe.map(v => <span key={v} style={{ background: 'rgba(200,169,110,0.08)', color: m.txF, padding: '4px 10px', borderRadius: 3, fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{v}</span>)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '12px 16px', background: m.card, borderRadius: 4, border: `1px solid ${m.bd}` }}>
          <Stars r={Math.round(bar.rating)} sz={18} />
          <span style={{ fontSize: 15, color: m.tx, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{bar.rating}</span>
          <span style={{ fontSize: 12, color: m.txF }}>({bar.revCt.toLocaleString()} Google reviews)</span>
        </div>

        {user && (
          <div style={{ marginBottom: 20, padding: 16, background: m.card, borderRadius: 4, border: `1px solid ${m.bd}` }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#C8A96E', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Leave a Review</p>
            <Stars r={rt} onRate={setRt} sz={22} />
            <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="What did you think?"
              style={{ width: '100%', marginTop: 8, padding: 10, background: 'rgba(200,169,110,0.08)', border: `1px solid ${m.bd}`, borderRadius: 4, color: m.tx, fontSize: 13, resize: 'vertical', minHeight: 60, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
            <button onClick={submit} disabled={!rt || !txt.trim()} style={{
              marginTop: 8, padding: '8px 24px', background: rt && txt.trim() ? '#4A6741' : '#333',
              color: rt && txt.trim() ? '#E8DCC8' : '#666', border: 'none', borderRadius: 4, fontWeight: 700,
              cursor: rt && txt.trim() ? 'pointer' : 'default', fontSize: 12,
              fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px'
            }}>Post Review</button>
          </div>
        )}

        {bRevs.length > 0 && (
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#C8A96E', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Friend Reviews ({bRevs.length})</p>
            {bRevs.map((r, i) => (
              <div key={i} style={{ padding: 12, marginBottom: 6, background: 'rgba(200,169,110,0.06)', borderRadius: 4, borderLeft: '2px solid #8B7647' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C8A96E', fontFamily: 'var(--font-display)' }}>@{r.username}</span>
                  <Stars r={r.rating} sz={12} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: m.txD, lineHeight: 1.5 }}>{r.text}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: m.txF }}>{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Auth Screen ───

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [username, setUsername] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const go = async () => {
    if (!email.trim() || !pw.trim()) { setErr('Fill in all fields'); return }
    if (mode === 'signup' && !username.trim()) { setErr('Username is required'); return }
    setLoading(true); setErr('')

    if (mode === 'signup') {
      const res = await db.signUp(email, pw, username)
      if (res.error) { setErr(res.error); setLoading(false); return }
      onLogin(res.user)
    } else {
      const res = await db.signIn(email, pw)
      if (res.error) { setErr(res.error); setLoading(false); return }
      onLogin(res.user)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-block', padding: '16px 40px', border: '2px solid var(--gold)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--gold-dim)' }}>Est. 2025</p>
            <h1 style={{ margin: '2px 0', fontSize: 32, fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 700 }}>BARCRAWL</h1>
            <p style={{ margin: 0, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Boston</p>
          </div>
        </div>
        <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: '0 0 24px' }}>Discover. Rate. Share with friends.</p>

        <div style={{ display: 'flex', marginBottom: 16, border: '1px solid var(--bd)', borderRadius: 4, overflow: 'hidden' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr('') }} style={{
              flex: 1, padding: '10px 0', background: mode === m ? 'rgba(74,103,65,0.1)' : 'transparent',
              border: 'none', color: mode === m ? 'var(--green)' : 'var(--text-faint)', fontWeight: 700,
              cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', textTransform: 'uppercase',
              letterSpacing: '1.5px', borderRight: m === 'login' ? '1px solid var(--bd)' : 'none'
            }}>{m === 'signup' ? 'Sign Up' : 'Log In'}</button>
          ))}
        </div>

        {mode === 'signup' && (
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
            style={{ width: '100%', padding: '11px 14px', marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          style={{ width: '100%', padding: '11px 14px', marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && go()}
          style={{ width: '100%', padding: '11px 14px', marginBottom: 12, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />

        {err && <p style={{ color: 'var(--red-bright)', fontSize: 12, margin: '0 0 8px' }}>{err}</p>}

        <button onClick={go} disabled={loading} style={{
          width: '100%', padding: '12px 0', background: 'var(--green)', border: 'none', borderRadius: 4,
          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1.5px'
        }}>{loading ? '...' : mode === 'signup' ? 'Create Account' : 'Log In'}</button>

        <button onClick={() => onLogin(null)} style={{
          background: 'none', border: 'none', color: 'var(--text-faint)', marginTop: 14,
          cursor: 'pointer', fontSize: 12
        }}>Browse without an account →</button>
      </div>
    </div>
  )
}

// ─── Main App ───

export default function App() {
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [showAuth, setShowAuth] = useState(true)
  const [reviews, setReviews] = useState([])
  const [search, setSearch] = useState('')

  // Applied filter state
  const [selTypes, setSelTypes] = useState([])
  const [selVibes, setSelVibes] = useState([])
  const [selAreas, setSelAreas] = useState([])
  const [minRat, setMinRat] = useState(0)
  const [musicOnly, setMusicOnly] = useState(false)
  const [karaokeOnly, setKaraokeOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')

  // Draft filter state (shown in panel before Apply is clicked)
  const [draftTypes, setDraftTypes] = useState([])
  const [draftVibes, setDraftVibes] = useState([])
  const [draftAreas, setDraftAreas] = useState([])
  const [draftMinRat, setDraftMinRat] = useState(0)
  const [draftMusicOnly, setDraftMusicOnly] = useState(false)
  const [draftKaraokeOnly, setDraftKaraokeOnly] = useState(false)
  const [draftSortBy, setDraftSortBy] = useState('rating')

  const [detail, setDetail] = useState(null)
  const [tab, setTab] = useState('discover')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState('list')

  // Friends state
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friendSearch, setFriendSearch] = useState('')
  const [friendResults, setFriendResults] = useState([])

  // Load session + data
  useEffect(() => {
    (async () => {
      const session = await db.getSession()
      if (session?.user) {
        setUser(session.user)
        const p = await db.getProfile(session.user.id)
        if (p) setProfile(p)
        setShowAuth(false)
        const { accepted, incoming, outgoing } = await db.getFriendships(session.user.id)
        setFriends(accepted)
        setFriendRequests(incoming)
        setOutgoingRequests(outgoing)
      }
      const r = await db.getReviews()
      setReviews(r)
    })()
  }, [])

  const handleLogin = useCallback(async (u) => {
    if (!u) { setUser(null); setShowAuth(false); return }
    setUser(u)
    const p = await db.getProfile(u.id)
    setProfile(p)
    setShowAuth(false)
    const { accepted, incoming, outgoing } = await db.getFriendships(u.id)
    setFriends(accepted)
    setFriendRequests(incoming)
    setOutgoingRequests(outgoing)
  }, [])

  const logout = useCallback(async () => {
    await db.signOut()
    setUser(undefined); setProfile(null); setShowAuth(true)
    setFriends([]); setFriendRequests([]); setOutgoingRequests([])
  }, [])

  const toggleFav = useCallback(async (barId) => {
    if (!profile) return
    const newFavs = profile.favorites.includes(barId)
      ? profile.favorites.filter(f => f !== barId)
      : [...profile.favorites, barId]
    const updated = { ...profile, favorites: newFavs }
    setProfile(updated)
    await db.updateFavorites(profile.id, newFavs)
  }, [profile])

  const postReview = useCallback(async (review) => {
    const r = await db.addReview(review)
    if (r) setReviews(prev => [r, ...prev])
  }, [])

  const openFilters = () => {
    setDraftTypes(selTypes)
    setDraftVibes(selVibes)
    setDraftAreas(selAreas)
    setDraftMinRat(minRat)
    setDraftMusicOnly(musicOnly)
    setDraftKaraokeOnly(karaokeOnly)
    setDraftSortBy(sortBy)
    setShowFilters(true)
  }

  const applyFilters = () => {
    setSelTypes(draftTypes)
    setSelVibes(draftVibes)
    setSelAreas(draftAreas)
    setMinRat(draftMinRat)
    setMusicOnly(draftMusicOnly)
    setKaraokeOnly(draftKaraokeOnly)
    setSortBy(draftSortBy)
    setShowFilters(false)
  }

  const clearDraftFilters = () => {
    setDraftTypes([]); setDraftVibes([]); setDraftAreas([])
    setDraftMinRat(0); setDraftMusicOnly(false); setDraftKaraokeOnly(false); setDraftSortBy('rating')
  }

  const searchFriends = async () => {
    if (!friendSearch.trim()) return
    setFriendResults(await db.searchUsers(friendSearch))
  }

  const addFriend = async (addresseeId) => {
    if (!profile) return
    await db.sendFriendRequest(profile.id, addresseeId)
    setOutgoingRequests(prev => [...prev, addresseeId])
    setFriendResults([])
    setFriendSearch('')
  }

  const acceptFriend = async (req) => {
    await db.updateFriendship(req.id, 'accepted')
    setFriendRequests(prev => prev.filter(r => r.id !== req.id))
    setFriends(prev => [...prev, req.requester])
  }

  const declineFriend = async (req) => {
    await db.updateFriendship(req.id, 'declined')
    setFriendRequests(prev => prev.filter(r => r.id !== req.id))
  }

  const tog = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])

  if (showAuth) return <Auth onLogin={handleLogin} />

  const userData = profile ? { ...profile, username: profile.username } : null

  // Filter
  let filtered = BARS.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.hood.toLowerCase().includes(search.toLowerCase()) && !b.area.toLowerCase().includes(search.toLowerCase())) return false
    if (selTypes.length && !selTypes.includes(b.type)) return false
    if (selVibes.length && !selVibes.some(v => b.vibe.includes(v))) return false
    if (selAreas.length && !selAreas.includes(b.area)) return false
    if (minRat && b.rating < minRat) return false
    if (musicOnly && !b.music) return false
    if (karaokeOnly && !b.karaoke) return false
    if (favOnly && userData && !userData.favorites?.includes(b.id)) return false
    return true
  })

  if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating)
  else if (sortBy === 'reviews') filtered.sort((a, b) => b.revCt - a.revCt)
  else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
  else if (sortBy === 'price') filtered.sort((a, b) => a.price - b.price)

  const afc = selTypes.length + selVibes.length + selAreas.length + (minRat ? 1 : 0) + (musicOnly ? 1 : 0) + (karaokeOnly ? 1 : 0) + (favOnly ? 1 : 0)
  const draftAfc = draftTypes.length + draftVibes.length + draftAreas.length + (draftMinRat ? 1 : 0) + (draftMusicOnly ? 1 : 0) + (draftKaraokeOnly ? 1 : 0)

  const friendIds = new Set(friends.map(f => f.id))
  const friendReviews = reviews.filter(r => friendIds.has(r.user_id)).slice(0, 20)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '10px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }}>BARCRAWL</h1>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Boston</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {userData && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>@{userData.username}</span>}
              <button onClick={logout} style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', padding: '5px 12px', borderRadius: 4, color: 'var(--text-faint)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>{userData ? 'Logout' : 'Sign In'}</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 8, border: '1px solid var(--bd)', borderRadius: 4, overflow: 'hidden' }}>
            {[{ id: 'discover', l: 'Discover' }, { id: 'favorites', l: 'Favorites' }, { id: 'activity', l: 'Friends' }].map((t, i) => (
              <button key={t.id} onClick={() => {
                setTab(t.id)
                setShowFilters(false)
                if (t.id === 'favorites') setFavOnly(true)
                else setFavOnly(false)
              }} style={{
                flex: 1, padding: '8px 0', background: tab === t.id ? 'rgba(74,103,65,0.1)' : 'transparent',
                border: 'none', borderRight: i < 2 ? '1px solid var(--bd)' : 'none',
                color: tab === t.id ? 'var(--green)' : 'var(--text-faint)', fontWeight: 700, cursor: 'pointer',
                fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1.5px',
                position: 'relative'
              }}>
                {t.l}
                {t.id === 'activity' && friendRequests.length > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 8, background: 'var(--red-bright)', color: '#fff',
                    borderRadius: '50%', width: 14, height: 14, fontSize: 9, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                  }}>{friendRequests.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab !== 'activity' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bars, neighborhoods..."
                  style={{ width: '100%', padding: '9px 32px 9px 14px', background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--text)', fontSize: 13 }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer',
                    fontSize: 14, padding: 0, lineHeight: 1
                  }}>✕</button>
                )}
              </div>
              <button onClick={() => setView(view === 'list' ? 'map' : 'list')} style={{
                padding: '9px 14px', background: view === 'map' ? 'rgba(74,103,65,0.1)' : 'var(--bg-card)',
                border: `1px solid ${view === 'map' ? 'var(--green-dim)' : 'var(--bd)'}`, borderRadius: 4,
                color: view === 'map' ? 'var(--green)' : 'var(--text-faint)', cursor: 'pointer', fontSize: 12,
                fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'var(--font-display)'
              }}>{view === 'map' ? '⊞ List' : '📍 Map'}</button>
              <button onClick={showFilters ? () => setShowFilters(false) : openFilters} style={{
                padding: '9px 14px', background: afc ? 'rgba(200,169,110,0.1)' : 'var(--bg-card)',
                border: `1px solid ${afc ? 'var(--gold-dim)' : 'var(--bd)'}`, borderRadius: 4,
                color: afc ? 'var(--gold)' : 'var(--text-faint)', cursor: 'pointer', fontWeight: 700,
                fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'var(--font-display)'
              }}>⚙{afc ? ` ${afc}` : ''}</button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && tab !== 'activity' && (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 12px', borderTop: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 10, alignItems: 'center' }}>
              <button onClick={applyFilters} style={{
                padding: '9px 28px', background: 'var(--green)', border: 'none', borderRadius: 4,
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 11,
                fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px'
              }}>Apply{draftAfc > 0 ? ` (${draftAfc})` : ''}</button>
              {draftAfc > 0 && (
                <button onClick={clearDraftFilters} style={{
                  background: 'none', border: '1px solid rgba(160,82,45,0.3)', padding: '9px 16px', borderRadius: 4,
                  color: 'var(--red-bright)', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase'
                }}>Clear</button>
              )}
            </div>
            <div style={{ margin: '8px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '2px' }}>Sort By</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ v: 'rating', l: 'Top Rated' }, { v: 'reviews', l: 'Most Popular' }, { v: 'name', l: 'A–Z' }, { v: 'price', l: 'Price ↑' }].map(s => (
                  <Chip key={s.v} active={draftSortBy === s.v} onClick={() => setDraftSortBy(s.v)} variant="type">{s.l}</Chip>
                ))}
              </div>
            </div>
            <div style={{ margin: '8px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '2px' }}>Area</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{ALL_AREAS.map(a => <Chip key={a} active={draftAreas.includes(a)} onClick={() => tog(draftAreas, setDraftAreas, a)}>{a}</Chip>)}</div>
            </div>
            <div style={{ margin: '8px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '2px' }}>Bar Type</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{ALL_TYPES.map(t => <Chip key={t} active={draftTypes.includes(t)} onClick={() => tog(draftTypes, setDraftTypes, t)} variant="type">{t}</Chip>)}</div>
            </div>
            <div style={{ margin: '8px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '2px' }}>Vibe</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{ALL_VIBES.map(v => <Chip key={v} active={draftVibes.includes(v)} onClick={() => tog(draftVibes, setDraftVibes, v)} variant="vibe">{v}</Chip>)}</div>
            </div>
            <div style={{ margin: '8px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '2px' }}>Min Rating</p>
              <div style={{ display: 'flex', gap: 4 }}>{[0, 3.5, 4.0, 4.3, 4.5].map(r => <Chip key={r} active={draftMinRat === r} onClick={() => setDraftMinRat(r)}>{r === 0 ? 'Any' : `${r}+`}</Chip>)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <Chip active={draftMusicOnly} onClick={() => setDraftMusicOnly(!draftMusicOnly)} variant="vibe">♪ Live Music</Chip>
              <Chip active={draftKaraokeOnly} onClick={() => setDraftKaraokeOnly(!draftKaraokeOnly)} variant="vibe">🎤 Karaoke</Chip>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: tab === 'activity' || view === 'list' ? '12px 16px 80px' : '0' }}>
        {tab === 'activity' ? (
          <div>
            <h2 style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 16px' }}>FRIENDS</h2>

            {!userData ? (
              <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sign in to add friends and see their reviews.</p>
            ) : (
              <>
                {/* Pending Requests */}
                {friendRequests.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', margin: '0 0 8px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Requests ({friendRequests.length})</p>
                    {friendRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', marginBottom: 6, background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--bd)', borderLeft: '2px solid var(--gold-dim)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>@{req.requester?.username}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => acceptFriend(req)} style={{ padding: '5px 12px', background: 'var(--green)', border: 'none', borderRadius: 3, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Accept</button>
                          <button onClick={() => declineFriend(req)} style={{ padding: '5px 12px', background: 'none', border: '1px solid var(--bd)', borderRadius: 3, color: 'var(--text-faint)', fontWeight: 700, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Friend */}
                <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--bd)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 10px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Add Friend</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={friendSearch} onChange={e => setFriendSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchFriends()} placeholder="Search by username..."
                      style={{ flex: 1, padding: '8px 12px', background: '#fff', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--text)', fontSize: 13 }} />
                    <button onClick={searchFriends} style={{ padding: '8px 16px', background: 'var(--green)', border: 'none', borderRadius: 4, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Search</button>
                  </div>
                  {friendResults.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {friendResults.filter(u => u.id !== profile?.id).map(u => {
                        const isFriend = friends.some(f => f.id === u.id)
                        const isPending = outgoingRequests.includes(u.id)
                        return (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--bd)' }}>
                            <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>@{u.username}</span>
                            {isFriend ? (
                              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Friends ✓</span>
                            ) : isPending ? (
                              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Pending</span>
                            ) : (
                              <button onClick={() => addFriend(u.id)} style={{ padding: '4px 12px', background: 'var(--green)', border: 'none', borderRadius: 3, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Add</button>
                            )}
                          </div>
                        )
                      })}
                      {friendResults.filter(u => u.id !== profile?.id).length === 0 && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-faint)' }}>No users found.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Friends */}
                {friends.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 8px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Friends ({friends.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {friends.map(f => (
                        <span key={f.id} style={{ padding: '4px 12px', background: 'rgba(74,103,65,0.1)', border: '1px solid var(--green-dim)', borderRadius: 3, fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>@{f.username}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friend Activity */}
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 10px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Friend Activity</p>
                {friends.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Add friends above to see their bar reviews here.</p>}
                {friends.length > 0 && friendReviews.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No reviews from friends yet.</p>}
                {friendReviews.map((r, i) => {
                  const bar = BARS.find(b => b.id === r.bar_id)
                  return (
                    <div key={i} onClick={() => bar && setDetail(bar)} style={{
                      padding: 14, marginBottom: 6, background: 'var(--bg-card)', borderRadius: 4,
                      border: '1px solid var(--bd)', cursor: 'pointer', borderLeft: '2px solid var(--gold-dim)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>@{r.username}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{bar?.name || 'Unknown'}</span>
                        <Stars r={r.rating} sz={12} />
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4 }}>{r.text}</p>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        ) : view === 'map' ? (
          <div style={{ height: 'calc(100vh - 160px)', padding: '8px 16px 16px' }}>
            <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bd)' }}>
              <BarMap bars={filtered} user={userData} onOpen={setDetail} />
            </div>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>{filtered.length} establishment{filtered.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(bar => (
                <BarCard key={bar.id} bar={bar} user={userData} reviews={reviews} onFav={toggleFav} onOpen={setDetail} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text-faint)' }}>No establishments match your taste. Try loosening the filters.</p>
              </div>
            )}
          </>
        )}
      </div>

      {detail && <Detail bar={detail} user={userData} reviews={reviews} onClose={() => setDetail(null)} onFav={toggleFav} onReview={postReview} />}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', textAlign: 'center', borderTop: '1px solid var(--bd)' }}>
        <p style={{ margin: 0, fontSize: 9, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '3px' }}>BarCrawl Boston · Est. 2025 · {BARS.length} Establishments</p>
      </div>
    </div>
  )
}
