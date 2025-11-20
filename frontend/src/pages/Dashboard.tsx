import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '@/services/api'
import { useAuth } from '@/context/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
}

export const DashboardPage = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await projectsApi.getAll()
      setProjects(data as unknown as Project[])
    } catch (error) {
      console.error('Failed to fetch projects', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      await projectsApi.create({ name: newProjectName, description: newProjectDesc })
      setNewProjectName('')
      setNewProjectDesc('')
      setIsCreating(false)
      fetchProjects()
    } catch (error) {
      console.error('Failed to create project', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Project Spaces</h1>
          <p className="text-gray-600">Welcome back, {user?.username}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsCreating(!isCreating)}>{isCreating ? 'Cancel' : '+ Create New Project'}</Button>
          <Button variant="outline" onClick={logout}>
            Log Out
          </Button>
        </div>
      </header>

      {isCreating && (
        <Card className="mb-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Marketing Campaign 2024" required />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Optional description" />
              </div>
              <Button type="submit" className="w-full">
                Create Project
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardFooter className="text-sm text-gray-500">Created {new Date(project.createdAt).toLocaleDateString()}</CardFooter>
            </Card>
          ))}

          {projects.length === 0 && !isCreating && <div className="col-span-full text-center py-12 text-gray-500">You don't have any projects yet. Create one to get started!</div>}
        </div>
      )}
    </div>
  )
}
