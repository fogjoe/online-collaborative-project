import React from 'react'
import { LayoutDashboard, Bell, User, LogOut, Orbit } from 'lucide-react'
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

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white hidden md:flex flex-col fixed inset-y-0 h-full z-10 shadow-sm">
        {/* 1. Teal Logo Area (Fixed logo) */}
        <div className="h-24 flex justify-center items-center px-6 bg-[#107682]">
          {/* Use the Orbit icon with the correct teal color and bolder stroke */}
          <Orbit size={40} strokeWidth={2.5} className="text-white" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="All Projects" active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} />
          {/* Mock links to match image */}
          <NavItem icon={<Bell size={20} />} label="Notifications" active={false} onClick={() => navigate('/notifications')} />
          <NavItem icon={<User size={20} />} label="Profile" active={false} onClick={() => {}} />
        </nav>

        {/* Logout */}
        <div className="p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">{children}</main>
    </div>
  )
}

// Helper Component for Sidebar Items
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

const NavItem = ({ icon, label, active = false, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
      active
        ? 'border-[#0F766E] bg-[#E0F2F1] text-[#0F766E]' // Active: Teal border & light bg
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    {label}
  </button>
)
