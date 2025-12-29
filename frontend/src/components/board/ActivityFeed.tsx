import React, { useEffect, useState } from 'react'
import { activityApi } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Loader2, Activity as ActivityIcon } from 'lucide-react'

type ActivityAction = 'created_card' | 'updated_card' | 'moved_card' | 'added_comment' | 'invited_member'

interface ActivityMetadata {
  cardId?: number
  cardTitle?: string
  listId?: number
  listName?: string
  fromList?: { id?: number; name?: string }
  toList?: { id?: number; name?: string }
  memberEmail?: string
  [key: string]: unknown
}

interface ActivityValue {
  title?: string
  description?: string
  labelIds?: number[]
  email?: string
  [key: string]: unknown
}

interface ActivityRecord {
  id: number
  action: ActivityAction
  metadata?: ActivityMetadata | null
  newValue?: ActivityValue | null
  oldValue?: ActivityValue | null
  createdAt: string
  actor?: {
    id: number
    username: string
  } | null
}

interface ActivityFeedProps {
  projectId: number
  isOpen?: boolean
}

const toLocalDate = (value: string) => new Date(value.endsWith('Z') ? value : `${value}Z`)

const actorName = (activity: ActivityRecord) => activity.actor?.username ?? 'System'

const formatSummary = (activity: ActivityRecord) => {
  const name = actorName(activity)
  const meta = activity.metadata || {}
  const newValue = activity.newValue || {}

  switch (activity.action) {
    case 'created_card': {
      const listLabel = meta.listName ? ` in ${meta.listName}` : ''
      const cardLabel = newValue.title || meta.cardTitle || 'a card'
      return `${name} created "${cardLabel}"${listLabel}`
    }
    case 'updated_card':
      return `${name} updated "${meta.cardTitle || newValue.title || 'a card'}"`
    case 'moved_card': {
      const fromLabel = meta.fromList?.name ?? 'one list'
      const toLabel = meta.toList?.name ?? 'another list'
      return `${name} moved "${meta.cardTitle || 'a card'}" from ${fromLabel} to ${toLabel}`
    }
    case 'added_comment':
      return `${name} commented on "${meta.cardTitle || 'a card'}"`
    case 'invited_member':
      return `${name} invited ${meta.memberEmail || newValue.email}`
    default:
      return `${name} performed an action`
  }
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId, isOpen }) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)

  const loadActivities = async (reset = false) => {
    if (isLoading) return
    setIsLoading(true)
    if (reset) {
      setIsInitialLoading(true)
    }

    try {
      const res = await activityApi.list(projectId, reset ? undefined : cursor || undefined)
      const payload = res.data ?? res
      const items: ActivityRecord[] = payload?.data ?? []
      const nextCursor = payload?.nextCursor ?? null

      setActivities(prev => (reset ? items : [...prev, ...items]))
      setCursor(nextCursor)
    } catch (error) {
      console.error('Failed to load activity feed', error)
    } finally {
      setIsLoading(false)
      if (reset) {
        setIsInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    setActivities([])
    setCursor(null)
    void loadActivities(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (isOpen) {
      void loadActivities(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon size={18} className="text-teal-700" />
          <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => loadActivities(true)} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {isInitialLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading activity...
          </div>
        )}

        {!isInitialLoading && activities.length === 0 && <div className="text-sm text-slate-400">No activity yet. Start collaborating!</div>}

        {activities.map((activity) => (
          <div key={activity.id} className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
            <p className="text-sm text-slate-700">{formatSummary(activity)}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(toLocalDate(activity.createdAt), { addSuffix: true })}</p>
          </div>
        ))}
      </div>

      {cursor && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => loadActivities()} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" /> Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
