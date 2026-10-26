export type UserRecord = {
  id: string
  email: string
  passwordHash: string | null
  passwordSalt: string | null
  googleSub: string | null
  displayName: string
  handle: string
  bio: string
  hue: number
  pledgeAcceptedAt: string
  isAdmin: boolean
  createdAt: string
}

export type VideoRecord = {
  id: string
  userId: string
  title: string
  filename: string
  mime: string
  durationMs: number
  createdAt: string
}

export type EncouragementRecord = {
  userId: string
  videoId: string
  createdAt: string
}

export type CommentRecord = {
  id: string
  videoId: string
  userId: string
  body: string
  createdAt: string
}

export type ReportRecord = {
  id: string
  reporterId: string
  targetType: 'video' | 'comment'
  targetId: string
  reason: string
  createdAt: string
  reviewedAt: string | null
}

export type Database = {
  users: UserRecord[]
  videos: VideoRecord[]
  encouragements: EncouragementRecord[]
  comments: CommentRecord[]
  reports: ReportRecord[]
}

export type PublicAuthor = {
  displayName: string
  handle: string
  hue: number
}

export type FeedComment = {
  id: string
  body: string
  createdAt: string
  author: PublicAuthor
}

export type FeedVideo = {
  id: string
  title: string
  src: string
  createdAt: string
  encouraged: boolean
  author: PublicAuthor
  comments: FeedComment[]
}

export type SessionUser = {
  id: string
  email: string
  displayName: string
  handle: string
  bio: string
  hue: number
  isAdmin: boolean
}

export type AdminReport = {
  id: string
  targetType: 'video' | 'comment'
  reason: string
  createdAt: string
  reviewedAt: string | null
  reporter: PublicAuthor
  excerpt: string
  videoId: string
}
