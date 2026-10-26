import type { Database, EncouragementRecord, UserRecord } from './types'

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

export function safeVideoName(filename: string) {
  return /^[a-z0-9.-]+$/i.test(filename)
}

export function videoObjectName(videoUrl: string) {
  const name = decodeURIComponent(videoUrl.split('?')[0].split('/').pop() || '')
  return safeVideoName(name) ? name : ''
}
