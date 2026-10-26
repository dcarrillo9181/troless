'use client'

import { useState } from 'react'

export function SignOutButton() {
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
    window.location.assign('/')
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} className="rounded-full px-3 py-2 hover:bg-blush disabled:opacity-50">
      Sign out
    </button>
  )
}
