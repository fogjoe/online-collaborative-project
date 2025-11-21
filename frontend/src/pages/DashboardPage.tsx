import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projectApi } from '@/services/api' // 引入 API

// 定义数据类型
interface Project {
  id: number
  name: string
  description: string
  createdAt: string
}

export const DashboardPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 📥 页面加载时获取数据
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getAll()
        // 这里的 response.data 已经是拦截器处理过的 { code, message, data } 里的 data
        // 或者如果你的拦截器只在 data 字段返回，请检查 console.log(response)
        setProjects(response.data)
      } catch (error) {
        console.error('Failed to fetch projects', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Your Project Spaces</h1>
            <p className="text-slate-500">Manage your active sprints and boards</p>
          </div>
          {/* 这个按钮还没功能，下一步我们做弹窗 */}
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus size={18} /> Create New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 text-slate-500">You have no projects yet. Create one!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Link key={project.id} to={`/board/${project.id}`} className="group">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                  {/* 显示真实数据 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">{project.name.charAt(0).toUpperCase()}</div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">{project.name}</h3>
                  <p className="text-sm text-slate-500 mt-auto">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
