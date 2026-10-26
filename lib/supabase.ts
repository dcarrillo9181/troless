import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lhpvuvbmsnkfyndstebi.supabase.co'

export function secretKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function supabaseConfigured() {
  return Boolean(secretKey())
}

let admin: SupabaseClient | null = null

export function supabaseAdmin() {
  const key = secretKey()
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set')
  if (!admin) {
    admin = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'User-Agent': 'troless-server' } },
    })
  }
  return admin
}

export function publishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || ''
}

type AuthStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function memoryAuthStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value
    },
    removeItem: (key: string) => {
      delete data[key]
    },
    snapshot: () => ({ ...data }),
  }
}

export function supabaseAuth() {
  const key = publishableKey()
  if (!key) throw new Error('SUPABASE_PUBLISHABLE_KEY is not set')
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'User-Agent': 'troless-server' } },
  })
}

export function supabaseAuthWith(storage: AuthStorage) {
  const key = publishableKey()
  if (!key) throw new Error('SUPABASE_PUBLISHABLE_KEY is not set')
  return createClient(SUPABASE_URL, key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
    },
    global: { headers: { 'User-Agent': 'troless-server' } },
  })
}
