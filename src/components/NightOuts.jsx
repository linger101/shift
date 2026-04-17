import { useState, useEffect, useCallback } from 'react'
import { BARS } from '../data/bars'
import * as db from '../lib/supabase'

const labelStyle = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
  margin: '0 0 10px', fontFamily: 'var(--font-display)',
  textTransform: 'uppercase', letterSpacing: '1px',
}

const cardStyle = {
  padding: '14px 16px', marginBottom: 8, background: 'var(--bg-card)',
  borderRadius: 8, border: '1px solid var(--bd)',
}

const primaryBtn = {
  padding: '8px 16px', background: 'var(--green)', border: 'none', borderRadius: 6,
  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 11,
  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px',
}

const ghostBtn = {
  padding: '8px 14px', background: 'none', border: '1px solid var(--bd)', borderRadius: 6,
  color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer', fontSize: 11,
  fontFamily: 'var(--font-display)', textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%', padding: '10px 12px', background: '#fff', border: '1px solid var(--bd)',
  borderRadius: 6, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
}

export default function NightOuts({ profile, friends, onOpenBar, targetNightId, onTargetConsumed }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const refresh = useCallback(async () => {
    if (!profile) return
    const data = await db.getNightOuts(profile.id)
    setList(data)
    setLoading(false)
  }, [profile])

  useEffect(() => { refresh() }, [refresh])

  // Deep-link: if parent passed a targetNightId (from an invite redeem), open it
  useEffect(() => {
    if (targetNightId && targetNightId !== selectedId) {
      setSelectedId(targetNightId)
      onTargetConsumed?.()
    }
  }, [targetNightId, selectedId, onTargetConsumed])

  useEffect(() => {
    if (!profile) return
    const unsub = db.subscribeToNightOutList(profile.id, () => refresh())
    return unsub
  }, [profile, refresh])

  if (!profile) return null

  if (selectedId) {
    return (
      <NightOutDetail
        nightOutId={selectedId}
        profile={profile}
        friends={friends}
        onBack={() => { setSelectedId(null); refresh() }}
        onOpenBar={onOpenBar}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={labelStyle}>Your Night Outs</p>
        <button onClick={() => setShowCreate(v => !v)} style={primaryBtn}>
          {showCreate ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showCreate && (
        <CreateNightOut
          profile={profile}
          onCreated={(n) => { setShowCreate(false); setSelectedId(n.id); refresh() }}
        />
      )}

      {loading && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Loading...</p>}
      {!loading && list.length === 0 && !showCreate && (
        <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
          No night outs yet. Start one and invite friends to vote on where to go.
        </p>
      )}

      {list.map(n => (
        <div key={n.id} onClick={() => setSelectedId(n.id)} style={{ ...cardStyle, cursor: 'pointer', borderLeft: '3px solid var(--green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{n.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-faint)' }}>
                {n.night_date ? new Date(n.night_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date set'}
                {n.creator_id === profile.id ? ' · You created' : ''}
              </p>
            </div>
            <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {n.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CreateNightOut({ profile, onCreated }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    const n = await db.createNightOut({ creatorId: profile.id, name: name.trim(), nightDate: date || null })
    setSaving(false)
    if (n) onCreated(n)
  }

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <p style={labelStyle}>Create a Night Out</p>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. Saturday in Southie"
        style={{ ...inputStyle, marginBottom: 8 }}
      />
      <input
        type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />
      <button onClick={submit} disabled={!name.trim() || saving} style={{
        ...primaryBtn,
        background: name.trim() && !saving ? 'var(--green)' : '#bbb',
        cursor: name.trim() && !saving ? 'pointer' : 'default',
      }}>
        {saving ? 'Creating...' : 'Create'}
      </button>
    </div>
  )
}

function NightOutDetail({ nightOutId, profile, friends, onBack, onOpenBar }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingPick, setAddingPick] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  const refresh = useCallback(async () => {
    const d = await db.getNightOutDetail(nightOutId)
    setData(d)
    setLoading(false)
  }, [nightOutId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const unsub = db.subscribeToNightOut(nightOutId, () => refresh())
    return unsub
  }, [nightOutId, refresh])

  if (loading || !data) {
    return (
      <div>
        <BackBtn onBack={onBack} />
        <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Loading...</p>
      </div>
    )
  }

  const { night, creator, members, picks, votes } = data
  const isCreator = night.creator_id === profile.id
  const memberIds = new Set(members.map(m => m.user_id))

  const handleAddPick = async (barId) => {
    await db.addNightOutPick(nightOutId, profile.id, barId)
    setAddingPick(false)
    refresh()
  }

  const handleRemovePick = async (pickId) => {
    await db.removeNightOutPick(pickId)
    refresh()
  }

  const handleVote = async (barId, value) => {
    const existing = votes.find(v => v.user_id === profile.id && v.bar_id === barId)
    if (existing && existing.value === value) {
      await db.clearNightOutVote(nightOutId, profile.id, barId)
    } else {
      await db.castNightOutVote(nightOutId, profile.id, barId, value)
    }
    refresh()
  }

  const handleAddMember = async (friendId) => {
    await db.addNightOutMember(nightOutId, friendId, profile.id)
    setAddingMember(false)
    refresh()
  }

  const handleRemoveMember = async (memberRow) => {
    await db.removeNightOutMember(memberRow.id)
    refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this night out?')) return
    await db.deleteNightOut(nightOutId)
    onBack()
  }

  // Picks sorted by score (upvotes - downvotes)
  const scored = picks.map(p => {
    const barVotes = votes.filter(v => v.bar_id === p.bar_id)
    const up = barVotes.filter(v => v.value === 1).length
    const down = barVotes.filter(v => v.value === -1).length
    const myVote = barVotes.find(v => v.user_id === profile.id)?.value || 0
    return { ...p, up, down, score: up - down, myVote }
  }).sort((a, b) => b.score - a.score)

  const addableFriends = friends.filter(f => !memberIds.has(f.id))
  const pickedBarIds = new Set(picks.map(p => p.bar_id))
  const addableBars = BARS.filter(b => !pickedBarIds.has(b.id))

  return (
    <div>
      <BackBtn onBack={onBack} />

      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{night.name}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-faint)' }}>
              {night.night_date ? new Date(night.night_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date set'}
              {' · Started by @'}{creator?.username || '…'}
            </p>
          </div>
          {isCreator && (
            <button onClick={handleDelete} style={{ ...ghostBtn, borderColor: 'rgba(160,82,45,0.35)', color: 'var(--red-bright)' }}>
              Delete
            </button>
          )}
        </div>
        <InviteLinkRow night={night} isCreator={isCreator} onRegenerated={refresh} />
      </div>

      {/* Members */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ ...labelStyle, margin: 0 }}>In the group ({members.length})</p>
          <button onClick={() => setAddingMember(v => !v)} style={primaryBtn}>
            {addingMember ? 'Cancel' : '+ Invite'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {members.map(m => (
            <span key={m.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', background: 'rgba(74,103,65,0.1)',
              color: 'var(--green)', borderRadius: 20, fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-display)',
              border: `1px solid ${m.user_id === night.creator_id ? 'var(--gold-dim)' : 'rgba(74,103,65,0.3)'}`,
            }}>
              @{m.username}
              {m.user_id === night.creator_id && <span style={{ fontSize: 9, color: 'var(--gold)' }}>HOST</span>}
              {(isCreator || m.user_id === profile.id) && m.user_id !== night.creator_id && (
                <button onClick={() => handleRemoveMember(m)} style={{
                  background: 'none', border: 'none', color: 'var(--text-faint)',
                  cursor: 'pointer', padding: 0, fontSize: 12, marginLeft: 2,
                }}>✕</button>
              )}
            </span>
          ))}
        </div>

        {addingMember && (
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            {addableFriends.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)' }}>
                All your friends are already in this group.
              </p>
            ) : (
              addableFriends.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--bd)' }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-display)' }}>@{f.username}</span>
                  <button onClick={() => handleAddMember(f.id)} style={primaryBtn}>Add</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Picks + voting */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ ...labelStyle, margin: 0 }}>Bars on the list ({picks.length})</p>
          <button onClick={() => setAddingPick(v => !v)} style={primaryBtn}>
            {addingPick ? 'Cancel' : '+ Add Bar'}
          </button>
        </div>

        {addingPick && <BarPicker bars={addableBars} onPick={handleAddPick} />}

        {picks.length === 0 && !addingPick && (
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
            No bars added yet. Add your top spots — the group votes on where to go.
          </p>
        )}

        {scored.map(p => {
          const bar = BARS.find(b => b.id === p.bar_id)
          if (!bar) return null
          return (
            <div key={p.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Vote column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 44 }}>
                <VoteBtn active={p.myVote === 1} onClick={() => handleVote(p.bar_id, 1)} up />
                <span style={{ fontSize: 14, fontWeight: 700, color: p.score > 0 ? 'var(--green)' : p.score < 0 ? 'var(--red-bright)' : 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
                  {p.score > 0 ? `+${p.score}` : p.score}
                </span>
                <VoteBtn active={p.myVote === -1} onClick={() => handleVote(p.bar_id, -1)} />
              </div>

              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onOpenBar?.(bar)}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{bar.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-faint)' }}>
                  {bar.hood} · {bar.type} · added by @{p.username}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-faint)' }}>
                  {p.up} up · {p.down} down
                </p>
              </div>

              {p.user_id === profile.id && (
                <button onClick={() => handleRemovePick(p.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text-faint)',
                  cursor: 'pointer', padding: 4, fontSize: 14,
                }}>✕</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{
      background: 'none', border: 'none', color: 'var(--text-faint)',
      cursor: 'pointer', fontSize: 13, padding: '0 0 16px',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>← Back to Night Outs</button>
  )
}

function VoteBtn({ active, onClick, up }) {
  return (
    <button onClick={onClick} style={{
      background: active ? (up ? 'var(--green)' : 'var(--red-bright)') : 'transparent',
      border: `1px solid ${active ? 'transparent' : 'var(--bd)'}`,
      borderRadius: 4, width: 26, height: 22, cursor: 'pointer',
      color: active ? '#fff' : 'var(--text-dim)', fontWeight: 700, fontSize: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }}>{up ? '▲' : '▼'}</button>
  )
}

function InviteLinkRow({ night, isCreator, onRegenerated }) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const link = `${window.location.origin}/?invite=${night.invite_token}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback — select via a temporary input
      const el = document.createElement('input')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const regenerate = async () => {
    if (!confirm('Regenerate the invite link? The old link will stop working.')) return
    setRegenerating(true)
    await db.regenerateInviteToken(night.id)
    setRegenerating(false)
    onRegenerated?.()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(74,103,65,0.06)', border: '1px solid var(--bd)', borderRadius: 6 }}>
      <span style={{
        flex: 1, fontSize: 11, color: 'var(--text-dim)',
        fontFamily: 'var(--font-display)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{link}</span>
      <button onClick={copy} style={primaryBtn}>{copied ? 'Copied!' : 'Copy Link'}</button>
      {isCreator && (
        <button onClick={regenerate} disabled={regenerating} style={ghostBtn}>
          {regenerating ? '…' : 'New'}
        </button>
      )}
    </div>
  )
}

function BarPicker({ bars, onPick }) {
  const [q, setQ] = useState('')
  const filtered = q.trim()
    ? bars.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || b.hood.toLowerCase().includes(q.toLowerCase()))
    : bars.slice(0, 0) // empty until user types

  return (
    <div style={{ ...cardStyle, marginBottom: 8 }}>
      <input
        autoFocus
        value={q} onChange={e => setQ(e.target.value)}
        placeholder="Search bars to add..."
        style={{ ...inputStyle, marginBottom: 8 }}
      />
      {q.trim() && filtered.length === 0 && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)' }}>No bars match.</p>
      )}
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.slice(0, 20).map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--bd)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{b.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-faint)' }}>{b.hood} · {b.type}</p>
            </div>
            <button onClick={() => onPick(b.id)} style={primaryBtn}>Add</button>
          </div>
        ))}
      </div>
    </div>
  )
}
