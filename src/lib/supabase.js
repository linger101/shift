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

// ─── Auth helpers ───

export async function signUp(email, password, username) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
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
