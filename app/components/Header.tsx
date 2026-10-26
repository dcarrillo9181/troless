import Link from 'next/link'
import type { SessionUser } from '@/lib/types'
import { Logo } from './Logo'

export default function Header({ user, alerts }: { user: SessionUser | null; alerts: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="shrink-0" aria-label="Troless home">
          <Logo />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-blush">Feed</Link>
          {user ? (
            <Link href="/record" className="rounded-full bg-sun px-3 py-1.5 font-semibold text-white hover:brightness-95">
              Record
            </Link>
          ) : null}
          {user ? (
            <Link href={`/u/${user.handle}`} className="rounded-full px-3 py-1.5 hover:bg-blush">Profile</Link>
          ) : null}
          {user?.isAdmin ? (
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-blush">
              Reports
              {alerts ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-berry px-1.5 text-xs font-semibold text-white">
                  {alerts}
                </span>
              ) : null}
            </Link>
          ) : null}
          {user ? (
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-full px-3 py-1.5 hover:bg-blush">Sign out</button>
            </form>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-blush">Sign in</Link>
              <Link href="/join" className="rounded-full bg-sun px-3 py-1.5 font-semibold text-white hover:brightness-95">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
