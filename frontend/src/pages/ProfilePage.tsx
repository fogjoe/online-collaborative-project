import React, { useEffect, useState } from 'react'
import { User, Mail, Save, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { userApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner' // Assuming you use sonner or similar

export const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatarUrl: ''
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
        avatarUrl: user.avatarUrl || ''
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
      </div>
    </DashboardLayout>
  )
}
