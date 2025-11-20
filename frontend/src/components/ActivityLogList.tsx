import React, { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import apiClient from '@/services/api'

interface ActivityLog {
  _id: string
  userId: string
  action: string
  details: any
  createdAt: string
}

interface ActivityLogListProps {
  entityId: string
  entityType: string
}

export const ActivityLogList = ({ entityId }: ActivityLogListProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [entityId])

  const fetchLogs = async () => {
    try {
      const data = await apiClient.get(`/activity-logs/entity/${entityId}`)
      setLogs(data as any)
    } catch (error) {
      console.error('Failed to fetch activity logs', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading activity...</div>

  if (logs.length === 0) {
    return <div className="text-sm text-gray-500">No activity yet.</div>
  }

  return (
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log._id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
            {/* Placeholder for user avatar/initials. In real app, fetch user details */}U
          </div>
          <div>
            <p className="text-sm text-gray-800">
              <span className="font-bold">User</span> {formatAction(log.action)}
            </p>
            <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatAction(action: string): string {
  switch (action) {
    case 'create_card':
      return 'created this card'
    case 'update_card':
      return 'updated this card'
    default:
      return action.replace('_', ' ')
  }
}
