import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { LoginDto, RegisterDto } from '@/types/auth'
import API from '@/common/api'

// API is running on port 3000
const apiClient = axios.create({
  baseURL: 'http://localhost:7000/api',
  timeout: 5000 // Added a timeout for good practice
})

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

// --- 2. Response Interceptor ---
// This runs AFTER a response is received.
apiClient.interceptors.response.use(
  // OnFulfilled: Any 2xx status code
  response => {
    // We only care about the data, so we return it directly.
    // This stops you from having to do 'response.data' in your code.
    return response.data
  },
  // OnRejected: Any non-2xx status code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error: AxiosError<any>) => {
    // This is the "throw it quickly" part you wanted.
    console.error('API Error:', error.response?.data || error.message)

    if (error.response) {
      // The server responded with an error (e.g., 400, 401, 409).
      // We "throw" the backend's specific error object.
      // Your 'try/catch' block will receive 'error.response.data'.
      return Promise.reject(error.response.data)
    } else if (error.request) {
      // The request was made but no response was received
      // (e.g., server is down, network error).
      return Promise.reject({ message: 'Network error or server is down.' })
    } else {
      // Something else bad happened (e.g., config error)
      return Promise.reject({ message: error.message })
    }
  }
)

// Your original API object, now powered by the interceptors
export const authApi = {
  login: (data: LoginDto) => apiClient.post(API.login, data) as Promise<{ accessToken: string; user: any }>,
  register: (data: RegisterDto) => apiClient.post(API.register, data) as Promise<any>
  // You can add other auth-related calls here
}

export const projectsApi = {
  getAll: () => apiClient.get('/projects') as Promise<any[]>,
  getOne: (id: string) => apiClient.get(`/projects/${id}`) as Promise<any>,
  create: (data: { name: string; description?: string }) => apiClient.post('/projects', data) as Promise<any>,
  update: (id: string, data: any) => apiClient.patch(`/projects/${id}`, data) as Promise<any>,
  delete: (id: string) => apiClient.delete(`/projects/${id}`) as Promise<any>
}

export const boardsApi = {
  getAll: (projectId: string) => apiClient.get(`/boards?projectId=${projectId}`) as Promise<any[]>,
  getOne: (id: string) => apiClient.get(`/boards/${id}`) as Promise<any>,
  create: (data: { name: string; projectId: string }) => apiClient.post('/boards', data) as Promise<any>,
  update: (id: string, data: any) => apiClient.patch(`/boards/${id}`, data) as Promise<any>,
  delete: (id: string) => apiClient.delete(`/boards/${id}`) as Promise<any>
}

export const listsApi = {
  getAll: (boardId: string) => apiClient.get(`/lists?boardId=${boardId}`) as Promise<any[]>,
  create: (data: { name: string; boardId: string; order?: number }) => apiClient.post('/lists', data) as Promise<any>,
  update: (id: string, data: any) => apiClient.patch(`/lists/${id}`, data) as Promise<any>,
  delete: (id: string) => apiClient.delete(`/lists/${id}`) as Promise<any>
}

export const cardsApi = {
  getAll: (listId: string) => apiClient.get(`/cards?listId=${listId}`) as Promise<any[]>,
  create: (data: { title: string; listId: string; description?: string; order?: number }) => apiClient.post('/cards', data) as Promise<any>,
  update: (id: string, data: any) => apiClient.patch(`/cards/${id}`, data) as Promise<any>,
  delete: (id: string) => apiClient.delete(`/cards/${id}`) as Promise<any>
}

// We also export the default client.
// This lets other "api" files (like 'projectApi.ts')
// import this pre-configured client.
export default apiClient
