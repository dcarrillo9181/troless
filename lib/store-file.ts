import fs from 'fs'
import path from 'path'
import { safeVideoName } from './records'
import type { Database, VideoRecord } from './types'

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

function videosDir() {
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

function videoPath(filename: string) {
  if (!safeVideoName(filename)) return null
  const file = path.join(videosDir(), filename)
  if (!file.startsWith(videosDir() + path.sep)) return null
  return file
}

export async function writeVideoBytes(filename: string, bytes: Buffer, _mime: string) {
  const file = videoPath(filename)
  if (!file) throw new Error('Bad video name')
  ensureDirs()
  fs.writeFileSync(file, bytes)
}

export async function removeVideoBytes(filename: string) {
  const file = videoPath(filename)
  if (file) fs.rmSync(file, { force: true })
}

export async function readVideoBytes(video: VideoRecord) {
  const file = videoPath(video.filename)
  if (!file || !fs.existsSync(file)) return null
  return fs.readFileSync(file)
}
