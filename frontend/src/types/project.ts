export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface ProjectMember {
  id: number
  username: string
  email: string
  avatarUrl?: string
  role: ProjectRole
}

export interface ProjectSummary {
  id: number
  name: string
  description: string
  createdAt: string
  avatarUrl?: string
  currentUserRole?: ProjectRole | null
}
