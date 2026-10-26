import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { googleConfigured, pendingToken, sessionToken, withPending, withSession } from '@/lib/auth'
import { OAUTH_PKCE_COOKIE, OAUTH_STATE_COOKIE } from '@/lib/constants'
import { handle, publicOrigin } from '@/lib/http'
import { findUserByEmail, findUserByGoogleSub, update } from '@/lib/store'
import { memoryAuthStorage, supabaseAuthWith, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const origin = publicOrigin(request)
  const fail = (code: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${code}`, origin))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    response.cookies.delete(OAUTH_PKCE_COOKIE)
    return response
  }

  const code = url.searchParams.get('code')
  if (!code) return fail('google_denied')

  const state = url.searchParams.get('state')
  const savedState = cookies().get(OAUTH_STATE_COOKIE)?.value
  let profile: { sub: string; email: string; name: string } | null = null

  if (googleConfigured() && state && savedState && state === savedState) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) return fail('google_failed')
    const token = (await tokenRes.json()) as { access_token?: string }
    if (!token.access_token) return fail('google_failed')
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })
    if (!profileRes.ok) return fail('google_failed')
    const google = (await profileRes.json()) as {
      sub?: string
      email?: string
      email_verified?: boolean
      name?: string
    }
    if (!google.sub || !google.email || google.email_verified === false) return fail('google_failed')
    profile = { sub: google.sub, email: google.email.toLowerCase(), name: google.name || '' }
  } else if (supabaseConfigured()) {
    const raw = cookies().get(OAUTH_PKCE_COOKIE)?.value
    if (!raw) return fail('google_failed')
    let stored: Record<string, string> = {}
    try {
      stored = JSON.parse(raw) as Record<string, string>
    } catch {
      return fail('google_failed')
    }
    const { data, error } = await supabaseAuthWith(memoryAuthStorage(stored)).auth.exchangeCodeForSession(code)
    const user = data.user
    const identity = user?.identities?.find((item) => item.provider === 'google')
    const email = user?.email?.toLowerCase()
    if (error || !user || !email) return fail('google_failed')
    const meta = user.user_metadata || {}
    const sub = identity?.identity_id || identity?.id || (typeof meta.sub === 'string' ? meta.sub : user.id)
    const name = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : ''
    profile = { sub, email, name }
  } else {
    return fail('google_unconfigured')
  }

  const account = profile
  const existing = await update((db) => {
    const bySub = findUserByGoogleSub(db, account.sub)
    if (bySub) return bySub
    const byEmail = findUserByEmail(db, account.email)
    if (byEmail) {
      if (!byEmail.googleSub) byEmail.googleSub = account.sub
      return byEmail
    }
    return null
  })

  if (existing) {
    const response = withSession(NextResponse.redirect(new URL('/', origin)), sessionToken(existing.id))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    response.cookies.delete(OAUTH_PKCE_COOKIE)
    return response
  }

  const response = withPending(
    NextResponse.redirect(new URL('/onboarding', origin)),
    pendingToken({ email: account.email, name: account.name, sub: account.sub })
  )
  response.cookies.delete(OAUTH_STATE_COOKIE)
  response.cookies.delete(OAUTH_PKCE_COOKIE)
  return response
})
