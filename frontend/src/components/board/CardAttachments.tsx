import React, { useCallback, useEffect, useRef, useState } from 'react'
import { UploadCloud, Paperclip, Trash2, Loader2, ImageIcon, FileText } from 'lucide-react'
import { attachmentsApi } from '@/services/api'
import type { Card as CardType } from '@/pages/BoardPage'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface CardAttachmentsProps {
  cardId: number
  initialAttachments?: CardType['attachments']
  onRefreshCard?: () => Promise<void>
}

export type AttachmentItem = CardType['attachments'][number]

const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.md'

const formatFileSize = (size: number) => {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const toLocalDate = (value?: string) => {
  if (!value) return new Date()
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}

const getIconForMime = (mime: string) => {
  if (mime.startsWith('image/')) {
    return <ImageIcon size={16} className="text-sky-500" />
  }
  return <FileText size={16} className="text-slate-400" />
}

export const CardAttachments = ({ cardId, initialAttachments = [], onRefreshCard }: CardAttachmentsProps) => {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setAttachments(initialAttachments ?? [])
  }, [initialAttachments])

  const fetchAttachments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await attachmentsApi.list(cardId)
      setAttachments(res.data ?? [])
    } catch (error) {
      console.error('Failed to load attachments', error)
      toast.error('Unable to load attachments')
    } finally {
      setIsLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    if (!cardId) return
    void fetchAttachments()
  }, [cardId, fetchAttachments])

  const refreshParent = async () => {
    if (!onRefreshCard) return
    try {
      await onRefreshCard()
    } catch (error) {
      console.error('Failed to refresh parent data', error)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        await attachmentsApi.upload(cardId, file)
      }
      toast.success('Attachment uploaded')
      await fetchAttachments()
      await refreshParent()
    } catch (error) {
      console.error('Upload failed', error)
      toast.error('Failed to upload attachment')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleDelete = async (attachmentId: number) => {
    setDeletingId(attachmentId)
    try {
      await attachmentsApi.remove(attachmentId)
      toast.success('Attachment removed')
      await fetchAttachments()
      await refreshParent()
    } catch (error) {
      console.error('Failed to delete attachment', error)
      toast.error('Unable to delete attachment')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <Paperclip size={16} /> Attachments
          {attachments.length > 0 && <span className="text-xs font-normal text-slate-400">({attachments.length})</span>}
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} className="hidden" multiple onChange={handleFileChange} />
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs text-slate-700" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={14} className="mr-2" /> Upload
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-xs text-slate-400">Loading attachments...</div>}

        {!isLoading && attachments.length === 0 && <div className="text-xs text-slate-400 italic">No attachments yet.</div>}

        {attachments.map(attachment => (
          <div key={attachment.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm">{getIconForMime(attachment.mimeType)}</div>
              <div>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-800 hover:text-[#0F766E]">
                  {attachment.originalName}
                </a>
                <div className="text-[11px] text-slate-400">
                  {formatFileSize(Number(attachment.size))} · uploaded {formatDistanceToNow(toLocalDate(attachment.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => handleDelete(attachment.id)} disabled={deletingId === attachment.id}>
              {deletingId === attachment.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

