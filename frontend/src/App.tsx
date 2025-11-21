import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import React from 'react' // Import React
import { DashboardPage } from './pages/DashboardPage'

// Type the props for PrivateRoute
interface PrivateRouteProps {
  children: React.ReactElement
}

// This component protects routes that require a user to be logged in
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
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

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
