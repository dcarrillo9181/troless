import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { googleConfigured } from '@/lib/auth'
import { OAUTH_PKCE_COOKIE, OAUTH_STATE_COOKIE } from '@/lib/constants'
import { handle, publicOrigin } from '@/lib/http'
import { SUPABASE_URL, memoryAuthStorage, publishableKey, supabaseAuthWith, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function oauthCookie(request: Request, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: publicOrigin(request).startsWith('https://'),
    path: '/',
    maxAge,
  }
}

async function googleProviderEnabled() {
  const key = publishableKey()
  if (!supabaseConfigured() || !key) return false
  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'User-Agent': 'troless-server' },
  })
  if (!response.ok) return false
  const body = (await response.json()) as { external?: { google?: boolean } }
  return body.external?.google === true
}

export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const origin = publicOrigin(request)
  const from = url.searchParams.get('from') === 'join' ? 'join' : 'login'
  const back = (code: string) => NextResponse.redirect(new URL(`/${from}?error=${code}`, origin))

  if (googleConfigured()) {
    const state = randomBytes(16).toString('hex')
    const redirectUri = `${origin}/api/auth/google/callback`
    const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    auth.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
    auth.searchParams.set('redirect_uri', redirectUri)
    auth.searchParams.set('response_type', 'code')
    auth.searchParams.set('scope', 'openid email profile')
    auth.searchParams.set('state', state)
    auth.searchParams.set('prompt', 'select_account')
    const response = NextResponse.redirect(auth)
    response.cookies.set(OAUTH_STATE_COOKIE, state, oauthCookie(request, 60 * 10))
    return response
  }

  if (await googleProviderEnabled()) {
    const storage = memoryAuthStorage()
    const { data, error } = await supabaseAuthWith(storage).auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/google/callback`,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error || !data.url) return back('google_failed')
    const response = NextResponse.redirect(data.url)
    response.cookies.set(OAUTH_PKCE_COOKIE, JSON.stringify(storage.snapshot()), oauthCookie(request, 60 * 10))
    return response
  }

  return back('google_unconfigured')
})
