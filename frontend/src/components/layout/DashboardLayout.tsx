import React from 'react'
import { LayoutDashboard, Bell, User, Settings, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 判断当前路径是否激活
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar - 侧边栏 */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
            {/* 一个简单的 Logo 图标 */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4 text-white">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-800">Project Flow</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="All Projects" active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Bell size={20} />} label="Notifications" active={isActive('/notifications')} onClick={() => {}} />
          <NavItem icon={<User size={20} />} label="My Profile" active={isActive('/profile')} onClick={() => {}} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={isActive('/settings')} onClick={() => {}} />
        </nav>

        {/* Logout Button (Bottom) */}
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area - 主内容区 */}
      {/* ml-64 留出侧边栏的宽度，防止内容被遮挡 */}
      <main className="flex-1 md:ml-64 min-h-screen bg-slate-50">{children}</main>
    </div>
  )
}

// 辅助组件：导航项
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

const NavItem = ({ icon, label, active = false, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    {label}
  </button>
)
