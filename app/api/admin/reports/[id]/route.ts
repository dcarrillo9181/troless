import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { assertSameOrigin, handle } from '@/lib/http'
import { update } from '@/lib/store'
import { HttpError } from '@/lib/validators'

export const POST = handle(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await getSessionUser()
  if (!user?.isAdmin) throw new HttpError(403, 'Only an administrator can review reports.')
  const id = params.id
  await update((db) => {
    const report = db.reports.find((item) => item.id === id)
    if (!report) throw new HttpError(404, 'That report is gone.')
    report.reviewedAt = new Date().toISOString()
  })
  return NextResponse.json({ reviewed: true })
})
