import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { readPending, sessionToken, toSessionUser, withSession } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { findUserByEmail, findUserByHandle, registerGoogleUser, update } from '@/lib/store'
import { supabaseConfigured } from '@/lib/supabase'
import type { UserRecord } from '@/lib/types'
import { HttpError, hueFromHandle, parseHandle, parsePledge, requiredText } from '@/lib/validators'

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const pending = readPending()
  if (!pending) throw new HttpError(401, 'Start Google sign-in again.')
  const body = await readJson(request)
  const displayName = requiredText(body.displayName || pending.name, 'Display name', 40)
  const handleName = parseHandle(body.handle)
  const bio = requiredText(body.bio, 'Short bio', 160)
  parsePledge(body.pledge)

  const user = supabaseConfigured()
    ? await registerGoogleUser({
        email: pending.email,
        displayName,
        handle: handleName,
        bio,
        hue: hueFromHandle(handleName),
        googleSub: pending.sub,
      })
    : await update<UserRecord>((db) => {
    if (findUserByEmail(db, pending.email) || db.users.some((item) => item.googleSub === pending.sub)) {
      throw new HttpError(409, 'That Google account is already on Troless. Sign in instead.')
    }
    if (findUserByHandle(db, handleName)) throw new HttpError(409, 'That handle is taken.')
    const record: UserRecord = {
      id: randomUUID(),
      email: pending.email,
      passwordHash: null,
      passwordSalt: null,
      googleSub: pending.sub,
      displayName,
      handle: handleName,
      bio,
      hue: hueFromHandle(handleName),
      pledgeAcceptedAt: new Date().toISOString(),
      isAdmin: db.users.length === 0,
      createdAt: new Date().toISOString(),
    }
    db.users.push(record)
    return record
  })

  return withSession(NextResponse.json({ user: toSessionUser(user) }), sessionToken(user.id))
})
