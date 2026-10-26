import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { googleConfigured } from '@/lib/auth'
import { OAUTH_STATE_COOKIE } from '@/lib/constants'
import { handle } from '@/lib/http'

export const dynamic = 'force-dynamic'

export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') === 'join' ? 'join' : 'login'
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL(`/${from}?error=google_unconfigured`, url.origin))
  }
  const state = randomBytes(16).toString('hex')
  const redirectUri = `${url.origin}/api/auth/google/callback`
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
  auth.searchParams.set('redirect_uri', redirectUri)
  auth.searchParams.set('response_type', 'code')
  auth.searchParams.set('scope', 'openid email profile')
  auth.searchParams.set('state', state)
  auth.searchParams.set('prompt', 'select_account')
  const response = NextResponse.redirect(auth)
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
  return response
})
