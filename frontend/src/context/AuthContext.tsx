import { createContext, useState, useContext, ReactNode } from 'react'

// User type
interface User {
  id: number
  username: string
  email: string
  avatarUrl?: string
}

// 1. Define the shape of the context data
interface AuthContextType {
  token: string | null
  user: User | null
  login: (newToken: string, newData: unknown) => void
  logout: () => void
}

// 2. Create the context with its type
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Define the props for the provider
interface AuthProviderProps {
  children: ReactNode
}

export { AuthContext }

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper to get user from localStorage
const getUserFromStorage = (): User | null => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      return JSON.parse(userData) as User
    } catch {
      return null
    }
  }
  return null
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 4. Type the state
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') // Load token from storage on init
  })

  // Load user from localStorage
  const [user, setUser] = useState<User | null>(getUserFromStorage)

  const login = (newToken: string, newData: unknown) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setToken(newToken)
    localStorage.setItem('token', newToken)
    if (newData) {
      localStorage.setItem('user', JSON.stringify(newData))
      setUser(newData as User)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}
