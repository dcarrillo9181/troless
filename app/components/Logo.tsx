export function Mark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <circle cx="18" cy="18" r="15" fill="#fffaf5" />
      <circle cx="18" cy="18" r="12.5" fill="none" stroke="#ff6a2c" strokeWidth="2.4" />
      <path d="M18 6.2v3.4" stroke="#ff6a2c" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="19.2" r="4.1" fill="#1f6b4a" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark />
      <span className="font-display text-[1.7rem] italic leading-none tracking-tight text-ink">troless</span>
    </span>
  )
}
