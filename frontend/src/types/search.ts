export type SearchType = 'projects' | 'cards' | 'comments'

export interface SearchQueryParams {
  q: string
  filters?: SearchType[]
  projectId?: number
  assignedUserId?: number
  labelIds?: number[]
  dueDateFrom?: string
  dueDateTo?: string
  isCompleted?: boolean
}

export interface SearchProjectResult {
  id: number
  name: string
  description?: string | null
  rank?: number
}

export interface SearchCardResult {
  id: number
  title: string
  description?: string | null
  isCompleted: boolean
  dueDate?: string | null
  listId: number
  projectId: number
  projectName: string
  rank?: number
}

export interface SearchCommentResult {
  id: number
  content: string
  createdAt: string
  cardId: number
  cardTitle: string
  projectId: number
  projectName: string
  rank?: number
}

export interface SearchResponse {
  projects: SearchProjectResult[]
  cards: SearchCardResult[]
  comments: SearchCommentResult[]
}
