import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { findUserById, publicAuthor, readDb, update } from '@/lib/store'
import type { CommentRecord } from '@/lib/types'
import { HttpError, requiredText } from '@/lib/validators'

export const POST = handle(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await getSessionUser()
  if (!user) throw new HttpError(401, 'Sign in to write encouragement.')
  const body = await readJson(request)
  const text = requiredText(body.body, 'Comment', 280)
  const videoId = params.id
  const comment = await update<CommentRecord>((db) => {
    if (!db.videos.some((item) => item.id === videoId)) throw new HttpError(404, 'That video is gone.')
    const record: CommentRecord = {
      id: randomUUID(),
      videoId,
      userId: user.id,
      body: text,
      createdAt: new Date().toISOString(),
    }
    db.comments.push(record)
    return record
  })
  const db = await readDb()
  const author = findUserById(db, user.id)
  if (!author) throw new HttpError(500, 'Account missing.')
  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: publicAuthor(author),
    },
  })
})
