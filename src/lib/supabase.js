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
