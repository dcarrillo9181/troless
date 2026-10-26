import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { assertSameOrigin, handle, readJson } from '@/lib/http'
import { update } from '@/lib/store'
import { HttpError, optionalText } from '@/lib/validators'

export const POST = handle(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await getSessionUser()
  if (!user) throw new HttpError(401, 'Sign in to report.')
  const body = await readJson(request)
  const reason = optionalText(body.reason, 280) || 'Violates the optimism pledge'
  const videoId = params.id
  await update((db) => {
    if (!db.videos.some((item) => item.id === videoId)) throw new HttpError(404, 'That video is gone.')
    db.reports.push({
      id: randomUUID(),
      reporterId: user.id,
      targetType: 'video',
      targetId: videoId,
      reason,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    })
  })
  return NextResponse.json({ alerted: true })
})
