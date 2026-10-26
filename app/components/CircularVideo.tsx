import { forwardRef, type ReactNode } from 'react'

type Props = {
  src?: string
  muted?: boolean
  loop?: boolean
  mirror?: boolean
  videoId?: string
  className?: string
  children?: ReactNode
}

export const CircularVideo = forwardRef<HTMLVideoElement, Props>(function CircularVideo(
  { src, muted = true, loop = false, mirror = false, videoId, className = '', children },
  ref
) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-full bg-ink ${className}`}>
      <video
        ref={ref}
        src={src}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        data-feed-video={videoId}
        className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
      />
      {children}
    </div>
  )
})
