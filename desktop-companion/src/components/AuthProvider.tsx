import React, { createContext, useContext, useEffect, useState } from 'react'
import { Amplify } from 'aws-amplify'
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

// Get environment variables from electron or browser
const getEnv = (key: string, defaultValue: string = '') => {
  if (typeof window !== 'undefined' && window.electronEnv) {
    const value = window.electronEnv[key as keyof typeof window.electronEnv] || defaultValue
    console.log(`Environment variable ${key}:`, value ? 'SET' : 'NOT SET')
    return value
  }
  console.log(`Environment variable ${key}: NOT AVAILABLE (no electronEnv)`)
  
  // Fallback values for testing
  const fallbackValues: Record<string, string> = {
    'REACT_APP_USER_POOL_ID': 'us-east-2_8JHg800Rm',
    'REACT_APP_USER_POOL_CLIENT_ID': '2ajlh70hd6rsk8hoc9ldvqnbtr',
    'REACT_APP_OAUTH_DOMAIN': 'us-east-28jhg800rm.auth.us-east-2.amazoncognito.com',
    'REACT_APP_API_URL': 'http://localhost:5001'
  }
  
  return fallbackValues[key] || defaultValue
}

// AWS Cognito configuration (same as main app)
const userPoolId = getEnv('REACT_APP_USER_POOL_ID')
const userPoolClientId = getEnv('REACT_APP_USER_POOL_CLIENT_ID') 
const oauthDomain = getEnv('REACT_APP_OAUTH_DOMAIN')

console.log('Auth config values:', { userPoolId, userPoolClientId, oauthDomain })

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      region: 'us-east-2', // Fixed region to match your User Pool
    },
  },
}

console.log('Configuring Amplify with:', awsConfig)
Amplify.configure(awsConfig)

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  idToken: string | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  onAuthChange: (isAuthenticated: boolean) => void
}

export function AuthProvider({ children, onAuthChange }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      console.log('OAuth callback detected with code:', code)
      handleOAuthCallback(code)
    }
  }, [])

  useEffect(() => {
    onAuthChange(isAuthenticated)
  }, [isAuthenticated, onAuthChange])

  const handleOAuthCallback = async (code: string) => {
    try {
      console.log('Processing OAuth callback...')
      // For now, we'll store the auth code and show success
      // In a full implementation, you'd exchange this code for tokens
      
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Show success message
      alert('Authentication successful! Please restart the app to complete login.')
      
    } catch (error) {
      console.error('OAuth callback error:', error)
    }
  }

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser()
      const session = await fetchAuthSession()
      
      if (user && session.tokens?.idToken) {
        setUser(user)
        setIsAuthenticated(true)
        setIdToken(session.tokens.idToken.toString())
      }
    } catch (error) {
      console.log('User not authenticated')
      setUser(null)
      setIsAuthenticated(false)
      setIdToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (username: string, password: string) => {
    try {
      setSigningIn(true)
      setError('')
      console.log('Starting Cognito sign in...')
      
      const user = await signIn({
        username,
        password,
      })
      
      console.log('Sign in successful:', user)
      await checkAuthState()
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'Sign in failed')
    } finally {
      setSigningIn(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) {
      await handleSignIn(username, password)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setIsAuthenticated(false)
      setIdToken(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    isAuthenticated,
    idToken,
    signIn: handleSignIn,
    signOut: handleSignOut,
    loading,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Sign In to AriNote</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access your AriNote dot phrases and sync across devices.
            </p>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username or Email
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username or email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={signingIn || !username || !password}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}