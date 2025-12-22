import React from 'react'

interface LabelBadgeProps {
  color: string
  name: string
  className?: string
}

export const LabelBadge = ({ color, name, className = '' }: LabelBadgeProps) => {
  // Map backend hex colors to Tailwind-like styles if needed,
  // or just use inline styles for dynamic colors.
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm inline-block truncate max-w-[100px] ${className}`} style={{ backgroundColor: color }}>
      {name}
    </span>
  )
}
