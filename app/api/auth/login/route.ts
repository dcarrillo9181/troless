import { NextResponse } from 'next/server'
import { sessionToken, toSessionUser, verifyPassword, withSession } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { authenticateEmail, findUserByEmail, readDb } from '@/lib/store'
import { supabaseConfigured } from '@/lib/supabase'
import { HttpError, parseEmail, parsePassword } from '@/lib/validators'

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const body = await readJson(request)
  const email = parseEmail(body.email)
  const password = parsePassword(body.password)
  const user = supabaseConfigured()
    ? await authenticateEmail(email, password)
    : await (async () => {
        const db = await readDb()
        const found = findUserByEmail(db, email)
        if (!found) throw new HttpError(401, 'That email and password don’t match.')
        if (!found.passwordHash || !found.passwordSalt) {
          throw new HttpError(401, 'This account uses Google sign-in.')
        }
        if (!verifyPassword(password, found.passwordHash, found.passwordSalt)) {
          throw new HttpError(401, 'That email and password don’t match.')
        }
        return found
      })()
  return withSession(NextResponse.json({ user: toSessionUser(user) }), sessionToken(user.id))
})
