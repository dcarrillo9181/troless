export const MAX_VIDEO_SECONDS = 45
export const MIN_VIDEO_MS = 1000
export const MAX_VIDEO_MS = 60_000
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024

export const SESSION_COOKIE = 'troless_session'
export const PENDING_COOKIE = 'troless_pending'
export const OAUTH_STATE_COOKIE = 'troless_oauth_state'
export const OAUTH_PKCE_COOKIE = 'troless_oauth_pkce'

export const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'join',
  'login',
  'onboarding',
  'record',
  'registration',
  'u',
])
