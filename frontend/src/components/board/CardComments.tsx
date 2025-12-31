import React, { useEffect, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { commentApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: number
  username: string
  avatarUrl?: string
}

interface Comment {
  id: number
  content: string
  createdAt: string
  user: User
}

interface CardCommentsProps {
  cardId: number
  refreshKey?: number
}

export const CardComments = ({ cardId, refreshKey }: CardCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Backend timestamps are returned as UTC without timezone info ("YYYY-MM-DD HH:mm:ss").
  // Append a Z so Date treats them as UTC and then converts to the viewer's local time.
  const toLocalDate = (value?: string) => {
    if (!value) return new Date()
    return new Date(value.endsWith('Z') ? value : `${value}Z`)
  }

  // Load comments when component mounts
  useEffect(() => {
    loadComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, refreshKey])

  const loadComments = async () => {
    try {
      const res = await commentApi.getComments(cardId)
      // Ensure we access the correct data structure
      const data = res.data.data || res.data
      setComments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load comments', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await commentApi.createComment(cardId, newComment)
      await loadComments()
      setNewComment('')
    } catch (error) {
      console.error('Failed to post comment', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 mt-4 pt-5 border-t border-slate-100">
      <div className="flex items-center gap-2 text-slate-900 font-semibold">
        <MessageSquare size={18} />
        <h3>Activity & Comments</h3>
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        {/* Optional: Show current user avatar here if available in context */}
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
          {newComment.trim() && (
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="bg-[#0F766E] text-white hover:bg-[#0d655e]">
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send size={14} className="mr-2" /> Post
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-5">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage className="object-cover" src={comment.user?.avatarUrl} />
              <AvatarFallback className="text-xs font-bold bg-indigo-100 text-indigo-600">{comment.user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-900">{comment.user?.username || 'Unknown'}</span>
                <span className="text-xs text-slate-400">{formatDistanceToNow(toLocalDate(comment.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-r-lg rounded-bl-lg">{comment.content}</div>
            </div>
          </div>
        ))}

        {comments.length === 0 && <div className="text-center py-4 text-slate-400 text-sm italic">No comments yet. Start the conversation!</div>}
      </div>
    </div>
  )
}
