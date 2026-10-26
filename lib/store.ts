import fs from 'fs'
import path from 'path'
import type { Database, EncouragementRecord, UserRecord, VideoRecord } from './types'

const EMPTY: Database = {
  users: [],
  videos: [],
  encouragements: [],
  comments: [],
  reports: [],
}

function dataDir() {
  return path.join(process.cwd(), 'data')
}

function dbPath() {
  return path.join(dataDir(), 'db.json')
}

export function videosDir() {
  return path.join(dataDir(), 'videos')
}

export function secretPath() {
  return path.join(dataDir(), '.session-secret')
}

function ensureDirs() {
  fs.mkdirSync(videosDir(), { recursive: true })
}

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => T): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function read(): Database {
  ensureDirs()
  if (!fs.existsSync(dbPath())) return structuredClone(EMPTY)
  const parsed = JSON.parse(fs.readFileSync(dbPath(), 'utf8')) as Database
  return {
    users: parsed.users ?? [],
    videos: parsed.videos ?? [],
    encouragements: parsed.encouragements ?? [],
    comments: parsed.comments ?? [],
    reports: parsed.reports ?? [],
  }
}

function write(db: Database) {
  ensureDirs()
  const tmp = `${dbPath()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, dbPath())
}

export function update<T>(fn: (db: Database) => T): Promise<T> {
  return withLock(() => {
    const db = read()
    const result = fn(db)
    write(db)
    return result
  })
}

export function readDb() {
  return withLock(() => read())
}

export function videoFilePath(video: VideoRecord) {
  if (!/^[a-z0-9.-]+$/i.test(video.filename)) return null
  const file = path.join(videosDir(), video.filename)
  if (!file.startsWith(videosDir() + path.sep)) return null
  return file
}

export function findUserById(db: Database, id: string) {
  return db.users.find((user) => user.id === id) ?? null
}

export function findUserByEmail(db: Database, email: string) {
  return db.users.find((user) => user.email === email) ?? null
}

export function findUserByHandle(db: Database, handle: string) {
  return db.users.find((user) => user.handle === handle) ?? null
}

export function findUserByGoogleSub(db: Database, sub: string) {
  return db.users.find((user) => user.googleSub === sub) ?? null
}

export function publicAuthor(user: UserRecord) {
  return { displayName: user.displayName, handle: user.handle, hue: user.hue }
}

export function listVideosNewest(db: Database) {
  return [...db.videos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function commentsFor(db: Database, videoId: string) {
  return db.comments
    .filter((comment) => comment.videoId === videoId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
}

export function hasEncouragement(db: Database, userId: string, videoId: string) {
  return db.encouragements.some((item) => item.userId === userId && item.videoId === videoId)
}

export function addEncouragement(db: Database, record: EncouragementRecord) {
  if (!hasEncouragement(db, record.userId, record.videoId)) db.encouragements.push(record)
}

export function unreviewedCount(db: Database) {
  return db.reports.filter((report) => !report.reviewedAt).length
}
