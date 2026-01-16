import React, { useState, useEffect, useRef } from 'react'
import { Trash2, Save, AlertTriangle, X, CalendarClock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card as CardType, User } from '@/pages/BoardPage' // Renamed to avoid confusion with UI Card
import { CardComments } from './CardComments'

import { LabelPopover } from './LabelPopover'
import { LabelBadge } from './LabelBadge'
import { CardAttachments } from './CardAttachments'
import { format, formatDistanceToNow, isPast } from 'date-fns'

interface EditCardDialogProps {
  card: CardType | null
  isOpen: boolean
  onClose: () => void
  onSave: (cardId: number, data: { title: string; description: string; labels: CardType['labels']; dueDate: string | null }) => Promise<void>
  onDelete: (cardId: number) => Promise<void>

  projectMembers: User[]
  onAssign: (cardId: number, userId: number) => Promise<void>
  onUnassign: (cardId: number, userId: number) => Promise<void>

  projectId: number
  onCardUpdate: () => Promise<void>
  commentRefreshKey?: number
  canEdit?: boolean
  canComment?: boolean
}

type CardLabel = CardType['labels'][number]

// Helper to get initials (e.g., "John Doe" -> "JD")
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export const EditCardDialog = ({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
  projectMembers,
  onAssign,
  onUnassign,
  projectId,
  onCardUpdate,
  commentRefreshKey,
  canEdit = true,
  canComment = true
}: EditCardDialogProps) => {
  const [cardSnapshot, setCardSnapshot] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<CardType['labels']>([])
  const [dueDateInput, setDueDateInput] = useState('')
  const [assignedMembers, setAssignedMembers] = useState<CardType['assignees']>([])
  const [assigneeSelectValue, setAssigneeSelectValue] = useState<string>('')
  const dueDateInputRef = useRef<HTMLInputElement | null>(null)

  const buildSnapshot = (source: CardType) => {
    const labelIds = (source.labels || []).map(label => label.id).sort((a, b) => a - b)
    const assigneeIds = (source.assignees || []).map(assignee => assignee.id).sort((a, b) => a - b)
    return JSON.stringify({
      id: source.id,
      title: source.title || '',
      description: source.description || '',
      dueDate: source.dueDate || '',
      labelIds,
      assigneeIds
    })
  }

  const hydrateFromCard = (source: CardType) => {
    setTitle(source.title)
    setDescription(source.description || '')
    setSelectedLabels(source.labels || [])
    setDueDateInput(toDateTimeLocal(source.dueDate))
    setAssignedMembers(source.assignees || [])
  }

  useEffect(() => {
    if (!isOpen) return
    if (!card) {
      setTitle('')
      setDescription('')
      setSelectedLabels([])
      setDueDateInput('')
      setAssignedMembers([])
      setCardSnapshot(null)
      return
    }

    const snapshot = buildSnapshot(card)
    if (snapshot !== cardSnapshot) {
      hydrateFromCard(card)
      setCardSnapshot(snapshot)
    }
  }, [card, isOpen, cardSnapshot])

  const resetForm = () => {
    if (!card) {
      setTitle('')
      setDescription('')
      setSelectedLabels([])
      setDueDateInput('')
      setAssignedMembers([])
      setAssigneeSelectValue('')
      setCardSnapshot(null)
      return
    }

    hydrateFromCard(card)
    setCardSnapshot(buildSnapshot(card))
    setAssigneeSelectValue('')
  }

  const handleDialogClose = () => {
    resetForm()
    onClose()
  }

  const handleLocalLabelToggle = (labelData: CardLabel, shouldAdd: boolean) => {
    setSelectedLabels(prev => {
      if (shouldAdd) {
        if (prev.some(label => label.id === labelData.id)) return prev
        return [...prev, labelData]
      }
      return prev.filter(label => label.id !== labelData.id)
    })
  }

  const handleAssignLocal = (userId: number) => {
    if (!card) return
    const userToAdd = projectMembers.find(m => m.id === userId)
    if (!userToAdd) return
    setAssignedMembers(prev => {
      if (prev.some(u => u.id === userId)) return prev
      return [...prev, userToAdd]
    })
    setAssigneeSelectValue('')
  }

  const handleUnassignLocal = (userId: number) => {
    setAssignedMembers(prev => prev.filter(u => u.id !== userId))
  }

  // Filter members who are NOT yet assigned to this card
  const unassignedMembers = card ? projectMembers.filter(m => !assignedMembers.some(a => a.id === m.id)) : []
  const dueDateValue = card?.dueDate ? new Date(card.dueDate) : null
  const isOverdue = !!card && dueDateValue ? isPast(dueDateValue) && !card.isCompleted : false
  const isDueSoon = !!card && dueDateValue ? !isOverdue && dueDateValue.getTime() - Date.now() <= DAY_IN_MS : false
  const dueDistance = dueDateValue ? formatDistanceToNow(dueDateValue, { addSuffix: true }) : ''
  const isReadOnly = !canEdit

  const applyAssigneeChanges = async () => {
    if (!card) return
    const originalIds = card.assignees.map(a => a.id)
    const currentIds = assignedMembers.map(a => a.id)

    const toAdd = currentIds.filter(id => !originalIds.includes(id))
    const toRemove = originalIds.filter(id => !currentIds.includes(id))

    for (const userId of toAdd) {
      await onAssign(card.id, userId)
    }
    for (const userId of toRemove) {
      await onUnassign(card.id, userId)
    }
  }

  const handleSave = async () => {
    if (!card) return
    setIsLoading(true)
    try {
      const dueDateValue = dueDateInput ? new Date(dueDateInput).toISOString() : null
      await applyAssigneeChanges()
      await onSave(card.id, { title, description, labels: selectedLabels, dueDate: dueDateValue })
      await onCardUpdate()
      handleDialogClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!card) return
    setIsLoading(true)
    try {
      await onDelete(card.id)
      handleDialogClose()
    } finally {
      setIsLoading(false)
    }
  }

  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleDialogClose()}>
      {/* Give the dialog a sensible max height so the footer remains visible */}
      <DialogContent className="sm:max-w-[700px] bg-white shadow-2xl border-0 p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
        {/* Header Section */}
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900">Edit Card</DialogTitle>
          <DialogDescription className="hidden">Edit card details</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-0 rounded-2xl border border-slate-100">
            {/* LEFT COLUMN: Main Content */}
            <div className="pt-3 pb-6 px-6 md:px-8 md:border-r border-slate-100 flex flex-col gap-5">
              {/* Title Input */}
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                  Card Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="font-medium text-base h-11 border-slate-200 focus-visible:ring-[#0F766E]"
                  placeholder="Enter title..."
                  disabled={isReadOnly}
                />
              </div>

              {/* Description Input */}
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="min-h-[200px] resize-none text-slate-600 border-slate-200 focus-visible:ring-[#0F766E] text-sm leading-relaxed"
                  placeholder="Add more details about this task..."
                  disabled={isReadOnly}
                />
              </div>

              <CardAttachments cardId={card.id} initialAttachments={card.attachments} onRefreshCard={onCardUpdate} readOnly={isReadOnly} />
            </div>

            {/* RIGHT COLUMN: Sidebar (Metadata & Actions) */}
            <div className="bg-slate-50/60 pt-3 pb-6 px-6 space-y-6">
              {/* ✅ 4. LABELS MANAGER POPOVER */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Labels</Label>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 flex flex-wrap gap-2 min-h-[56px]">
                  {selectedLabels.length > 0 ? (
                    selectedLabels.map(label => <LabelBadge key={`sidebar-${label.id}`} color={label.color} name={label.name} className="shadow-none" />)
                  ) : (
                    <span className="text-xs text-slate-400 italic">No labels selected</span>
                  )}
                </div>
                <LabelPopover projectId={projectId} activeLabelIds={selectedLabels.map(l => l.id)} onLabelToggle={handleLocalLabelToggle} disabled={isReadOnly} />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</Label>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 min-h-[64px] flex items-center">
                  {dueDateValue ? (
                    <div className="w-full flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{format(dueDateValue, 'MMM d, yyyy • h:mm a')}</p>
                        <p className="text-xs text-slate-500">{dueDistance}</p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isOverdue ? 'bg-red-100 text-red-600' : isDueSoon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <CalendarClock size={18} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No due date set</p>
                  )}
                </div>
                <div className="relative">
                  <Input ref={dueDateInputRef} type="datetime-local" step={60} value={dueDateInput} onChange={e => setDueDateInput(e.target.value)} className="text-sm pr-9" disabled={isReadOnly} />
                  <button
                    type="button"
                    aria-label="Open date picker"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onMouseDown={event => {
                      if (isReadOnly) return
                      event.preventDefault()
                      const input = dueDateInputRef.current
                      if ('showPicker' in input!) {
                        ;(input as HTMLInputElement & { showPicker?: () => void }).showPicker?.()
                      }
                    }}
                  >
                    <CalendarClock size={16} />
                  </button>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDueDateInput('')} className="text-xs text-slate-500 hover:text-slate-700" disabled={isReadOnly}>
                    Clear date
                  </Button>
                </div>
              </div>

              {/* ASSIGNEES SECTION */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignees</Label>

                {/* List of Assigned Users */}
                <div className="flex flex-col gap-2">
                  {assignedMembers.length === 0 && <span className="text-xs text-slate-400 italic">No members assigned</span>}

                  {assignedMembers.map(user => (
                    <div key={user.id} className="group flex items-center justify-between bg-white rounded-md p-2 pl-2 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatarUrl} className="object-cover" />
                          <AvatarFallback className="text-[9px] bg-[#0F766E] text-white">{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[110px]">{user.username}</span>
                      </div>
                      {!isReadOnly && (
                        <button onClick={() => handleUnassignLocal(user.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Remove member">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Member Dropdown */}
                <Select
                  value={assigneeSelectValue}
                  onOpenChange={open => {
                    if (!open) {
                      setAssigneeSelectValue('')
                    }
                  }}
                  onValueChange={val => {
                    handleAssignLocal(Number(val))
                    setAssigneeSelectValue('')
                  }}
                  disabled={isReadOnly || unassignedMembers.length === 0}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-dashed border-slate-300 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors">
                    <SelectValue placeholder={unassignedMembers.length !== 0 ? '+ Add Member' : 'All members added'} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {unassignedMembers.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()} className="text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatarUrl} className="object-cover" />
                            <AvatarFallback className="text-[8px] bg-slate-200">{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          {user.username}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pb-2">
            <CardComments cardId={card.id} refreshKey={commentRefreshKey} canComment={canComment} />
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sm:justify-between w-full">
          {/* Delete Button (Left) */}
          {!isReadOnly && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 transition-colors h-9 text-sm">
                  <Trash2 size={14} className="mr-2" />
                  Delete Card
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white shadow-xl border-0 rounded-xl">
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">Delete this card?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed ml-11">
                    This action cannot be undone. The card
                    <span className="font-semibold text-slate-900 mx-1">"{card.title}"</span>
                    will be permanently removed from the board.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Save Actions (Right) */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDialogClose} disabled={isLoading} className="h-9 text-sm border-slate-200 text-slate-700 hover:bg-slate-100">
              Close
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={isLoading || !title.trim()} className="h-9 text-sm bg-[#0F766E] hover:bg-[#0d655e] text-white shadow-sm px-5">
                {isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={14} className="mr-2" /> Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
