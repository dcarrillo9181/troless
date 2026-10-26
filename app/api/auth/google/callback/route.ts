import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { googleConfigured, pendingToken, sessionToken, withPending, withSession } from '@/lib/auth'
import { OAUTH_STATE_COOKIE } from '@/lib/constants'
import { handle } from '@/lib/http'
import { findUserByEmail, findUserByGoogleSub, update } from '@/lib/store'

export const dynamic = 'force-dynamic'

export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const origin = url.origin
  const fail = (code: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${code}`, origin))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    return response
  }
  if (!googleConfigured()) return fail('google_unconfigured')
  const state = url.searchParams.get('state')
  const saved = cookies().get(OAUTH_STATE_COOKIE)?.value
  if (!state || !saved || state !== saved) return fail('google_failed')
  const code = url.searchParams.get('code')
  if (!code) return fail('google_denied')

  const redirectUri = `${origin}/api/auth/google/callback`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
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
  const profile = (await profileRes.json()) as {
    sub?: string
    email?: string
    email_verified?: boolean
    name?: string
  }
  if (!profile.sub || !profile.email || profile.email_verified === false) return fail('google_failed')
  const email = profile.email.toLowerCase()

  const existing = await update((db) => {
    const bySub = findUserByGoogleSub(db, profile.sub as string)
    if (bySub) return bySub
    const byEmail = findUserByEmail(db, email)
    if (byEmail) {
      if (!byEmail.googleSub) byEmail.googleSub = profile.sub as string
      return byEmail
    }
    return null
  })

  if (existing) {
    const response = withSession(NextResponse.redirect(new URL('/', origin)), sessionToken(existing.id))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    return response
  }

  const response = withPending(
    NextResponse.redirect(new URL('/onboarding', origin)),
    pendingToken({ email, name: profile.name || '', sub: profile.sub })
  )
  response.cookies.delete(OAUTH_STATE_COOKIE)
  return response
})
