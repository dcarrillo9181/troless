import { readDb, readVideoBytes } from '@/lib/store'
import { handle } from '@/lib/http'

export const GET = handle(async (_request, { params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response('Not found', { status: 404 })
  const db = await readDb()
  const video = db.videos.find((item) => item.id === params.id)
  if (!video) return new Response('Not found', { status: 404 })
  const bytes = await readVideoBytes(video)
  if (!bytes) return new Response('Not found', { status: 404 })
  return new Response(bytes, {
    headers: {
      'Content-Type': video.mime,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=86400',
    },
  })
})
