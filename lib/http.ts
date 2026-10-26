import { NextResponse } from 'next/server'
import { HttpError } from './validators'

export function publicOrigin(request: Request) {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host') || url.host
  const proto = forwardedProto || url.protocol.replace(':', '')
  return `${proto}://${host}`
}

export function assertSameOrigin(request: Request) {
  const host = request.headers.get('host')
  const site = request.headers.get('sec-fetch-site')
  if (!host) throw new HttpError(403, 'Request blocked.')
  if (site === 'same-origin') return
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host === host) return
    } catch {
      throw new HttpError(403, 'Request blocked.')
    }
  }
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      if (new URL(referer).host === host) return
    } catch {
      throw new HttpError(403, 'Request blocked.')
    }
  }
  throw new HttpError(403, 'Request blocked.')
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
