'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Avatar } from './Avatar'
import { CircularVideo } from './CircularVideo'
import type { FeedComment, FeedVideo } from '@/lib/types'

export function Feed({ initialVideos, signedIn }: { initialVideos: FeedVideo[]; signedIn: boolean }) {
  const [videos, setVideos] = useState(initialVideos)
  const [activeId, setActiveId] = useState(initialVideos[0]?.id ?? null)
  const [sound, setSound] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const target = params.get('v')
    if (!target) return
    document.getElementById(`video-${target}`)?.scrollIntoView()
  }, [])

  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-video-id]'))
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = best?.target.getAttribute('data-video-id')
        if (id) setActiveId(id)
      },
      { root, threshold: [0.55, 0.8] }
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [videos])

  useEffect(() => {
    const root = scroller.current
    if (!root) return
    let cancelled = false
    const elements = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-feed-video]'))
    for (const element of elements) {
      const id = element.dataset.feedVideo
      if (id !== activeId) {
        element.pause()
        continue
      }
      element.muted = !sound
      element.play().catch(() => {
        if (cancelled) return
        element.muted = true
        if (sound) setSound(false)
        element.play().catch(() => undefined)
      })
    }
    return () => {
      cancelled = true
    }
  }, [activeId, sound])

  if (videos.length === 0) {
    return (
      <div className="mx-auto flex h-full min-h-[24rem] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-4xl italic">Nothing here yet.</h1>
        <p className="mt-3 text-lg text-mist">Record a circular selfie about something that gave you optimism.</p>
        <Link href={signedIn ? '/record' : '/join'} className="mt-6 rounded-full bg-sun px-5 py-3 font-semibold text-white">
          {signedIn ? 'Record a video' : 'Join and record'}
        </Link>
      </div>
    )
  }

  return (
    <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-auto">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          signedIn={signedIn}
          sound={sound}
          active={video.id === activeId}
          onSound={() => setSound((current) => !current)}
          onChange={(next) => setVideos((current) => current.map((item) => (item.id === next.id ? next : item)))}
        />
      ))}
    </div>
  )
}

