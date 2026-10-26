import { randomUUID } from 'crypto'
import type { User } from '@supabase/supabase-js'
import { safeVideoName, videoObjectName } from './records'
import { SUPABASE_URL, supabaseAdmin, supabaseAuth } from './supabase'
import type { CommentRecord, Database, EncouragementRecord, ReportRecord, UserRecord, VideoRecord } from './types'
import { HttpError } from './validators'

const BUCKET = 'videos'
const PAGE = 1000

type Row = Record<string, unknown>
type AccountInput = {
  email: string
  displayName: string
  handle: string
  bio: string
  hue: number
  isAdmin?: boolean
}

function iso(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return letters || 'TU'
}

function metaOf(user: User | undefined) {
  return (user?.user_metadata ?? {}) as Record<string, unknown>
}

function named(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function userFromParts(profile: Row, authUser: User | undefined): UserRecord {
  const meta = metaOf(authUser)
  const handle = typeof meta.handle === 'string' && meta.handle ? meta.handle : 'member'
  const googleSub = typeof meta.googleSub === 'string' ? meta.googleSub : null
  return {
    id: String(profile.id),
    email: String(profile.email || authUser?.email || ''),
    passwordHash: googleSub ? null : 'supabase',
    passwordSalt: googleSub ? null : 'supabase',
    googleSub,
    displayName: named(profile.name) || named(meta.name) || named(meta.full_name) || named(meta.display_name) || named(meta.displayName) || 'Member',
    handle,
    bio: String(profile.bio || ''),
    hue: typeof meta.hue === 'number' ? meta.hue : Number(meta.hue || 0),
    pledgeAcceptedAt: typeof meta.pledgeAcceptedAt === 'string' ? meta.pledgeAcceptedAt : iso(profile.created_at),
    isAdmin: meta.isAdmin === true,
    createdAt: iso(profile.created_at),
  }
}

function fail(error: { code?: string; message?: string }): never {
  const message = (error.message || '').replace(/Key \([^)]*\)=\([^)]*\)/g, 'Key=(redacted)')
  console.error('supabase', error.code || 'error', message)
  if (/already registered|already exists|duplicate/i.test(message) && /email|user/i.test(message)) {
    throw new HttpError(409, 'An account with that email already exists.')
  }
  if (error.code === '23505' && /email/i.test(message)) throw new HttpError(409, 'An account with that email already exists.')
  if (error.code === '23505' && /handle/i.test(message)) throw new HttpError(409, 'That handle is taken.')
  throw new HttpError(500, 'The database could not save that.')
}

async function fetchAll(table: string) {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin().from(table).select('*').range(from, from + PAGE - 1)
    if (error) fail(error)
    const batch = (data ?? []) as Row[]
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

async function listAuthUsers() {
  const users: User[] = []
  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabaseAdmin().auth.admin.listUsers({ page, perPage: 200 })
    if (error) fail(error)
    users.push(...data.users)
    if (data.users.length < 200) break
  }
  return users
}

async function load(): Promise<Database> {
  const [profiles, authUsers, videos, comments, ratings, notifications] = await Promise.all([
    fetchAll('profiles'),
    listAuthUsers(),
    fetchAll('videos'),
    fetchAll('comments'),
    fetchAll('video_ratings'),
    fetchAll('notifications'),
  ])
  const authById = new Map(authUsers.map((user) => [user.id, user]))
  const users = profiles.map((profile) => userFromParts(profile, authById.get(String(profile.id))))
  const videoRecords: VideoRecord[] = videos.flatMap((video) => {
    const status = String(video.status || 'active')
    if (status !== 'active' && status !== 'published') return []
    const filename = videoObjectName(String(video.video_url || ''))
    return [{
      id: String(video.id),
      userId: String(video.user_id),
      title: String(video.caption || 'Untitled'),
      filename,
      mime: filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
      durationMs: Number(video.duration_seconds || 1) * 1000,
      createdAt: iso(video.created_at),
    }]
  })
  const commentRecords: CommentRecord[] = comments
    .filter((comment) => comment.parent_id == null)
    .map((comment) => ({
      id: String(comment.id),
      videoId: String(comment.video_id),
      userId: String(comment.user_id),
      body: String(comment.body || ''),
      createdAt: iso(comment.created_at),
    }))
  const encouragements: EncouragementRecord[] = ratings.map((rating) => ({
    userId: String(rating.user_id),
    videoId: String(rating.video_id),
    createdAt: iso(rating.created_at),
  }))
  const reports: ReportRecord[] = notifications
    .filter((item) => item.type === 'report')
    .map((item) => ({
      id: String(item.id),
      reporterId: String(item.user_id),
      targetType: item.reference_type === 'comment' ? 'comment' : 'video',
      targetId: String(item.reference_id || ''),
      reason: String(item.body || item.title || 'Violates the optimism pledge'),
      createdAt: iso(item.created_at),
      reviewedAt: item.read ? iso(item.created_at) : null,
    }))
  return { users, videos: videoRecords, encouragements, comments: commentRecords, reports }
}

