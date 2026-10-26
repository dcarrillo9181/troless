'use client'

import { FormEvent, useState } from 'react'

type Props = {
  mode: 'email' | 'google'
  endpoint: string
  defaultName?: string
  lockedEmail?: string
  initialError?: string
}

export function SignupSteps({ mode, endpoint, defaultName = '', lockedEmail, initialError = '' }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState(defaultName)
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pledge, setPledge] = useState(false)
  const [message, setMessage] = useState(initialError)
  const [pending, setPending] = useState(false)

  function continueToPledge(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (mode === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setMessage('Enter a valid email address.')
        return
      }
      if (password.length < 8) {
        setMessage('Use a password of at least 8 characters.')
        return
      }
    }
    if (!displayName.trim()) {
      setMessage('Add the name people should see.')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      setMessage('Handles are 3–20 characters: letters, numbers, and underscores.')
      return
    }
    if (!bio.trim()) {
      setMessage('Say what brings you optimism.')
      return
    }
    setStep(2)
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault()
    if (!pledge) {
      setMessage('The Pledge of Optimism is required to join.')
      return
    }
    setPending(true)
    setMessage('')
    const payload =
      mode === 'email'
        ? { email, password, displayName, handle, bio, pledge: true }
        : { displayName, handle, bio, pledge: true }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setPending(false)
      setMessage(data.error || 'Could not create the account.')
      if (/handle|email|password|bio|name/i.test(data.error || '')) setStep(1)
      return
    }
    window.location.href = '/record'
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <p className="font-display text-sm uppercase tracking-[0.18em] text-clay">Join Troless</p>
      <h1 className="mt-2 font-display text-4xl text-ink">A short, face-to-face place for optimism.</h1>
      {step === 1 ? (
        <form onSubmit={continueToPledge} className="mt-8 space-y-4">
          {mode === 'email' ? (
            <a href="/api/auth/google?from=join" className="block rounded-full border border-line bg-white px-4 py-3 text-center font-semibold">
              Continue with Google
            </a>
          ) : null}
          {mode === 'email' ? <p className="text-center text-sm text-mist">or create an account with email</p> : null}
          {lockedEmail ? <p className="text-sm text-mist">Google account: {lockedEmail}</p> : null}
          {mode === 'email' ? (
            <>
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
                />
              </label>
            </>
          ) : null}
          <label className="block text-sm font-semibold">
            Display name
            <input
              required
              maxLength={40}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            Handle
            <input
              required
              maxLength={20}
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
              placeholder="yourname"
            />
          </label>
          <label className="block text-sm font-semibold">
            What brings you optimism?
            <textarea
              required
              maxLength={160}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal"
              placeholder="A walk after dinner, my sister's laugh, fixing something that was broken."
            />
          </label>
          {message ? <p className="text-sm text-clay">{message}</p> : null}
          <button type="submit" className="w-full rounded-full bg-tide px-4 py-3 font-semibold text-paper">
            Continue to the pledge
          </button>
        </form>
      ) : (
        <form onSubmit={createAccount} className="mt-8 rounded-3xl border border-line bg-foam p-6">
          <h2 className="font-display text-3xl">Pledge of Optimism</h2>
          <p className="mt-4 text-lg leading-relaxed">
            I promise that everything I post will be constructive, encouraging, or solution-focused. I will not use this place to tear people down.
          </p>
          <label className="mt-6 flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={pledge}
              onChange={(event) => setPledge(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span>I make this pledge.</span>
          </label>
          {message ? <p className="mt-4 text-sm text-clay">{message}</p> : null}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-full border border-line px-4 py-3">
              Back
            </button>
            <button type="submit" disabled={pending || !pledge} className="flex-1 rounded-full bg-clay px-4 py-3 font-semibold text-white disabled:opacity-50">
              {pending ? 'Creating account…' : 'Create my account'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
