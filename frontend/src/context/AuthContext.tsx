import { createContext, useState, ReactNode } from 'react'

// 1. Define the shape of the context data
interface AuthContextType {
  token: string | null
  login: (newToken: string) => void
  logout: () => void
}

// 2. Create the context with its type
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Define the props for the provider
interface AuthProviderProps {
  children: ReactNode
}

export { AuthContext }

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 4. Type the state
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') // Load token from storage on init
  })

  const login = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}
