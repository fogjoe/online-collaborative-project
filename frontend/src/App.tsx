import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { Button } from '@/components/ui/button' // For the logout button
import React from 'react' // Import React

// Type the props for PrivateRoute
interface PrivateRouteProps {
  children: React.ReactElement
}

import { DashboardPage } from './pages/Dashboard'
import { ProjectBoardsPage } from './pages/ProjectBoards'
import { BoardPage } from './pages/Board'

// This component protects routes that require a user to be logged in
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { token } = useAuth()
  // Check localStorage as fallback for immediate post-login navigation
  const localToken = localStorage.getItem('token')
  return token || localToken ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:projectId"
            element={
              <PrivateRoute>
                <ProjectBoardsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/board/:boardId"
            element={
              <PrivateRoute>
                <BoardPage />
              </PrivateRoute>
            }
          />

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

