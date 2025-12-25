import axios, { type InternalAxiosRequestConfig, type AxiosError, AxiosResponse } from 'axios'
import type { LoginDto, RegisterDto } from '@/types/auth'
import API from '@/common/api'
import { toast } from 'sonner'
import { AttachmentItem } from '@/components/board/CardAttachments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// API is running on port 3000
const apiClient = axios.create({
  baseURL: 'http://localhost:7000/api',
  timeout: 5000 // Added a timeout for good practice
})

// define a sample lock variable
let isRedirecting = false

// --- 1. Request Interceptor ---
// This runs BEFORE your request is sent.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // This is the best place to add an auth token for other requests.
    // The token is typically saved in localStorage after login.
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    // This handles errors in setting up the request
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  // On Success (2xx)
  (response: AxiosResponse) => {
    // Return ONLY the data (code, message, data)
    return response.data
  },

  // On Error (Non-2xx)
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message)

    // Handle 401 (Unauthorized) logic
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true
        toast.error('Authentication Failed', {
          description: 'Token expired. Please log in again.',
          duration: 2000
        })
        localStorage.removeItem('token')

        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
      }
    }

    // Return the actual backend error message if available
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data)
    }

    return Promise.reject({ message: error.message || 'Network Error' })
  }
)

// Your original API object, now powered by the interceptors
export const authApi = {
  login: (data: LoginDto) => apiClient.post(API.login, data),
  register: (data: RegisterDto) => apiClient.post(API.register, data)
  // You can add other auth-related calls here
}

export const projectApi = {
  getAll: () => apiClient.get(API.projects),
  create: (data: { name: string; description?: string }) => apiClient.post(API.projects, data),
  delete: (id: number) => apiClient.delete(API.deleteProject(id)),
  getDetailById: (id: number) => apiClient.get(API.projectDetails(id)),
  addMember: (projectId: number, email: string) => apiClient.post(API.addMember(projectId), { email })
}

export const listApi = {
  getByProject: (projectId: number) => apiClient.get(API.getListsByProject(projectId)),
  create: (data: { name: string; projectId: number }) => apiClient.post(API.createList, data)
}

export const cardApi = {
  create: (data: { title: string; listId: number; description?: string }) => apiClient.post(API.createCard, data),
  reorder: (data: { cardId: number; targetListId: number; newOrder: number }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any, ApiResponse>(API.reorderCards, data),

  toggleStatus: (cardId: number) => apiClient.patch(API.toggleCard(cardId)),
  update: (cardId: number, data: { title?: string; description?: string; labelIds?: number[] }) => apiClient.patch(API.updateCard(cardId), data),

  delete: (cardId: number) => apiClient.delete(API.deleteCard(cardId)),

  assign: (cardId: number, userId: number) => apiClient.post(API.assignCard(cardId), { userId }),

  unassign: (cardId: number, userId: number) => apiClient.delete(API.unassignCard(cardId, userId))
}

export const notificationApi = {
  getAll: () => apiClient.get(API.getNotifications),
  markRead: (id: number) => apiClient.patch(API.markNotificationRead(id))
}

export const userApi = {
  getProfile: () => apiClient.get(API.profile),
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string }) => apiClient.patch(API.profile, data)
}

export const commentApi = {
  getComments: (cardId: number) => apiClient.get(API.getCommentsById(cardId)),
  createComment: (cardId: number, content: string) => apiClient.post(API.getCommentsById(cardId), { content })
}

export const labelApi = {
  getProjectLabels: (projectId: number) => apiClient.get(API.projectLabels(projectId)),

  createLabel: (projectId: number, data: { name: string; color: string }) => apiClient.post(API.projectLabels(projectId), data),

  toggleCardLabel: (cardId: number, labelId: number) => apiClient.post(API.toggleCardLabel(cardId, labelId))
}

export const attachmentsApi = {
  list: (cardId: number) => apiClient.get<AttachmentItem[]>(API.cardAttachments(cardId)),
  upload: (cardId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(API.cardAttachments(cardId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  remove: (attachmentId: number) => apiClient.delete(API.deleteAttachment(attachmentId))
}

// We also export the default client.
// This lets other "api" files (like 'projectApi.ts')
// import this pre-configured client.
export default apiClient
