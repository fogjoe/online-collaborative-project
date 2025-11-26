import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Image as ImageIcon, Upload } from 'lucide-react'
import { projectApi } from '@/services/api'

interface CreateProjectDialogProps {
  onProjectCreated: () => void // Callback to refresh the list
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Since we are uploading a file, we MUST use FormData instead of a standard JSON object
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }
      // Note: If no avatar is uploaded, the backend should handle the default avatar logic

      // We need to cast formData as any or update your api.ts type definition
      // because standard JSON interfaces don't usually accept FormData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await projectApi.create(formData as any)

      setOpen(false) // Close dialog

      // Reset Form
      setName('')
      setDescription('')
      setAvatarFile(null)
      setAvatarPreview(null)

      onProjectCreated() // Tell parent to refresh
    } catch (error) {
      console.error('Failed to create project', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Plus size={18} /> Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a new space for your team to collaborate.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="avatar" className="self-start">
                Project Avatar
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 hover:border-teal-500 cursor-pointer flex items-center justify-center bg-gray-50 overflow-hidden transition-colors group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  // Default Avatar / Upload Placeholder
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-teal-600">
                    <ImageIcon size={24} />
                    <span className="text-[10px] mt-1 font-medium">Upload</span>
                  </div>
                )}

                {/* Overlay on hover if image exists */}
                {avatarPreview && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="text-white h-5 w-5" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <span className="text-xs text-slate-400">Optional. Default avatar will be used if skipped.</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q4 Marketing Sprint" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
