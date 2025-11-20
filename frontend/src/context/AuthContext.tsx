import { createContext, useState, ReactNode } from 'react'

// 1. Define the shape of the context data
interface User {
  id: string
  username: string
  email: string
}

export interface AuthContextType {
  token: string | null
  user: User | null
  login: (newToken: string, newUser: User) => void
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
    return localStorage.getItem('token')
  })

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}
