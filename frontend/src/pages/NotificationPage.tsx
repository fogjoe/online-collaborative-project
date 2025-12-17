import React, { useEffect, useState } from 'react'
import { Bell, CheckCircle, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { notificationApi } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Notification {
  id: number
  message: string
  isRead: boolean
  createdAt: string
  projectId?: number
}

export const NotificationPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll()
      setNotifications(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    await notificationApi.markRead(id)
    // Update UI locally
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications()
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Bell size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 && <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">No notifications yet.</div>}

          {notifications.map(notif => (
            <Card key={notif.id} className={`p-5 transition-all ${notif.isRead ? 'bg-white opacity-70' : 'bg-blue-50/50 border-blue-200 shadow-sm'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-500'}`} />
                  <div>
                    <p className={`text-sm ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Clock size={12} />
                      {formatDate(notif.createdAt)}
                    </div>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 text-xs">
                    Mark as read
                  </Button>
                )}
                {notif.isRead && <CheckCircle size={16} className="text-slate-300 mt-1" />}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
