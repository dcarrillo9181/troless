import { NextResponse } from 'next/server'
import { HttpError } from './validators'

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) throw new HttpError(403, 'Request blocked.')
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw new HttpError(403, 'Request blocked.')
  }
  if (originHost !== host) throw new HttpError(403, 'Request blocked.')
}

export async function readJson(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'That request could not be read.')
  }
}

export function handle(fn: (request: Request, context: { params: Record<string, string> }) => Promise<Response> | Response) {
  return async (request: Request, context: { params: Record<string, string> }) => {
    try {
      return await fn(request, context)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
    }
  }
}
