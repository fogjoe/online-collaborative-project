import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { projectApi } from '@/services/api'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { CreateProjectDialog } from './Dashboard/CreateProjectDialog'

// Define Types
interface Project {
  id: number
  name: string
  description: string
  createdAt: string
  avatarUrl?: string
}

export const DashboardPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // If null, the dialog is closed. If a number, the dialog is open.
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null)

  const openDeleteDialog = (id: number) => {
    setProjectToDelete(id)
  }

  const confirmDelete = () => {
    if (!projectToDelete) return

    const id = projectToDelete // Capture ID

    projectApi
      .delete(id)
      .then(() => {
        toast.success('Project deleted')
        // Update UI
        setProjects(prev => prev.filter(p => p.id !== id))
      })
      .catch(error => {
        console.error('Failed to delete project', error)
        toast.error('Failed to delete project')
      })
      .finally(() => {
        // Close the dialog
        setProjectToDelete(null)
      })
  }

  const fetchProjects = async () => {
    try {
      const response = await projectApi.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* 1. Header Section */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Your Project Spaces</h1>
          <CreateProjectDialog onProjectCreated={fetchProjects} />
        </div>

        {/* 2. Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-teal-600 h-8 w-8" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-600">No projects yet</h3>
            <p className="mt-2">Create your first project space to get started.</p>
          </div>
        ) : (
          /* Grid Layout matching the image (2 Columns) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} onDelete={openDeleteDialog} />
            ))}

            <AlertDialog open={!!projectToDelete} onOpenChange={open => !open && setProjectToDelete(null)}>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the project and remove all associated lists and cards.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// --- Sub-Component: The Project Card ---
// This isolates the complex card layout from the main logic
const ProjectCard = ({ project, index, onDelete }: { project: Project; index: number; onDelete: (id: number) => void }) => {
  // Generate deterministic random avatars based on project ID
  // Logic: Use the uploaded URL if it exists, otherwise fallback to random avatar
  // Note: We use 'project.id' to generate a consistent random avatar for fallback
  const displayAvatar = project.avatarUrl ? project.avatarUrl : `https://i.pravatar.cc/150?u=${project.id + 'owner'}`
  const memberAvatars = [1, 2, 3, 4].map(i => `https://i.pravatar.cc/150?u=${project.id + 'member' + i}`)

  return (
    <div className="relative group">
      <Link
        to={`/board/${project.id}`}
        className="block group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        // 👇 利用 index 动态计算延迟时间
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-transparent hover:border-teal-100 flex gap-5 h-full">
          {/* Left Column: Avatars */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* Main Owner Avatar */}
            <img
              src={displayAvatar}
              alt="Owner"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              onError={e => {
                e.currentTarget.src = `https://i.pravatar.cc/150?u=${project.id}`
              }}
            />

            {/* Team Grid (2x2) */}
            <div className="grid grid-cols-2 gap-1 mt-auto">
              {memberAvatars.map((src, i) => (
                <img key={i} src={src} alt="Member" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Right Column: Text Content */}
          <div className="flex flex-col pt-1">
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#0F766E] transition-colors leading-tight mb-3">{project.name}</h3>

            {/* Dummy Description Text to match image style */}
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{project.description || 'Reviews, interviews, and three covered concepts for the new design system...'}</p>
          </div>
        </div>
      </Link>

      <button
        onClick={e => {
          e.preventDefault() // Prevent clicking the link
          e.stopPropagation()
          onDelete(project.id)
        }}
        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
        title="Delete Project"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  )
}