async function patchProfile(user: UserRecord) {
  const now = new Date().toISOString()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabaseAdmin()
      .from('profiles')
      .update({
        name: user.displayName,
        avatar_initials: initials(user.displayName),
        email: user.email,
        bio: user.bio,
        updated_at: now,
      })
      .eq('id', user.id)
      .select('id')
    if (error) fail(error)
    if (data && data.length > 0) return
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new HttpError(500, 'The profile was not ready.')
}

function metadataFor(user: Pick<UserRecord, 'handle' | 'hue' | 'isAdmin' | 'pledgeAcceptedAt' | 'googleSub' | 'displayName'>, extra: Record<string, unknown> = {}) {
  const name = user.displayName
  return {
    ...extra,
    handle: user.handle,
    hue: user.hue,
    isAdmin: user.isAdmin,
    pledgeAcceptedAt: user.pledgeAcceptedAt,
    googleSub: user.googleSub,
    name,
    full_name: name,
    display_name: name,
    displayName: name,
  }
}

function videoPublicUrl(filename: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/videos/${filename}`
}

export async function registerEmailUser(input: AccountInput & { password: string }) {
  const db = await load()
  if (db.users.some((user) => user.email === input.email)) throw new HttpError(409, 'An account with that email already exists.')
  if (db.users.some((user) => user.handle === input.handle)) throw new HttpError(409, 'That handle is taken.')
  const pledgeAcceptedAt = new Date().toISOString()
  const record: UserRecord = {
    id: '',
    email: input.email,
    passwordHash: 'supabase',
    passwordSalt: 'supabase',
    googleSub: null,
    displayName: input.displayName,
    handle: input.handle,
    bio: input.bio,
    hue: input.hue,
    pledgeAcceptedAt,
    isAdmin: input.isAdmin ?? db.users.length === 0,
    createdAt: pledgeAcceptedAt,
  }
  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadataFor(record),
  })
  if (error || !data.user) fail(error || { message: 'Could not create the account.' })
  record.id = data.user.id
  record.createdAt = data.user.created_at || pledgeAcceptedAt
  await patchProfile(record)
  invalidateDbCache()
  return record
}

export async function registerGoogleUser(input: AccountInput & { googleSub: string }) {
  const db = await load()
  if (db.users.some((user) => user.email === input.email || user.googleSub === input.googleSub)) {
    throw new HttpError(409, 'That Google account is already on Troless. Sign in instead.')
  }
  if (db.users.some((user) => user.handle === input.handle)) throw new HttpError(409, 'That handle is taken.')
  const pledgeAcceptedAt = new Date().toISOString()
  const record: UserRecord = {
    id: '',
    email: input.email,
    passwordHash: null,
    passwordSalt: null,
    googleSub: input.googleSub,
    displayName: input.displayName,
    handle: input.handle,
    bio: input.bio,
    hue: input.hue,
    pledgeAcceptedAt,
    isAdmin: input.isAdmin ?? db.users.length === 0,
    createdAt: pledgeAcceptedAt,
  }
  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    user_metadata: metadataFor(record),
  })
  if (error || !data.user) fail(error || { message: 'Could not create the account.' })
  record.id = data.user.id
  record.createdAt = data.user.created_at || pledgeAcceptedAt
  await patchProfile(record)
  invalidateDbCache()
  return record
}

export async function authenticateEmail(email: string, password: string) {
  const { data, error } = await supabaseAuth().auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    const { data: listed } = await supabaseAdmin().auth.admin.listUsers({ page: 1, perPage: 200 })
    const match = listed?.users.find((user) => user.email?.toLowerCase() === email)
    if (match && typeof match.user_metadata?.googleSub === 'string') {
      throw new HttpError(401, 'This account uses Google sign-in.')
    }
    throw new HttpError(401, 'That email and password don’t match.')
  }
  const { data: profile, error: profileError } = await supabaseAdmin().from('profiles').select('*').eq('id', data.user.id).maybeSingle()
  if (profileError || !profile) throw new HttpError(500, 'Account missing.')
  return userFromParts(profile as Row, data.user)
}

async function insert(table: string, rows: Row[]) {
  if (rows.length === 0) return
  const { error } = await supabaseAdmin().from(table).insert(rows)
  if (error) {
    if (table === 'video_ratings' && error.code === '23505') return
    fail(error)
  }
}

async function persistDiff(before: Database, after: Database) {
  for (const user of after.users) {
    const prev = before.users.find((item) => item.id === user.id)
    if (!prev || prev.googleSub === user.googleSub) continue
    const { data, error } = await supabaseAdmin().auth.admin.getUserById(user.id)
    if (error || !data.user) fail(error || { message: 'Account missing.' })
    const { error: updateError } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
      user_metadata: metadataFor(user, data.user.user_metadata || {}),
    })
    if (updateError) fail(updateError)
  }

  const beforeVideos = new Set(before.videos.map((video) => video.id))
  await insert(
    'videos',
    after.videos
      .filter((video) => !beforeVideos.has(video.id))
      .map((video) => ({
        id: video.id,
        user_id: video.userId,
        video_url: videoPublicUrl(video.filename),
        duration_seconds: Math.max(1, Math.min(60, Math.round(video.durationMs / 1000))),
        caption: video.title,
        status: 'active',
        created_at: video.createdAt,
        updated_at: video.createdAt,
      }))
  )

  const encouraged = new Set(before.encouragements.map((item) => `${item.userId}:${item.videoId}`))
  await insert(
    'video_ratings',
    after.encouragements
      .filter((item) => !encouraged.has(`${item.userId}:${item.videoId}`))
      .map((item) => ({
        id: randomUUID(),
        user_id: item.userId,
        video_id: item.videoId,
        rating: 1,
        created_at: item.createdAt,
      }))
  )

  const beforeComments = new Set(before.comments.map((comment) => comment.id))
  await insert(
    'comments',
    after.comments
      .filter((comment) => !beforeComments.has(comment.id))
      .map((comment) => ({
        id: comment.id,
        video_id: comment.videoId,
        user_id: comment.userId,
        body: comment.body,
        score: 0,
        is_blurred: false,
        created_at: comment.createdAt,
        updated_at: comment.createdAt,
      }))
  )

  const beforeReports = new Map(before.reports.map((report) => [report.id, report]))
  await insert(
    'notifications',
    after.reports
      .filter((report) => !beforeReports.has(report.id))
      .map((report) => ({
        id: report.id,
        user_id: report.reporterId,
        type: 'report',
        title: report.targetType === 'comment' ? 'Comment report' : 'Video report',
        body: report.reason,
        reference_type: report.targetType,
        reference_id: report.targetId,
        read: Boolean(report.reviewedAt),
        created_at: report.createdAt,
      }))
  )
  for (const report of after.reports) {
    const prev = beforeReports.get(report.id)
    if (!prev || prev.reviewedAt === report.reviewedAt || !report.reviewedAt) continue
    const { error } = await supabaseAdmin().from('notifications').update({ read: true }).eq('id', report.id)
    if (error) fail(error)
  }
}

let cached: { at: number; generation: number; db: Database } | null = null
let generation = 0
const CACHE_MS = 3000

export function invalidateDbCache() {
  generation += 1
  cached = null
}

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

export function readDb() {
  return withLock(async () => {
    const now = Date.now()
    if (cached && cached.generation === generation && now - cached.at < CACHE_MS) return structuredClone(cached.db)
    const seen = generation
    const db = await load()
    if (seen === generation) cached = { at: Date.now(), generation: seen, db }
    return structuredClone(db)
  })
}

export function update<T>(fn: (db: Database) => T) {
  return withLock(async () => {
    const before = await load()
    const db = structuredClone(before)
    const result = fn(db)
    await persistDiff(before, db)
    invalidateDbCache()
    return result
  })
}

export async function writeVideoBytes(filename: string, bytes: Buffer, mime: string) {
  if (!safeVideoName(filename)) throw new HttpError(400, 'That recording could not be saved.')
  const { error } = await supabaseAdmin().storage.from(BUCKET).upload(filename, bytes, {
    contentType: mime,
    upsert: false,
  })
  if (error) {
    console.error('supabase storage', error.message)
    throw new HttpError(500, 'The video could not be saved.')
  }
}

export async function removeVideoBytes(filename: string) {
  if (!safeVideoName(filename)) return
  const { error } = await supabaseAdmin().storage.from(BUCKET).remove([filename])
  if (error) console.error('supabase storage', error.message)
}

export async function readVideoBytes(video: VideoRecord) {
  if (!safeVideoName(video.filename)) return null
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(video.filename)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}
