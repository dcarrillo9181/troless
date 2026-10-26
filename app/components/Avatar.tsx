export function Avatar({ name, hue, size = 44 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-[3px] ring-[#ffe4d2]"
      style={{ width: size, height: size, background: `hsl(${hue} 62% 46%)`, fontSize: size < 40 ? 12 : 16 }}
    >
      {initials}
    </span>
  )
}
