import React from 'react'

interface LabelBadgeProps {
  color: string
  name: string
  className?: string
}

const hexToRgb = (hex: string) => {
  let parsed = hex.replace('#', '')
  if (parsed.length === 3) {
    parsed = parsed
      .split('')
      .map(char => char + char)
      .join('')
  }
  const value = Number.parseInt(parsed, 16)
  if (Number.isNaN(value) || parsed.length !== 6) return null
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  }
}

const toRgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export const LabelBadge = ({ color, name, className = '' }: LabelBadgeProps) => {
  const backgroundColor = toRgba(color, 0.12)
  const borderColor = toRgba(color, 0.32)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm ${className}`}
      style={{ backgroundColor, borderColor }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate max-w-[110px]">{name}</span>
    </span>
  )
}
