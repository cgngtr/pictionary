'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AuthMode = 'signin' | 'signup'

type ValidationErrors = {
  email?: string
  password?: string
  username?: string
}

export const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (mode === 'signup' && !username) {
      errors.username = 'Username is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        })

        if (signUpError) throw signUpError

        const { error: profileError } = await supabase
          .from('users')
          .insert([{ username }])

        if (profileError) throw profileError

        setError('Please check your email to verify your account')
        return
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }

      router.refresh()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-500">
          {mode === 'signin' 
            ? 'Enter your details to sign in' 
            : 'Fill in your information to get started'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                aria-describedby="username-error"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setValidationErrors({ ...validationErrors, username: undefined })
                }}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                  ${validationErrors.username ? 'border-red-300' : 'border-gray-300'}`}
              />
              {validationErrors.username && (
                <p className="mt-2 text-sm text-red-600" id="username-error">
                  {validationErrors.username}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              aria-describedby="email-error"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setValidationErrors({ ...validationErrors, email: undefined })
              }}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                ${validationErrors.email ? 'border-red-300' : 'border-gray-300'}`}
            />
            {validationErrors.email && (
              <p className="mt-2 text-sm text-red-600" id="email-error">
                {validationErrors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              aria-describedby="password-error"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setValidationErrors({ ...validationErrors, password: undefined })
              }}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                ${validationErrors.password ? 'border-red-300' : 'border-gray-300'}`}
            />
            {validationErrors.password && (
              <p className="mt-2 text-sm text-red-600" id="password-error">
                {validationErrors.password}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className={`p-3 rounded-md ${error.includes('verify') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {mode === 'signin' ? 'New to Pictionary?' : 'Already have an account?'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setValidationErrors({})
          }}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {mode === 'signin' ? 'Create an account' : 'Sign in to your account'}
        </button>
      </form>
    </div>
  )
} 