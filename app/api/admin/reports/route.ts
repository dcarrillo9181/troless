import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { handle } from '@/lib/http'
import { presentReports } from '@/lib/present'
import { readDb } from '@/lib/store'
import { HttpError } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  const user = await getSessionUser()
  if (!user?.isAdmin) throw new HttpError(403, 'Only an administrator can read reports.')
  const db = await readDb()
  return NextResponse.json({ reports: presentReports(db) })
})
