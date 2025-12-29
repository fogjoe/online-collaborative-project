import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityFeed } from './ActivityFeed'

interface ActivityDrawerProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose, projectId }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Activity</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X size={18} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ActivityFeed projectId={projectId} isOpen={isOpen} />
          </div>
        </div>
      </div>
    </>
  )
}
