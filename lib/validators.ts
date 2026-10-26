import { RESERVED_HANDLES } from './constants'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function requiredText(value: unknown, label: string, max: number) {
  if (typeof value !== 'string') throw new HttpError(400, `Add a ${label.toLowerCase()}.`)
  const text = value.trim().replace(/\s+/g, ' ')
  if (!text) throw new HttpError(400, `Add a ${label.toLowerCase()}.`)
  if (text.length > max) throw new HttpError(400, `${label} must be ${max} characters or fewer.`)
  return text
}

export function optionalText(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length > max) throw new HttpError(400, `Keep that note to ${max} characters.`)
  return text
}

export function parseEmail(value: unknown) {
  if (typeof value !== 'string') throw new HttpError(400, 'Enter an email address.')
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    throw new HttpError(400, 'Enter a valid email address.')
  }
  return email
}

export function parsePassword(value: unknown) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new HttpError(400, 'Use a password of at least 8 characters.')
  }
  if (value.length > 200) throw new HttpError(400, 'That password is too long.')
  return value
}

export function parseHandle(value: unknown) {
  if (typeof value !== 'string') throw new HttpError(400, 'Choose a handle.')
  const handle = value.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    throw new HttpError(400, 'Handles are 3–20 characters: letters, numbers, and underscores.')
  }
  if (RESERVED_HANDLES.has(handle)) throw new HttpError(400, 'That handle is reserved.')
  return handle
}

export function parsePledge(value: unknown) {
  if (value !== true) throw new HttpError(400, 'The Pledge of Optimism is required to join.')
}

export function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}

export function hueFromHandle(handle: string) {
  let n = 0
  for (const char of handle) n = (n * 33 + char.charCodeAt(0)) >>> 0
  return n % 360
}
