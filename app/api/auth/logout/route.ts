import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'
import { assertSameOrigin, handle } from '@/lib/http'

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const response = NextResponse.redirect(new URL('/', request.url), 303)
  return clearSession(response)
})
