import { redirect } from 'next/navigation'
import { Recorder } from '../components/Recorder'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function RecordPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/record')
  return <Recorder displayName={user.displayName} />
}
