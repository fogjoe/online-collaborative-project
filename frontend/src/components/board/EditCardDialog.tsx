import React, { useState, useEffect } from 'react'
import { Trash2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription // Required for accessibility
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
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/pages/BoardPage' // Or wherever your Card interface is defined

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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription className="hidden">Make changes to your card here.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title Input */}
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-slate-600">
              Card Title
            </Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="font-semibold text-lg" placeholder="Card title" />
          </div>

          {/* Description Input */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-slate-600">
              Description
            </Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[120px] resize-none text-slate-700" placeholder="Add more details..." />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {/* Delete Button (Left side) with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 px-2">
                <Trash2 size={16} /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the card
                  <span className="font-semibold text-slate-900"> "{card.title}"</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save Actions (Right side) */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !title.trim()} className="bg-[#0F766E] hover:bg-[#0d655e] text-white gap-2">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
