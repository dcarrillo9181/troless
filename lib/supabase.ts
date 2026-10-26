import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lhpvuvbmsnkfyndstebi.supabase.co'

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

let client: SupabaseClient | null = null

export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (!client) {
    client = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
