import React, { useState, useEffect } from 'react'
import { Trash2, Save, AlertTriangle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, User } from '@/pages/BoardPage'

interface EditCardDialogProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onSave: (cardId: number, data: { title: string; description: string }) => Promise<void>
  onDelete: (cardId: number) => Promise<void>
  
  // ✅ New Props for Member Management
  projectMembers: User[]
  onAssign: (cardId: number, userId: number) => Promise<void>
  onUnassign: (cardId: number, userId: number) => Promise<void>
}

// Helper to get initials (e.g., "John Doe" -> "JD")
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const EditCardDialog = ({ 
  card, isOpen, onClose, onSave, onDelete, 
  projectMembers, onAssign, onUnassign 
}: EditCardDialogProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || '')
    }
  }, [card])

  // Filter members who are NOT yet assigned to this card
  const unassignedMembers = card 
    ? projectMembers.filter(m => !card.assignees.some(a => a.id === m.id))
    : []

  const handleSave = async () => {
    if (!card) return
    setIsLoading(true)
    try {
      await onSave(card.id, { title, description })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!card) return
    setIsLoading(true)
    try {
      await onDelete(card.id)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Increased width to 700px to accommodate the sidebar layout */}
      <DialogContent className="sm:max-w-[700px] bg-white shadow-2xl border-0 p-0 overflow-hidden gap-0">
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900">Edit Card</DialogTitle>
          <DialogDescription className="hidden">Edit card details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-0">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="p-6 pt-2 pr-6 md:border-r border-slate-100 flex flex-col gap-5">
            {/* Title Input */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                Card Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-medium text-base h-11 border-slate-200 focus-visible:ring-[#0F766E]"
                placeholder="Enter title..."
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
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px] resize-none text-slate-600 border-slate-200 focus-visible:ring-[#0F766E] text-sm leading-relaxed"
                placeholder="Add more details about this task..."
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Metadata & Actions) */}
          <div className="bg-slate-50/50 p-6 pt-2 space-y-6">
            
            {/* ASSIGNEES SECTION */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assignees
              </Label>
              
              {/* List of Assigned Users */}
              <div className="flex flex-col gap-2">
                {card.assignees.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No members assigned</span>
                )}
                
                {card.assignees.map((user) => (
                  <div key={user.id} className="group flex items-center justify-between bg-white rounded-md p-2 pl-2 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-[9px] bg-[#0F766E] text-white">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[80px]">
                        {user.username}
                      </span>
                    </div>
                    <button 
                      onClick={() => onUnassign(card.id, user.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Remove member"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Member Dropdown */}
              <Select 
                onValueChange={(val) => onAssign(card.id, Number(val))}
                disabled={unassignedMembers.length === 0}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-white border-dashed border-slate-300 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors">
                  <SelectValue placeholder={unassignedMembers.length > 0 ? "+ Add Member" : "All members added"} />
                </SelectTrigger>
                <SelectContent align="end">
                  {unassignedMembers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()} className="text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                           <AvatarFallback className="text-[8px] bg-slate-200">
                             {getInitials(user.username)}
                           </AvatarFallback>
                        </Avatar>
                        {user.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Other sidebar items can go here (e.g., Due Date, Labels) */}

          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sm:justify-between w-full">
          
          {/* Delete Button (Left) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 transition-colors h-9 text-sm"
              >
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
                  <AlertDialogTitle className="text-lg font-bold text-slate-900">
                    Delete this card?
                  </AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed ml-11">
                  This action cannot be undone. The card 
                  <span className="font-semibold text-slate-900 mx-1">"{card.title}"</span> 
                  will be permanently removed from the board.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save Actions (Right) */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="h-9 text-sm border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !title.trim()}
              className="h-9 text-sm bg-[#0F766E] hover:bg-[#0d655e] text-white shadow-sm px-5"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Save size={14} className="mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}