import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSessionUser } from '@/lib/auth'
import { handle } from '@/lib/http'

export const GET = handle(async () => {
  const user = await getSessionUser()
  return NextResponse.json({ user })
})
