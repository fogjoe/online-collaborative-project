import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LabelBadge } from './LabelBadge'

interface Label {
  id: number
  name: string
  color: string
}

interface CardLabelsPreviewProps {
  labels: Label[]
}

export const CardLabelsPreview = ({ labels }: CardLabelsPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopoverPosition({
        top: rect.top - 8, // Position above with some gap
        left: rect.left + rect.width / 2
      })
    }
  }, [isHovered])

  const showPopover = () => setIsHovered(true)

  const handleMouseLeave = (event: React.MouseEvent) => {
    const nextTarget = event.relatedTarget as Node | null
    if (nextTarget) {
      if (triggerRef.current?.contains(nextTarget) || popoverRef.current?.contains(nextTarget)) {
        return
      }
    }
    setIsHovered(false)
  }

  if (!labels || labels.length === 0) return null

  const firstLabel = labels[0]
  const remainingCount = labels.length - 1

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={showPopover}
      onMouseLeave={handleMouseLeave}
    >
      {/* Compact preview: 1 label + count */}
      <div className="flex items-center gap-1">
        <LabelBadge
          color={firstLabel.color}
          name={firstLabel.name}
          className="text-[10px] px-2 py-0.5 shadow-none"
        />
        {remainingCount > 0 && (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full cursor-default">
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Hover popover using portal to escape overflow */}
      {isHovered && labels.length > 1 && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseEnter={showPopover}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[180px] max-w-[280px]">
            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />

            {/* Header */}
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 pb-2 border-b border-slate-100">
              All Labels ({labels.length})
            </div>

            {/* Labels list */}
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <LabelBadge
                  key={label.id}
                  color={label.color}
                  name={label.name}
                  className="text-[10px] px-2 py-0.5"
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
