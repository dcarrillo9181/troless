import { NextResponse } from 'next/server'
import { sessionToken, toSessionUser, verifyPassword, withSession } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { findUserByEmail, readDb } from '@/lib/store'
import { HttpError, parseEmail, parsePassword } from '@/lib/validators'

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const body = await readJson(request)
  const email = parseEmail(body.email)
  const password = parsePassword(body.password)
  const db = await readDb()
  const user = findUserByEmail(db, email)
  if (!user) throw new HttpError(401, 'That email and password don’t match.')
  if (!user.passwordHash || !user.passwordSalt) {
    throw new HttpError(401, 'This account uses Google sign-in.')
  }
  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    throw new HttpError(401, 'That email and password don’t match.')
  }
  return withSession(NextResponse.json({ user: toSessionUser(user) }), sessionToken(user.id))
})
