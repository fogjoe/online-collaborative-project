import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type { LoginDto, RegisterDto } from '@/types/auth'
import API from '@/common/api'
import { toast } from 'sonner'

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

// NEW: Response Interceptor
apiClient.interceptors.response.use(
  response => {
    // If the response is successful (2xx), just return the data
    return response
  },
  error => {
    // If the response failed
    if (error && error.code === 401) {
      // check the lock, if it already redirects, ignoring the next 401 error
      if (!isRedirecting) {
        isRedirecting = true // enable lock

        // 1. Clear the invalid/expired token
        toast.error('Authentication Failed', {
          position: 'top-center',
          description: 'Token expired. Please log in again.',
          duration: 2000 // Optional: ensure it stays long enough
        })

        localStorage.removeItem('token')

        // 2. Force redirect to login page
        // Note: We use window.location.href instead of useNavigate because
        // this file is not a React component. This also clears React state memory.
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500) // 1.5s delay to let them read the red toast
        }
      }
    }
    return Promise.reject(error)
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
  delete: (id: number) => apiClient.delete(API.deleteProject(id))
}

export const listApi = {
  getByProject: (projectId: number) => apiClient.get(API.getListsByProject(projectId)),
  create: (data: { name: string; projectId: number }) => apiClient.post(API.createList, data)
}

export const cardApi = {
  create: (data: { title: string; listId: number; description?: string }) => apiClient.post(API.createCard, data)
}

// We also export the default client.
// This lets other "api" files (like 'projectApi.ts')
// import this pre-configured client.
export default apiClient
