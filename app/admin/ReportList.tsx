'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { AdminReport } from '@/lib/types'

export function ReportList({ initialReports }: { initialReports: AdminReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [message, setMessage] = useState('')

  async function review(id: string) {
    setMessage('')
    const response = await fetch(`/api/admin/reports/${id}`, { method: 'POST' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(data.error || 'Could not mark that report reviewed.')
      return
    }
    setReports((current) => current.map((report) => (report.id === id ? { ...report, reviewedAt: new Date().toISOString() } : report)))
  }

  if (reports.length === 0) {
    return <p className="mt-6 text-mist">No reports yet.</p>
  }

  return (
    <ul className="mt-6 space-y-4">
      {reports.map((report) => (
        <li key={report.id} className="rounded-2xl border border-line bg-foam p-4">
          <p className="text-sm text-mist">
            {report.targetType === 'video' ? 'Video' : 'Comment'} · {new Date(report.createdAt).toLocaleString()} · reported by {report.reporter.displayName}
          </p>
          <p className="mt-2">{report.excerpt}</p>
          <p className="mt-2 text-sm">Reason: {report.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`/?v=${report.videoId}`} className="text-sm font-semibold underline">
              Open in the feed
            </Link>
            {report.reviewedAt ? (
              <span className="text-sm text-mist">Reviewed</span>
            ) : (
              <button type="button" onClick={() => review(report.id)} className="rounded-full bg-tide px-3 py-1.5 text-sm font-semibold text-paper">
                Mark reviewed
              </button>
            )}
          </div>
        </li>
      ))}
      {message ? <p className="text-sm text-clay">{message}</p> : null}
    </ul>
  )
}
