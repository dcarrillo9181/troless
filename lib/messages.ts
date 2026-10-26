export function authError(code: string | undefined) {
  if (code === 'google_unconfigured') {
    return 'Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Use email instead.'
  }
  if (code === 'google_failed') return 'Google sign-in did not complete. Use email instead.'
  if (code === 'google_denied') return 'Google sign-in was cancelled.'
  return ''
}
