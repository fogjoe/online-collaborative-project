import React, { useState, useEffect } from 'react'
import { Tag, Plus, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { labelApi } from '@/services/api'
import { LabelBadge } from './LabelBadge'

// Preset colors for easy picking
const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#64748b' // Slate
]

interface Label {
  id: number
  name: string
  color: string
}

interface LabelPopoverProps {
  cardId: number
  projectId: number
  activeLabelIds: number[] // IDs of labels currently on this card
  onUpdate: () => Promise<void> // Callback to refresh card data
  onLabelToggle?: (label: Label, willActivate: boolean) => void
}

export const LabelPopover = ({ cardId, projectId, activeLabelIds, onUpdate, onLabelToggle }: LabelPopoverProps) => {
  const [labels, setLabels] = useState<Label[]>([])
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // New Label State
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadLabels()
  }, [])

  const loadLabels = async () => {
    try {
      const res = await labelApi.getProjectLabels(projectId)
      setLabels(res.data.data || res.data)
    } catch (error) {
      console.error('Failed to load labels', error)
    }
  }

  const handleToggle = async (label: Label) => {
    const willActivate = !activeLabelIds.includes(label.id)
    try {
      await labelApi.toggleCardLabel(cardId, label.id)
      onLabelToggle?.(label, willActivate)
      await onUpdate() // Refresh parent
    } catch (error) {
      console.error('Failed to toggle label', error)
    }
  }

  const handleCreate = async () => {
    if (!newLabelName) return
    try {
      await labelApi.createLabel(projectId, { name: newLabelName, color: selectedColor })
      await loadLabels() // Refresh list
      setNewLabelName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create label', error)
    }
  }

  const filteredLabels = labels.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 justify-between text-xs font-semibold tracking-wide text-slate-600 border-dashed border-slate-300 hover:border-[#0F766E] hover:text-[#0F766E]"
        >
          <span className="flex items-center gap-2">
            <Tag size={15} />
            Labels
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-white rounded-xl shadow-xl border border-slate-100" align="start">
        {/* Header */}
        <div className="text-sm font-semibold text-slate-700 mb-3">Labels</div>

        {!isCreating ? (
          <>
            <Input
              placeholder="Search labels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-3 h-9 text-xs border-slate-200 focus-visible:ring-[#0F766E]"
            />

            <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3 pr-1">
              {filteredLabels.map(label => {
                const isActive = activeLabelIds.includes(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleToggle(label)}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                      isActive ? 'border-[#0F766E]/40 bg-[#0F766E]/5' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <LabelBadge
                      color={label.color}
                      name={label.name}
                      className="flex-1 justify-start text-[11px]"
                    />

                    {isActive && <Check size={16} className="text-[#0F766E]" />}
                  </button>
                )
              })}
              {filteredLabels.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No labels match your search.</p>
              )}
            </div>

            <Button variant="secondary" className="w-full h-9 text-xs" onClick={() => setIsCreating(true)}>
              <Plus size={14} className="mr-2" />
              Create a new label
            </Button>
          </>
        ) : (
          /* Create Mode */
          <div className="space-y-3">
            <Input
              placeholder="Label name"
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              autoFocus
              className="h-9"
            />

            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(color => (
                <div
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-8 rounded cursor-pointer transition-transform hover:scale-105 ${selectedColor === color ? 'ring-2 ring-slate-400 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="default" className="flex-1 h-9 text-xs bg-[#0F766E]" onClick={handleCreate} disabled={!newLabelName}>
                Create
              </Button>
              <Button variant="ghost" className="h-9 text-xs" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
