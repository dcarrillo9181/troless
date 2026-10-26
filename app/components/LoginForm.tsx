'use client'

import { FormEvent, useState } from 'react'
import { safeNext } from '@/lib/validators'

export function LoginForm({ initialError = '', next = '/' }: { initialError?: string; next?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(initialError)
  const [pending, setPending] = useState(false)
  const destination = safeNext(next)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setPending(false)
      setMessage(data.error || 'Could not sign in.')
      return
    }
    window.location.href = destination
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="font-display text-4xl">Sign in</h1>
      <p className="mt-2 text-mist">Come back to record, watch, and encourage.</p>
      <a href="/api/auth/google?from=login" className="mt-8 block rounded-full border border-line bg-white px-4 py-3 text-center font-semibold">
        Continue with Google
      </a>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        {message ? <p className="text-sm text-clay">{message}</p> : null}
        <button type="submit" disabled={pending} className="w-full rounded-full bg-tide px-4 py-3 font-semibold text-paper disabled:opacity-50">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm">
        New here? <a className="font-semibold underline" href="/join">Create an account</a>
      </p>
    </div>
  )
}
