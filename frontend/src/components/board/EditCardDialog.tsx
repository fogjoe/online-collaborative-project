import React, { useState, useEffect } from 'react'
import { Trash2, Save, AlertTriangle } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/pages/BoardPage'

interface EditCardDialogProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onSave: (cardId: number, data: { title: string; description: string }) => Promise<void>
  onDelete: (cardId: number) => Promise<void>
}

export const EditCardDialog = ({ card, isOpen, onClose, onSave, onDelete }: EditCardDialogProps) => {
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
      {/* Fix 1: Add 'bg-white' explicitly to ensure the modal isn't transparent 
        Fix 2: 'sm:max-w-[500px]' gives it a good width on desktop
      */}
      <DialogContent className="sm:max-w-[500px] bg-white shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Edit Card</DialogTitle>
          <DialogDescription className="hidden">Edit card details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
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
              className="min-h-[120px] resize-none text-slate-600 border-slate-200 focus-visible:ring-[#0F766E] text-sm leading-relaxed"
              placeholder="Add more details about this task..."
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
          
          {/* Delete Button (Left) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 transition-colors"
              >
                <Trash2 size={16} className="mr-2" /> 
                Delete
              </Button>
            </AlertDialogTrigger>
            
            {/* Fix 3: Styling the Alert Dialog Content 
              Added 'bg-white' so it doesn't blend into the dark overlay 
            */}
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
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !title.trim()}
              className="bg-[#0F766E] hover:bg-[#0d655e] text-white shadow-sm px-5"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Save size={16} className="mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}