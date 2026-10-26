import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hashPassword, sessionToken, toSessionUser, withSession } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { findUserByEmail, findUserByHandle, registerEmailUser, update } from '@/lib/store'
import { supabaseConfigured } from '@/lib/supabase'
import type { UserRecord } from '@/lib/types'
import { HttpError, hueFromHandle, parseEmail, parseHandle, parsePassword, parsePledge, requiredText } from '@/lib/validators'

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const body = await readJson(request)
  const email = parseEmail(body.email)
  const password = parsePassword(body.password)
  const displayName = requiredText(body.displayName, 'Display name', 40)
  const handleName = parseHandle(body.handle)
  const bio = requiredText(body.bio, 'Short bio', 160)
  parsePledge(body.pledge)

  const user = supabaseConfigured()
    ? await registerEmailUser({
        email,
        password,
        displayName,
        handle: handleName,
        bio,
        hue: hueFromHandle(handleName),
      })
    : await update<UserRecord>((db) => {
    if (findUserByEmail(db, email)) throw new HttpError(409, 'An account with that email already exists.')
    if (findUserByHandle(db, handleName)) throw new HttpError(409, 'That handle is taken.')
    const { hash, salt } = hashPassword(password)
    const record: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: hash,
      passwordSalt: salt,
      googleSub: null,
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
