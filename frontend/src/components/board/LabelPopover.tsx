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
  onUpdate: () => void // Callback to refresh card data
}

export const LabelPopover = ({ cardId, projectId, activeLabelIds, onUpdate }: LabelPopoverProps) => {
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

  const handleToggle = async (labelId: number) => {
    try {
      await labelApi.toggleCardLabel(cardId, labelId)
      onUpdate() // Refresh parent
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
        <Button variant="outline" size="sm" className="gap-2 w-full justify-start text-slate-600">
          <Tag size={16} />
          Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 bg-white" align="start">
        {/* Header */}
        <div className="text-sm font-semibold text-center mb-3 text-slate-700">Labels</div>

        {!isCreating ? (
          <>
            <Input placeholder="Search labels..." value={search} onChange={e => setSearch(e.target.value)} className="mb-3 h-8 text-xs" />

            <div className="space-y-1 max-h-[200px] overflow-y-auto mb-3">
              {filteredLabels.map(label => {
                const isActive = activeLabelIds.includes(label.id)
                return (
                  <div key={label.id} onClick={() => handleToggle(label.id)} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors group">
                    <div className="flex-1">
                      <LabelBadge
                        color={label.color}
                        name={label.name}
                        className="h-6 text-xs px-3 w-full flex items-center shadow-none" 
                      />
                    </div>

                    {isActive && <Check size={16} className="text-slate-600" />}
                  </div>
                )
              })}
            </div>

            <Button variant="secondary" className="w-full h-8 text-xs" onClick={() => setIsCreating(true)}>
              <Plus size={14} className="mr-2" />
              Create a new label
            </Button>
          </>
        ) : (
          /* Create Mode */
          <div className="space-y-3">
            <Input placeholder="Label name" value={newLabelName} onChange={e => setNewLabelName(e.target.value)} autoFocus className="h-8" />

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
              <Button variant="default" className="flex-1 h-8 text-xs bg-[#0F766E]" onClick={handleCreate} disabled={!newLabelName}>
                Create
              </Button>
              <Button variant="ghost" className="h-8 text-xs" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
