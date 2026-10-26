'use client'

import { useEffect, useRef, useState } from 'react'
import { MAX_VIDEO_SECONDS } from '@/lib/constants'
import { CircularVideo } from './CircularVideo'

type Phase = 'ready' | 'recording' | 'review'

function pickMime() {
  const types = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
  return types.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || ''
}

function clock(ms: number) {
  const seconds = Math.min(MAX_VIDEO_SECONDS, Math.floor(ms / 1000))
  return `0:${String(seconds).padStart(2, '0')}`
}

export function Recorder({ displayName }: { displayName: string }) {
  const previewRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAt = useRef(0)
  const timerRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [cameraOn, setCameraOn] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [clipUrl, setClipUrl] = useState<string | null>(null)
  const [clip, setClip] = useState<Blob | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase === 'review') return
    const preview = previewRef.current
    const stream = streamRef.current
    if (!preview || !stream) return
    preview.srcObject = stream
    preview.play().catch(() => undefined)
  }, [phase, cameraOn])

  async function openCamera() {
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('This browser cannot open the camera.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play()
      }
      setCameraOn(true)
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        })
        streamRef.current = stream
        if (previewRef.current) {
          previewRef.current.srcObject = stream
          await previewRef.current.play()
        }
        setCameraOn(true)
        setMessage('Camera is on without a microphone.')
      } catch {
        setMessage('Camera access was blocked. Allow the camera, then try again.')
      }
    }
  }

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  function finishRecording() {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  function startRecording() {
    const stream = streamRef.current
    if (!stream) return
    const mime = pickMime()
    if (!mime && typeof MediaRecorder === 'undefined') {
      setMessage('This browser cannot record video.')
      return
    }
    chunksRef.current = []
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 800_000 } : { videoBitsPerSecond: 800_000 })
    } catch {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      stopTimer()
      const duration = Date.now() - startedAt.current
      setElapsed(duration)
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mime || 'video/webm' })
      if (duration < 1000 || blob.size < 1000) {
        setMessage('Hold the recording a little longer.')
        setPhase('ready')
        return
      }
      if (clipUrl) URL.revokeObjectURL(clipUrl)
      const url = URL.createObjectURL(blob)
      setClip(blob)
      setClipUrl(url)
      setPhase('review')
    }
    recorderRef.current = recorder
    startedAt.current = Date.now()
    setElapsed(0)
    setPhase('recording')
    recorder.start(200)
    timerRef.current = window.setInterval(() => {
      const next = Date.now() - startedAt.current
      setElapsed(next)
      if (next >= MAX_VIDEO_SECONDS * 1000) finishRecording()
    }, 200)
  }

  function retake() {
    if (clipUrl) URL.revokeObjectURL(clipUrl)
    setClipUrl(null)
    setClip(null)
    setElapsed(0)
    setPhase('ready')
    setMessage('')
  }

  async function publish() {
    if (!clip) return
    if (!title.trim()) {
      setMessage('Add a short title or prompt.')
      return
    }
    setPublishing(true)
    setMessage('')
    const body = new FormData()
    const type = clip.type.split(';')[0] || 'video/webm'
    const extension = type.includes('mp4') ? 'mp4' : 'webm'
    body.set('title', title.trim())
    body.set('durationMs', String(elapsed))
    body.set('video', clip, `clip.${extension}`)
    const response = await fetch('/api/videos', { method: 'POST', body })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setPublishing(false)
      setMessage(data.error || 'Could not publish that video.')
      return
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    window.location.href = '/'
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-8">
      <p className="text-sm text-mist">Posting as {displayName}</p>
      <h1 className="mt-1 text-center font-display text-4xl italic">Look into the lens.</h1>
      <p className="mt-2 max-w-md text-center text-mist">The frame stays circular, and the clip stops at {MAX_VIDEO_SECONDS} seconds.</p>

      <div className="mt-6 w-[min(78vw,420px)]">
        {phase === 'review' && clipUrl ? (
          <CircularVideo ref={playbackRef} src={clipUrl} className="w-full lens-rest" />
        ) : (
          <CircularVideo ref={previewRef} mirror className={`w-full ${phase === 'recording' ? 'lens-live' : 'lens-rest'}`} />
        )}
      </div>
      <p className="mt-4 font-display text-2xl tabular-nums">
        {clock(elapsed)} <span className="text-base text-mist">/ {clock(MAX_VIDEO_SECONDS * 1000)}</span>
      </p>
      {phase === 'recording' ? <p className="text-sm font-semibold text-sun">Recording. It will stop at the limit.</p> : null}
      {phase === 'review' ? <p className="text-sm text-mist">This is what others will see.</p> : null}
      {message ? <p className="mt-3 max-w-md text-center text-sm text-berry">{message}</p> : null}

      <div className="mt-5 flex w-full max-w-md flex-col gap-3">
        {phase === 'ready' && !cameraOn ? (
          <button type="button" onClick={openCamera} className="rounded-full bg-sun px-4 py-3 font-semibold text-white">
            Use camera
          </button>
        ) : null}
        {phase === 'ready' && cameraOn ? (
          <button type="button" onClick={startRecording} className="rounded-full bg-sun px-4 py-3 font-semibold text-white">
            Record
          </button>
        ) : null}
        {phase === 'recording' ? (
          <button type="button" onClick={finishRecording} className="rounded-full bg-ink px-4 py-3 font-semibold text-white">
            Stop
          </button>
        ) : null}
        {phase === 'review' ? (
          <>
            <button
              type="button"
              onClick={() => {
                const element = playbackRef.current
                if (!element) return
                if (element.paused) {
                  element.muted = false
                  element.play().catch(() => undefined)
                } else element.pause()
              }}
              className="rounded-full border border-line bg-foam px-4 py-3 font-semibold"
            >
              Play back
            </button>
            <label className="text-sm font-semibold">
              Title or prompt
              <input
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Something that made me smile today"
                className="field"
              />
            </label>
            <button type="button" onClick={publish} disabled={publishing} className="rounded-full bg-sun px-4 py-3 font-semibold text-white disabled:opacity-50">
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
            <button type="button" onClick={retake} className="rounded-full border border-line px-4 py-3">
              Discard and re-record
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
