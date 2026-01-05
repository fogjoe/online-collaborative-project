import React, { useEffect, useState } from 'react'
import { User, Mail, Save, Loader2, Bell } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { userApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner' // Assuming you use sonner or similar

interface ProfileFormData {
  username: string
  email: string
  avatarUrl: string
  notifyDueSoonInApp: boolean
  notifyDueSoonEmail: boolean
  notifyOverdueInApp: boolean
  notifyOverdueEmail: boolean
}

type NotificationPreferenceKey = keyof Pick<
  ProfileFormData,
  'notifyDueSoonInApp' | 'notifyDueSoonEmail' | 'notifyOverdueInApp' | 'notifyOverdueEmail'
>

export const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    avatarUrl: '',
    notifyDueSoonInApp: true,
    notifyDueSoonEmail: true,
    notifyOverdueInApp: true,
    notifyOverdueEmail: true
  })

  // Load initial data
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const res = await userApi.getProfile()
      const user = res?.data
      setFormData({
        username: user.username || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
        notifyDueSoonInApp: user.notifyDueSoonInApp ?? true,
        notifyDueSoonEmail: user.notifyDueSoonEmail ?? true,
        notifyOverdueInApp: user.notifyOverdueInApp ?? true,
        notifyOverdueEmail: user.notifyOverdueEmail ?? true
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await userApi.updateProfile(formData)
      toast.success('Profile updated successfully')

      // Update local storage if you store user info there
      // localStorage.setItem('user', JSON.stringify(...))
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  // Helper for initials
  const initials = formData.username ? formData.username.substring(0, 2).toUpperCase() : 'ME'

  const togglePreference = (key: NotificationPreferenceKey) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const preferenceDescriptors: Array<{
    key: NotificationPreferenceKey
    label: string
    description: string
  }> = [
    {
      key: 'notifyDueSoonInApp',
      label: 'Due soon reminders (in-app)',
      description: 'Get notifications 24 hours before a card is due.'
    },
    {
      key: 'notifyDueSoonEmail',
      label: 'Due soon reminders (email)',
      description: 'Receive an email when a card is one day from its due date.'
    },
    {
      key: 'notifyOverdueInApp',
      label: 'Overdue alerts (in-app)',
      description: 'Show alerts when a card is past its due date.'
    },
    {
      key: 'notifyOverdueEmail',
      label: 'Overdue alerts (email)',
      description: 'Send a daily email for cards that stay overdue.'
    }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Account Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm">
                  <AvatarImage className="object-cover" src={formData.avatarUrl} />
                  <AvatarFallback className="text-2xl bg-slate-200 text-slate-600 font-bold">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <Label>Avatar URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.avatarUrl}
                      onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="https://github.com/my-image.png"
                      className="text-sm font-mono text-slate-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Paste an image URL from GitHub, Unsplash, or Gravatar.</p>
                </div>
              </div>

              {/* Username */}
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="pl-9" placeholder="johndoe" />
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="pl-9" placeholder="john@example.com" />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving || isLoading} className="bg-[#0F766E] hover:bg-[#0d655e] text-white min-w-[120px]">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferenceDescriptors.map(pref => (
              <div key={pref.key} className="flex items-center justify-between border rounded-xl px-4 py-3 bg-slate-50/60">
                <div>
                  <p className="text-sm font-medium text-slate-800">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData[pref.key]}
                  onClick={() => togglePreference(pref.key)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                    formData[pref.key] ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      formData[pref.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
