export function authError(code: string | undefined) {
  if (code === 'google_unconfigured') {
    return 'Google sign-in is not turned on for this project yet. Use email instead.'
  }
  if (code === 'google_failed') return 'Google sign-in did not complete. Use email instead.'
  if (code === 'google_denied') return 'Google sign-in was cancelled.'
  return ''
}
