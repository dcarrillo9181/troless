import Link from 'next/link'
import type { SessionUser } from '@/lib/types'

export default function Header({ user, alerts }: { user: SessionUser | null; alerts: number }) {

  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-2 bg-tide px-3 py-2 text-paper sm:px-4">
      <Link href="/" className="shrink-0">
        <img src="/troless_full_logo.png" alt="Troless" className="h-9 w-auto" />
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-4 sm:text-base">
        <Link href="/" className="rounded-full px-2 py-1 hover:bg-white/10">Feed</Link>
        {user ? <Link href="/record" className="rounded-full px-2 py-1 hover:bg-white/10">Record</Link> : null}
        {user ? (
          <Link href={`/u/${user.handle}`} className="rounded-full px-2 py-1 hover:bg-white/10">Profile</Link>
        ) : null}
        {user?.isAdmin ? (
          <Link href="/admin" className="rounded-full px-2 py-1 hover:bg-white/10">
            Reports{alerts ? ` (${alerts})` : ''}
          </Link>
        ) : null}
        {user ? (
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full px-2 py-1 hover:bg-white/10">Sign out</button>
          </form>
        ) : (
          <>
            <Link href="/login" className="rounded-full px-2 py-1 hover:bg-white/10">Sign in</Link>
            <Link href="/join" className="rounded-full bg-paper px-3 py-1 font-semibold text-ink">Join</Link>
          </>
        )}
      </nav>
    </header>
  )
}
