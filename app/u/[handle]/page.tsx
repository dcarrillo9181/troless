import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '../../components/Avatar'
import { ProfileClip } from '../../components/ProfileClip'
import { getSessionUser } from '@/lib/auth'
import { findUserByHandle, listVideosNewest, readDb } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: { handle: string } }) {
  const db = await readDb()
  const user = findUserByHandle(db, params.handle.toLowerCase())
  if (!user) notFound()
  const viewer = await getSessionUser()
  const videos = listVideosNewest(db).filter((video) => video.userId === user.id)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-start gap-4">
        <Avatar name={user.displayName} hue={user.hue} size={72} />
        <div>
          <h1 className="font-display text-4xl">{user.displayName}</h1>
          <p className="text-mist">@{user.handle}</p>
          {viewer?.id === user.id ? <p className="mt-1 text-sm text-mist">{user.email}</p> : null}
        </div>
      </div>
      <p className="mt-6 max-w-xl text-lg leading-relaxed">{user.bio}</p>
      <h2 className="mt-10 font-display text-2xl">Videos</h2>
      {videos.length === 0 ? (
        <p className="mt-3 text-mist">
          No videos yet.
          {viewer?.id === user.id ? (
            <>
              {' '}
              <Link href="/record" className="font-semibold underline">Record the first one.</Link>
            </>
          ) : null}
        </p>
      ) : (
        <ul className="mt-6 flex flex-wrap gap-8">
          {videos.map((video) => (
            <li key={video.id}>
              <ProfileClip src={`/api/media/${video.id}`} title={video.title} />
              <Link href={`/?v=${video.id}`} className="mt-2 inline-block text-sm font-semibold underline">
                See it in the feed
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
