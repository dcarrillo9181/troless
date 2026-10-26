import fs from 'fs'
import { Readable } from 'stream'
import { videoFilePath, readDb } from '@/lib/store'
import { handle } from '@/lib/http'

export const GET = handle(async (_request, { params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response('Not found', { status: 404 })
  const db = await readDb()
  const video = db.videos.find((item) => item.id === params.id)
  if (!video) return new Response('Not found', { status: 404 })
  const file = videoFilePath(video)
  if (!file || !fs.existsSync(file)) return new Response('Not found', { status: 404 })
  const stat = fs.statSync(file)
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream
  return new Response(stream, {
    headers: {
      'Content-Type': video.mime,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=86400',
    },
  })
})
