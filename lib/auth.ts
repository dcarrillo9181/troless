import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import fs from 'fs'
import path from 'path'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PENDING_COOKIE, SESSION_COOKIE } from './constants'
import { findUserById, readDb, secretPath } from './store'
import type { SessionUser, UserRecord } from './types'

type SessionToken = { typ: 'session'; uid: string; exp: number }
type PendingToken = { typ: 'pending'; email: string; name: string; sub: string; exp: number }

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (fs.existsSync(secretPath())) return fs.readFileSync(secretPath(), 'utf8')
  fs.mkdirSync(path.dirname(secretPath()), { recursive: true })
  const value = randomBytes(32).toString('hex')
  fs.writeFileSync(secretPath(), value, { mode: 0o600 })
  return value
}

function sign(payload: SessionToken | PendingToken) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

function readSigned<T extends { typ: string; exp: number }>(token: string | undefined, typ: T['typ']): T | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const actualBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as T
    if (!data || data.typ !== typ || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const actual = scryptSync(password, salt, 32)
  const expected = Buffer.from(hash, 'hex')
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function sessionToken(userId: string) {
  return sign({ typ: 'session', uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })
}

export function pendingToken(input: { email: string; name: string; sub: string }) {
  return sign({ typ: 'pending', ...input, exp: Date.now() + 1000 * 60 * 15 })
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio,
    hue: user.hue,
    isAdmin: user.isAdmin,
  }
}

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const data = readSigned<SessionToken>(token, 'session')
  if (!data) return null
  const db = await readDb()
  const user = findUserById(db, data.uid)
  return user ? toSessionUser(user) : null
}

export function readPending() {
  const token = cookies().get(PENDING_COOKIE)?.value
  return readSigned<PendingToken>(token, 'pending')
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export function withSession(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, cookieOptions(60 * 60 * 24 * 30))
  response.cookies.delete(PENDING_COOKIE)
  return response
}

export function withPending(response: NextResponse, token: string) {
  response.cookies.set(PENDING_COOKIE, token, cookieOptions(60 * 15))
  return response
}

export function clearSession(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE)
  response.cookies.delete(PENDING_COOKIE)
  return response
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}
