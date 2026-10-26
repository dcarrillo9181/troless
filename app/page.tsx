import { Feed } from './components/Feed'
import { getSessionUser } from '@/lib/auth'
import { presentFeed } from '@/lib/present'
import { readDb } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSessionUser()
  const videos = presentFeed(await readDb(), user?.id ?? null)
  return <Feed initialVideos={videos} signedIn={Boolean(user)} />
}
