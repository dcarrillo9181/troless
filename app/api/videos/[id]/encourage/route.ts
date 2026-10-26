import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { assertSameOrigin, handle } from '@/lib/http'
import { addEncouragement, update } from '@/lib/store'
import { HttpError } from '@/lib/validators'

export const POST = handle(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await getSessionUser()
  if (!user) throw new HttpError(401, 'Sign in to encourage someone.')
  const videoId = params.id
  await update((db) => {
    const video = db.videos.find((item) => item.id === videoId)
    if (!video) throw new HttpError(404, 'That video is gone.')
    if (video.userId === user.id) throw new HttpError(400, 'Save encouragement for someone else.')
    addEncouragement(db, { userId: user.id, videoId, createdAt: new Date().toISOString() })
  })
  return NextResponse.json({ encouraged: true })
})
