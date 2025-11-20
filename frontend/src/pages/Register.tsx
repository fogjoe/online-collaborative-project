import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Loader2, Orbit } from 'lucide-react'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Importing your specific Field components
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel // Optional: using for screen readers or if you want visible labels
} from '@/components/ui/field'
import { cardStyles, containerStyles, buttonStyles, linkStyles } from './Auth/AuthStyles'

export const RegisterPage = () => {
  // 1. Manual State Management
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  // 2. Manual Error State
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  // Helper to update state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 3. Manual Validation Logic
  const validate = () => {
    let isValid = true
    const newErrors = { username: '', email: '', password: '' }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
      isValid = false
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // 4. Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')

    if (!validate()) return

    setIsLoading(true)
    try {
      await authApi.register(formData)
      navigate('/login')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Join Project Flow</h1>
          <div className="text-[#115E59]">
            <Orbit size={48} strokeWidth={1.5} />
          </div>
        </div>

        {apiError && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg text-center">{apiError}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <Field>
            {/* Screen reader only label for accessibility */}
            <FieldLabel className="sr-only">Username</FieldLabel>
            <FieldContent>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#115E59]">
                  <User size={20} />
                </div>
                <Input
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="h-12 pl-12 bg-white border-gray-200 rounded-xl text-gray-600 focus-visible:ring-0 focus-visible:border-[#115E59] transition-all"
                />
              </div>
            </FieldContent>
            {/* Conditional rendering of the FieldError component */}
            {errors.username && <FieldError className="text-red-500 text-xs ml-1 font-medium mt-1">{errors.username}</FieldError>}
          </Field>

          {/* Email Field */}
          <Field>
            <FieldLabel className="sr-only">Email</FieldLabel>
            <FieldContent>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#115E59]">
                  <Mail size={20} />
                </div>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 pl-12 bg-white border-gray-200 rounded-xl text-gray-600 focus-visible:ring-0 focus-visible:border-[#115E59] transition-all"
                />
              </div>
            </FieldContent>
            {errors.email && <FieldError className="text-red-500 text-xs ml-1 font-medium mt-1">{errors.email}</FieldError>}
          </Field>

          {/* Password Field */}
          <Field>
            <FieldLabel className="sr-only">Password</FieldLabel>
            <FieldContent>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#115E59]">
                  <Lock size={20} />
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 pl-12 pr-12 bg-white border-gray-200 rounded-xl rounded-b-sm border-b-2 border-b-[#115E59] text-gray-600 focus-visible:ring-0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
              </div>
            </FieldContent>
            {errors.password && <FieldError className="text-red-500 text-xs ml-1 font-medium mt-1">{errors.password}</FieldError>}
          </Field>

          <Button type="submit" className={buttonStyles} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
          </Button>

          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">Already have an account? </span>
            <Link to="/login" className={linkStyles}>
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
