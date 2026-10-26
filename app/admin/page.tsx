import { redirect } from 'next/navigation'
import { ReportList } from './ReportList'
import { getSessionUser } from '@/lib/auth'
import { presentReports } from '@/lib/present'
import { readDb } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/admin')
  if (!user.isAdmin) redirect('/')
  const reports = presentReports(await readDb())

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="font-display text-sm italic text-sun">For administrators</p>
      <h1 className="mt-2 font-display text-4xl italic">Reports</h1>
      <p className="mt-2 text-mist">
        Each report is a pledge someone thinks was broken. Review it yourself. Nothing here is filtered by a model.
      </p>
      <ReportList initialReports={reports} />
    </div>
  )
}