function VideoCard({
  video,
  signedIn,
  sound,
  active,
  onSound,
  onChange,
}: {
  video: FeedVideo
  signedIn: boolean
  sound: boolean
  active: boolean
  onSound: () => void
  onChange: (video: FeedVideo) => void
}) {
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [reportOpen, setReportOpen] = useState<'video' | string | null>(null)
  const [reportNote, setReportNote] = useState('')
  const [alerted, setAlerted] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function encourage() {
    if (!signedIn) {
      window.location.href = '/login?next=/'
      return
    }
    if (video.encouraged) return
    setBusy(true)
    const response = await fetch(`/api/videos/${video.id}/encourage`, { method: 'POST' })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) {
      setCommentError(data.error || 'Could not send that encouragement.')
      return
    }
    onChange({ ...video, encouraged: true })
  }

  async function sendComment(event: FormEvent) {
    event.preventDefault()
    setCommentError('')
    const response = await fetch(`/api/videos/${video.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: comment }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setCommentError(data.error || 'Could not post that.')
      return
    }
    onChange({ ...video, comments: [...video.comments, data.comment as FeedComment] })
    setComment('')
  }

  async function report(target: 'video' | 'comment', id: string) {
    const path = target === 'video' ? `/api/videos/${id}/report` : `/api/comments/${id}/report`
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportNote }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setCommentError(data.error || 'Could not send the report.')
      return
    }
    setReportOpen(null)
    setReportNote('')
    setAlerted(id)
  }

  return (
    <article id={`video-${video.id}`} data-video-id={video.id} className="mx-auto flex min-h-full w-full max-w-xl snap-start flex-col px-4 py-8">
      <button type="button" onClick={onSound} className="mx-auto block w-[min(78vw,420px)]" aria-label={sound ? 'Mute' : 'Unmute'}>
        <CircularVideo
          src={video.src}
          videoId={video.id}
          muted={!sound}
          loop
          className="w-full lens-rest"
        >
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/75 px-3 py-1 text-sm text-white">
            {active ? (sound ? 'Mute' : 'Tap for sound') : 'Sound'}
          </span>
        </CircularVideo>
      </button>
      <div className="mx-auto mt-5 w-[min(78vw,420px)]">
        <Link href={`/u/${video.author.handle}`} className="flex items-center gap-3">
          <Avatar name={video.author.displayName} hue={video.author.hue} />
          <span>
            <span className="block font-semibold">{video.author.displayName}</span>
            <span className="block text-sm text-mist">@{video.author.handle}</span>
          </span>
        </Link>
        <h2 className="mt-4 font-display text-3xl italic leading-tight">{video.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={encourage}
            disabled={busy || video.encouraged}
            className="rounded-full bg-grove px-4 py-2 font-semibold text-white disabled:opacity-70"
          >
            {video.encouraged ? 'Encouraged' : 'Encourage'}
          </button>
          {alerted === video.id ? (
            <p className="text-sm text-mist">An administrator has been alerted.</p>
          ) : (
            <button type="button" onClick={() => setReportOpen(reportOpen === 'video' ? null : 'video')} className="text-sm text-mist underline">
              Report
            </button>
          )}
        </div>
        {reportOpen === 'video' ? (
          <ReportForm
            note={reportNote}
            onNote={setReportNote}
            onSubmit={() => report('video', video.id)}
            signedIn={signedIn}
          />
        ) : null}
        <section className="mt-8">
          <h3 className="font-semibold">Encouragement</h3>
          <ul className="mt-3 space-y-4">
            {video.comments.map((item) => (
              <li key={item.id}>
                <p className="text-sm text-mist">
                  {item.author.displayName} <span>@{item.author.handle}</span>
                </p>
                <p className="mt-1">{item.body}</p>
                {alerted === item.id ? (
                  <p className="mt-1 text-sm text-mist">An administrator has been alerted.</p>
                ) : (
                  <button type="button" onClick={() => setReportOpen(item.id)} className="mt-1 text-sm text-mist underline">
                    Report
                  </button>
                )}
                {reportOpen === item.id ? (
                  <ReportForm
                    note={reportNote}
                    onNote={setReportNote}
                    onSubmit={() => report('comment', item.id)}
                    signedIn={signedIn}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          {signedIn ? (
            <form onSubmit={sendComment} className="mt-4">
              <label className="block text-sm font-semibold" htmlFor={`comment-${video.id}`}>
                Add encouragement, gratitude, or a constructive follow-up
                <textarea
                  id={`comment-${video.id}`}
                  value={comment}
                  maxLength={280}
                  rows={3}
                  onChange={(event) => setComment(event.target.value)}
                  className="field"
                />
              </label>
              <button type="submit" className="mt-2 rounded-full border border-line bg-foam px-4 py-2 font-semibold">
                Post
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm">
              <Link href="/login?next=/" className="font-semibold underline">Sign in</Link> to leave encouragement.
            </p>
          )}
          {commentError ? <p className="mt-2 text-sm text-berry">{commentError}</p> : null}
        </section>
      </div>
    </article>
  )
}

function ReportForm({
  note,
  onNote,
  onSubmit,
  signedIn,
}: {
  note: string
  onNote: (value: string) => void
  onSubmit: () => void
  signedIn: boolean
}) {
  if (!signedIn) {
    return (
      <p className="mt-3 text-sm">
        <Link href="/login?next=/" className="font-semibold underline">Sign in</Link> to report this.
      </p>
    )
  }
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label className="block text-sm">
        What breaks the pledge?
        <textarea
          value={note}
          maxLength={280}
          rows={2}
          onChange={(event) => onNote(event.target.value)}
          className="field"
          placeholder="Optional. An administrator is alerted either way."
        />
      </label>
      <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
        Alert an administrator
      </button>
    </form>
  )
}
