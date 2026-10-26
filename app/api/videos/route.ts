import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { MAX_VIDEO_BYTES, MAX_VIDEO_MS, MIN_VIDEO_MS } from '@/lib/constants'
import { assertSameOrigin, handle } from '@/lib/http'
import { presentFeed, presentVideo } from '@/lib/present'
import { readDb, removeVideoBytes, update, writeVideoBytes } from '@/lib/store'
import type { VideoRecord } from '@/lib/types'
import { HttpError, requiredText } from '@/lib/validators'

function baseMime(value: string) {
  const mime = value.split(';')[0]?.trim().toLowerCase()
  if (mime === 'video/webm' || mime === 'video/mp4') return mime
  return null
}

export const GET = handle(async () => {
  const user = await getSessionUser()
  const db = await readDb()
  return NextResponse.json({ videos: presentFeed(db, user?.id ?? null) })
})

export const POST = handle(async (request) => {
  assertSameOrigin(request)
  const user = await getSessionUser()
  if (!user) throw new HttpError(401, 'Sign in to publish.')
  const form = await request.formData()
  const title = requiredText(form.get('title'), 'Title', 80)
  const durationMs = Number(form.get('durationMs'))
  if (!Number.isFinite(durationMs) || durationMs < MIN_VIDEO_MS || durationMs > MAX_VIDEO_MS) {
    throw new HttpError(400, 'Videos need to be between 1 and 60 seconds.')
  }
  const file = form.get('video')
  if (!(file instanceof File)) throw new HttpError(400, 'Record a video first.')
  const mime = baseMime(file.type || '')
  if (!mime) throw new HttpError(400, 'Use a WebM or MP4 recording.')
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length < 1000) throw new HttpError(400, 'That recording was empty.')
  if (bytes.length > MAX_VIDEO_BYTES) throw new HttpError(413, 'That video is too large.')

  const id = randomUUID()
  const filename = `${id}${mime === 'video/mp4' ? '.mp4' : '.webm'}`
  const record: VideoRecord = {
    id,
    userId: user.id,
    title,
    filename,
    mime,
    durationMs: Math.round(durationMs),
    createdAt: new Date().toISOString(),
  }
  await writeVideoBytes(filename, bytes, mime)
  try {
    await update((db) => {
      db.videos.push(record)
    })
  } catch (error) {
    await removeVideoBytes(filename)
    throw error
  }
  const db = await readDb()
  const video = presentVideo(db, id, user.id)
  if (!video) throw new HttpError(500, 'The video could not be saved.')
  return NextResponse.json({ video })
})
