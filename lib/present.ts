import { commentsFor, findUserById, hasEncouragement, listVideosNewest, publicAuthor } from './store'
import type { AdminReport, Database, FeedVideo } from './types'

export function presentVideo(db: Database, videoId: string, viewerId: string | null): FeedVideo | null {
  const video = db.videos.find((item) => item.id === videoId)
  if (!video) return null
  const author = findUserById(db, video.userId)
  if (!author) return null
  const comments = commentsFor(db, video.id).flatMap((comment) => {
    const commentAuthor = findUserById(db, comment.userId)
    if (!commentAuthor) return []
    return [
      {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: publicAuthor(commentAuthor),
      },
    ]
  })
  return {
    id: video.id,
    title: video.title,
    src: `/api/media/${video.id}`,
    createdAt: video.createdAt,
    encouraged: viewerId ? hasEncouragement(db, viewerId, video.id) : false,
    author: publicAuthor(author),
    comments,
  }
}

export function presentFeed(db: Database, viewerId: string | null) {
  return listVideosNewest(db).flatMap((video) => {
    const presented = presentVideo(db, video.id, viewerId)
    return presented ? [presented] : []
  })
}

export function presentReports(db: Database): AdminReport[] {
  const reports: AdminReport[] = []
  const ordered = [...db.reports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  for (const report of ordered) {
    const reporter = findUserById(db, report.reporterId)
    if (!reporter) continue
    if (report.targetType === 'video') {
      const video = db.videos.find((item) => item.id === report.targetId)
      const author = video ? findUserById(db, video.userId) : null
      if (!video || !author) continue
      reports.push({
        id: report.id,
        targetType: 'video',
        reason: report.reason,
        createdAt: report.createdAt,
        reviewedAt: report.reviewedAt,
        reporter: publicAuthor(reporter),
        excerpt: `${author.displayName}: ${video.title}`,
        videoId: video.id,
      })
      continue
    }
    const comment = db.comments.find((item) => item.id === report.targetId)
    const author = comment ? findUserById(db, comment.userId) : null
    if (!comment || !author) continue
    reports.push({
      id: report.id,
      targetType: 'comment',
      reason: report.reason,
      createdAt: report.createdAt,
      reviewedAt: report.reviewedAt,
      reporter: publicAuthor(reporter),
      excerpt: `${author.displayName}: ${comment.body}`,
      videoId: comment.videoId,
    })
  }
  return reports
}
