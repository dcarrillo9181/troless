import type { SessionUser } from '@/lib/types'
import { Logo } from './Logo'
import { SignOutButton } from './SignOutButton'

const item = 'rounded-full px-3 py-2 hover:bg-blush'

export default function Header({ user, alerts }: { user: SessionUser | null; alerts: number }) {
  return (
    <header className="z-40 w-full shrink-0 border-b border-line/80 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2">
        <a href="/" className="shrink-0 rounded-full" aria-label="Troless home">
          <Logo />
        </a>
        <nav className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <a href="/" className={item}>Feed</a>
          <a href="/top_videos" className={item}>Top videos</a>
          <a href="/challenges" className={item}>Challenges</a>
          <a href="/conflict_resolution" className={item}>Resolve</a>
          {user ? (
            <a href="/record" className="rounded-full bg-sun px-3 py-2 font-semibold text-white hover:brightness-95">
              Record
            </a>
          ) : null}
          {user ? <a href={`/u/${user.handle}`} className={item}>Profile</a> : null}
          {user?.isAdmin ? (
            <a href="/admin" className={item}>
              Reports
              {alerts ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-berry px-1.5 text-xs font-semibold text-white">
                  {alerts}
                </span>
              ) : null}
            </a>
          ) : null}
          {user ? <SignOutButton /> : (
            <>
              <a href="/login" className={item}>Sign in</a>
              <a href="/join" className="rounded-full bg-sun px-3 py-2 font-semibold text-white hover:brightness-95">
                Join
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
