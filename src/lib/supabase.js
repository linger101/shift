import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  )
}

const isValidUrl = (url) => { try { return /^https?:\/\//.test(new URL(url).href) } catch { return false } }

export const supabase = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const SITE_URL = 'https://shiftbar.vercel.app'

// ─── Auth helpers ───

export async function signUp(email, password, username) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: SITE_URL,
    }
  })
  if (error) return { error: error.message }

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      favorites: []
    })
  }
  return { user: data.user }
}

export async function signIn(email, password) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { user: data.user }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function resetPassword(email) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: SITE_URL,
  })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

// ─── Reviews ───

export async function getReviews() {
  if (!supabase) return []
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function addReview(review) {
  if (!supabase) return null
  const { data, error } = await supabase.from('reviews').insert(review).select().single()
  if (error) console.error('Review insert error:', error)
  return data
}

// ─── Favorites ───

export async function updateFavorites(userId, favorites) {
  if (!supabase) return
  await supabase.from('profiles').update({ favorites }).eq('id', userId)
}

// ─── Friends ───

export async function searchUsers(query) {
  if (!supabase || !query.trim()) return []
  const { data } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${query.trim()}%`)
    .limit(10)
  return data || []
}

export async function sendFriendRequest(requesterId, addresseeId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select()
    .single()
  if (error) {
    console.error('sendFriendRequest error:', error.code, error.message)
    return null
  }
  return data
}

export async function getFriendships(userId) {
  if (!supabase) return { accepted: [], incoming: [], outgoing: [] }

  // Step 1: fetch raw friendship rows (no join — FK points to auth.users not profiles)
  const { data, error } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    console.error('getFriendships error:', error)
    return { accepted: [], incoming: [], outgoing: [] }
  }
  if (!data || data.length === 0) return { accepted: [], incoming: [], outgoing: [] }

  // Step 2: look up profiles for every other user in one query
  const otherIds = [...new Set(
    data.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id)
  )]
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', otherIds)

  if (profilesError) console.error('getFriendships profiles error:', profilesError)

  const profileMap = {}
  if (profiles) profiles.forEach(p => { profileMap[p.id] = p })

  const accepted = data
    .filter(f => f.status === 'accepted')
    .map(f => {
      const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id
      return { ...profileMap[otherId], friendshipId: f.id }
    })

  const incoming = data
    .filter(f => f.status === 'pending' && f.addressee_id === userId)
    .map(f => ({ ...f, requester: profileMap[f.requester_id] }))

  const outgoing = data
    .filter(f => f.status === 'pending' && f.requester_id === userId)
    .map(f => ({ ...profileMap[f.addressee_id], friendshipId: f.id }))

  return { accepted, incoming, outgoing }
}

export async function updateFriendship(friendshipId, status) {
  if (!supabase) return
  await supabase.from('friendships').update({ status }).eq('id', friendshipId)
}

export async function removeFriend(friendshipId) {
  if (!supabase) return
  await supabase.from('friendships').delete().eq('id', friendshipId)
}

export async function getReviewsByUser(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

// ─── Review Replies ───

export async function getRepliesForReviews(reviewIds) {
  if (!supabase || !reviewIds?.length) return []
  const { data } = await supabase
    .from('review_replies')
    .select('*')
    .in('review_id', reviewIds)
    .order('created_at', { ascending: true })
  return data || []
}

export async function addReply(reply) {
  if (!supabase) return null
  const { data, error } = await supabase.from('review_replies').insert(reply).select().single()
  if (error) { console.error('addReply error:', error); return null }
  return data
}

export async function deleteReply(replyId) {
  if (!supabase) return
  await supabase.from('review_replies').delete().eq('id', replyId)
}

export function subscribeToReplies(onChange) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel('review_replies_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'review_replies' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}

// ─── Night Outs ───

export async function getNightOuts(userId) {
  if (!supabase || !userId) return []

  // Nights where user is creator
  const { data: owned } = await supabase
    .from('night_outs')
    .select('*')
    .eq('creator_id', userId)

  // Nights where user is a member
  const { data: memberRows } = await supabase
    .from('night_out_members')
    .select('night_out_id')
    .eq('user_id', userId)

  const memberIds = (memberRows || []).map(r => r.night_out_id)
  let joined = []
  if (memberIds.length) {
    const { data } = await supabase
      .from('night_outs')
      .select('*')
      .in('id', memberIds)
    joined = data || []
  }

  const all = [...(owned || []), ...joined]
  const dedup = Object.values(Object.fromEntries(all.map(n => [n.id, n])))
  return dedup.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createNightOut({ creatorId, name, nightDate }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('night_outs')
    .insert({ creator_id: creatorId, name, night_date: nightDate || null })
    .select()
    .single()
  if (error) { console.error('createNightOut error:', error); return null }
  // Auto-add creator as a member so RLS on child tables resolves cleanly
  await supabase.from('night_out_members').insert({
    night_out_id: data.id, user_id: creatorId, added_by: creatorId,
  })
  return data
}

export async function deleteNightOut(nightOutId) {
  if (!supabase) return
  await supabase.from('night_outs').delete().eq('id', nightOutId)
}

export async function getNightOutDetail(nightOutId) {
  if (!supabase) return null
  const [nightRes, membersRes, picksRes, votesRes] = await Promise.all([
    supabase.from('night_outs').select('*').eq('id', nightOutId).single(),
    supabase.from('night_out_members').select('*').eq('night_out_id', nightOutId),
    supabase.from('night_out_picks').select('*').eq('night_out_id', nightOutId),
    supabase.from('night_out_votes').select('*').eq('night_out_id', nightOutId),
  ])
  if (nightRes.error) { console.error('getNightOutDetail error:', nightRes.error); return null }

  // Resolve usernames for members + pick owners in one query
  const userIds = new Set()
  ;(membersRes.data || []).forEach(m => userIds.add(m.user_id))
  ;(picksRes.data || []).forEach(p => userIds.add(p.user_id))
  userIds.add(nightRes.data.creator_id)

  let profiles = []
  if (userIds.size) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', [...userIds])
    profiles = data || []
  }
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const members = (membersRes.data || []).map(m => ({
    ...m, username: profileMap[m.user_id]?.username || 'unknown'
  }))
  const picks = (picksRes.data || []).map(p => ({
    ...p, username: profileMap[p.user_id]?.username || 'unknown'
  }))

  return {
    night: nightRes.data,
    creator: profileMap[nightRes.data.creator_id] || null,
    members,
    picks,
    votes: votesRes.data || [],
  }
}

export async function addNightOutMember(nightOutId, userId, addedBy) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('night_out_members')
    .insert({ night_out_id: nightOutId, user_id: userId, added_by: addedBy })
    .select()
    .single()
  if (error) { console.error('addNightOutMember error:', error); return null }
  return data
}

export async function removeNightOutMember(memberRowId) {
  if (!supabase) return
  await supabase.from('night_out_members').delete().eq('id', memberRowId)
}

export async function addNightOutPick(nightOutId, userId, barId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('night_out_picks')
    .insert({ night_out_id: nightOutId, user_id: userId, bar_id: barId })
    .select()
    .single()
  if (error) { console.error('addNightOutPick error:', error); return null }
  return data
}

export async function removeNightOutPick(pickId) {
  if (!supabase) return
  await supabase.from('night_out_picks').delete().eq('id', pickId)
}

export async function castNightOutVote(nightOutId, userId, barId, value) {
  if (!supabase) return null
  // Upsert on (night_out_id, user_id, bar_id)
  const { data, error } = await supabase
    .from('night_out_votes')
    .upsert(
      { night_out_id: nightOutId, user_id: userId, bar_id: barId, value },
      { onConflict: 'night_out_id,user_id,bar_id' }
    )
    .select()
    .single()
  if (error) { console.error('castNightOutVote error:', error); return null }
  return data
}

export async function clearNightOutVote(nightOutId, userId, barId) {
  if (!supabase) return
  await supabase
    .from('night_out_votes')
    .delete()
    .eq('night_out_id', nightOutId)
    .eq('user_id', userId)
    .eq('bar_id', barId)
}

export function subscribeToNightOut(nightOutId, onChange) {
  if (!supabase || !nightOutId) return () => {}
  const ch = supabase
    .channel(`night_out_${nightOutId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'night_out_picks', filter: `night_out_id=eq.${nightOutId}` },
      onChange)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'night_out_votes', filter: `night_out_id=eq.${nightOutId}` },
      onChange)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'night_out_members', filter: `night_out_id=eq.${nightOutId}` },
      onChange)
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}

export async function regenerateInviteToken(nightOutId) {
  if (!supabase) return null
  // crypto.randomUUID is widely supported; fallback to DB-side default if needed
  const newToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined
  const { data, error } = await supabase
    .from('night_outs')
    .update({ invite_token: newToken })
    .eq('id', nightOutId)
    .select('invite_token')
    .single()
  if (error) { console.error('regenerateInviteToken error:', error); return null }
  return data.invite_token
}

export async function getInvitePreview(token) {
  if (!supabase || !token) return null
  const { data, error } = await supabase.rpc('get_night_out_by_invite', { p_token: token })
  if (error) { console.error('getInvitePreview error:', error); return null }
  return (data && data[0]) || null
}

export async function redeemInvite(token) {
  if (!supabase || !token) return null
  const { data, error } = await supabase.rpc('redeem_night_out_invite', { p_token: token })
  if (error) { console.error('redeemInvite error:', error); return null }
  return data // night_out_id or null
}

export function subscribeToNightOutList(userId, onChange) {
  if (!supabase || !userId) return () => {}
  const ch = supabase
    .channel(`night_out_list_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'night_outs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'night_out_members' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}
