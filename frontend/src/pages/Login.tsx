import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, Loader2, Orbit } from 'lucide-react'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cardStyles, containerStyles, buttonStyles, linkStyles } from './Auth/AuthStyles'
import { useAuth } from '@/context/useAuth'
import { hashSha256 } from '@/lib/utils'

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const hashedPassword = await hashSha256(password)
      const response = await authApi.login({ identifier, password: hashedPassword })

      const responseBody = response.data || response
      const responseData = responseBody.data || responseBody

      const accessToken = responseData.accessToken
      const user = responseData.user

      if (!accessToken) {
        throw new Error('No access token received')
      }

      login(accessToken, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError('Invalid credentials.')
      console.log('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Log In to Project Flow</h1>
          {/* Logo Replica */}
          <div className="text-[#115E59]">
            <Orbit size={48} strokeWidth={1.5} />
          </div>
        </div>

        {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username Input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={20} />
            </div>
            <Input
              type="text"
              placeholder="Email address or username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="h-12 pl-12 bg-white border-gray-200 rounded-xl text-gray-600 focus-visible:ring-0 focus-visible:border-[#115E59] transition-all"
              required
            />
          </div>

          {/* Password Input - High Precision Match */}
          {/* Note: The image shows a specific teal bottom border on this field */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={20} /> {/* Using User icon on left as per image glitch/style */}
            </div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 pl-12 pr-12 bg-white border-gray-200 rounded-xl rounded-b-sm border-b-2 border-b-[#115E59] text-gray-600 focus-visible:ring-0"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </div>
          </div>

          <Button type="submit" className={buttonStyles} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Continue'}
          </Button>

          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link to="/register" className={linkStyles}>
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
