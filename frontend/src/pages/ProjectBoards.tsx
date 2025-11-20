import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Board {
  id: string
  name: string
  createdAt: string
}

interface Project {
  id: string
  name: string
}

export const ProjectBoardsPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectData, boardsData] = await Promise.all([projectsApi.getOne(projectId!), boardsApi.getAll(projectId!)])
      setProject(projectData)
      setBoards(boardsData)
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim() || !projectId) return

    try {
      await boardsApi.create({ name: newBoardName, projectId })
      setNewBoardName('')
      setIsCreating(false)
      fetchData()
    } catch (error) {
      console.error('Failed to create board', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!project) return <div className="p-8">Project not found</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/dashboard')}>
              Projects
            </span>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name} Boards</h1>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>{isCreating ? 'Cancel' : '+ Create New Board'}</Button>
      </header>

      {isCreating && (
        <Card className="mb-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create New Board</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <Label htmlFor="name">Board Name</Label>
                <Input id="name" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="e.g. Sprint 1" required />
              </div>
              <Button type="submit" className="w-full">
                Create Board
              </Button>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map(board => (
          <Card key={board.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/board/${board.id}`)}>
            <CardHeader>
              <CardTitle>{board.name}</CardTitle>
              <CardDescription>Created {new Date(board.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
          </Card>
        ))}

        {boards.length === 0 && !isCreating && <div className="col-span-full text-center py-12 text-gray-500">No boards in this project yet. Create one to start organizing!</div>}
      </div>
    </div>
  )
}
