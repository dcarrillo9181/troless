'use client'

import { useRef, useState } from 'react'
import { CircularVideo } from './CircularVideo'

export function ProfileClip({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  return (
    <figure className="w-[min(70vw,280px)]">
      <button
        type="button"
        className="block w-full"
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        onClick={() => {
          const element = ref.current
          if (!element) return
          if (element.paused) {
            element.play().then(() => setPlaying(true)).catch(() => undefined)
          } else {
            element.pause()
            setPlaying(false)
          }
        }}
      >
        <CircularVideo ref={ref} src={src} muted={muted} loop className="w-full" />
      </button>
      <figcaption className="mt-3 font-display text-2xl leading-tight">{title}</figcaption>
      <button
        type="button"
        className="mt-2 text-sm text-mist underline"
        onClick={() => {
          setMuted((current) => {
            if (ref.current) ref.current.muted = !current
            return !current
          })
        }}
      >
        {muted ? 'Tap for sound' : 'Mute'}
      </button>
    </figure>
  )
}
