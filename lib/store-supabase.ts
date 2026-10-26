import { safeVideoName } from './records'
import { supabaseAdmin } from './supabase'
import type { CommentRecord, Database, EncouragementRecord, ReportRecord, UserRecord, VideoRecord } from './types'
import { HttpError } from './validators'

const BUCKET = 'videos'
const PAGE = 1000

type Row = Record<string, unknown>

function iso(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

function userFromRow(row: Row): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: row.password_hash == null ? null : String(row.password_hash),
    passwordSalt: row.password_salt == null ? null : String(row.password_salt),
    googleSub: row.google_sub == null ? null : String(row.google_sub),
    displayName: String(row.display_name),
    handle: String(row.handle),
    bio: String(row.bio),
    hue: Number(row.hue),
    pledgeAcceptedAt: iso(row.pledge_accepted_at),
    isAdmin: Boolean(row.is_admin),
    createdAt: iso(row.created_at),
  }
}

function videoFromRow(row: Row): VideoRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    filename: String(row.filename),
    mime: String(row.mime),
    durationMs: Number(row.duration_ms),
    createdAt: iso(row.created_at),
  }
}

function encouragementFromRow(row: Row): EncouragementRecord {
  return {
    userId: String(row.user_id),
    videoId: String(row.video_id),
    createdAt: iso(row.created_at),
  }
}

function commentFromRow(row: Row): CommentRecord {
  return {
    id: String(row.id),
    videoId: String(row.video_id),
    userId: String(row.user_id),
    body: String(row.body),
    createdAt: iso(row.created_at),
  }
}

function reportFromRow(row: Row): ReportRecord {
  return {
    id: String(row.id),
    reporterId: String(row.reporter_id),
    targetType: row.target_type === 'comment' ? 'comment' : 'video',
    targetId: String(row.target_id),
    reason: String(row.reason),
    createdAt: iso(row.created_at),
    reviewedAt: row.reviewed_at == null ? null : iso(row.reviewed_at),
  }
}

function userToRow(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    password_salt: user.passwordSalt,
    google_sub: user.googleSub,
    display_name: user.displayName,
    handle: user.handle,
    bio: user.bio,
    hue: user.hue,
    pledge_accepted_at: user.pledgeAcceptedAt,
    is_admin: user.isAdmin,
    created_at: user.createdAt,
  }
}

function fail(error: { code?: string; message?: string }): never {
  const message = (error.message || '').replace(/Key \([^)]*\)=\([^)]*\)/g, 'Key=(redacted)')
  console.error('supabase', error.code || 'error', message)
  if (error.code === '42P01' || error.code === 'PGRST205' || /relation .* does not exist|schema cache/i.test(message)) {
    throw new HttpError(500, 'The database is not set up yet.')
  }
  if (error.code === '23505') {
    if (/email/i.test(message)) throw new HttpError(409, 'An account with that email already exists.')
    if (/handle/i.test(message)) throw new HttpError(409, 'That handle is taken.')
    if (/google/i.test(message)) throw new HttpError(409, 'That Google account is already on Troless. Sign in instead.')
    if (/users_single_admin/i.test(message)) throw new HttpError(409, 'Could not create the account. Try again.')
  }
  throw new HttpError(500, 'The database could not save that.')
}

async function fetchAll<T>(table: string, map: (row: Row) => T) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin().from(table).select('*').range(from, from + PAGE - 1)
    if (error) fail(error)
    const batch = (data ?? []) as Row[]
    rows.push(...batch.map(map))
    if (batch.length < PAGE) break
  }
  return rows
}

async function load(): Promise<Database> {
  const [users, videos, encouragements, comments, reports] = await Promise.all([
    fetchAll('users', userFromRow),
    fetchAll('videos', videoFromRow),
    fetchAll('encouragements', encouragementFromRow),
    fetchAll('comments', commentFromRow),
    fetchAll('reports', reportFromRow),
  ])
  return { users, videos, encouragements, comments, reports }
}

async function insert(table: string, rows: Row[]) {
  if (rows.length === 0) return
  const { error } = await supabaseAdmin().from(table).insert(rows)
  if (error) {
    if (table === 'encouragements' && error.code === '23505') return
    fail(error)
  }
}

async function persistDiff(before: Database, after: Database) {
  const beforeUsers = new Set(before.users.map((user) => user.id))
  await insert('users', after.users.filter((user) => !beforeUsers.has(user.id)).map(userToRow))

  for (const user of after.users) {
    const prev = before.users.find((item) => item.id === user.id)
    if (!prev || prev.googleSub === user.googleSub) continue
    const { error } = await supabaseAdmin().from('users').update({ google_sub: user.googleSub }).eq('id', user.id)
    if (error) fail(error)
  }

  const beforeVideos = new Set(before.videos.map((video) => video.id))
  await insert(
    'videos',
    after.videos
      .filter((video) => !beforeVideos.has(video.id))
      .map((video) => ({
        id: video.id,
        user_id: video.userId,
        title: video.title,
        filename: video.filename,
        mime: video.mime,
        duration_ms: video.durationMs,
        created_at: video.createdAt,
      }))
  )

  const encouraged = new Set(before.encouragements.map((item) => `${item.userId}:${item.videoId}`))
  await insert(
    'encouragements',
    after.encouragements
      .filter((item) => !encouraged.has(`${item.userId}:${item.videoId}`))
      .map((item) => ({ user_id: item.userId, video_id: item.videoId, created_at: item.createdAt }))
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
        created_at: comment.createdAt,
      }))
  )

  const beforeReports = new Map(before.reports.map((report) => [report.id, report]))
  await insert(
    'reports',
    after.reports
      .filter((report) => !beforeReports.has(report.id))
      .map((report) => ({
        id: report.id,
        reporter_id: report.reporterId,
        target_type: report.targetType,
        target_id: report.targetId,
        reason: report.reason,
        created_at: report.createdAt,
        reviewed_at: report.reviewedAt,
      }))
  )

  for (const report of after.reports) {
    const prev = beforeReports.get(report.id)
    if (!prev || prev.reviewedAt === report.reviewedAt) continue
    const { error } = await supabaseAdmin().from('reports').update({ reviewed_at: report.reviewedAt }).eq('id', report.id)
    if (error) fail(error)
  }
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
  return withLock(() => load())
}

export function update<T>(fn: (db: Database) => T) {
  return withLock(async () => {
    const before = await load()
    const db = structuredClone(before)
    const result = fn(db)
    await persistDiff(before, db)
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
