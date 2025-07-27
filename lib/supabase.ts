import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Detect environment and use appropriate method for environment variables
const isServer = typeof window === 'undefined';

const supabaseUrl = isServer 
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfoseletmpbybebtnilq.supabase.co')
  : (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfoseletmpbybebtnilq.supabase.co');

const supabaseAnonKey = isServer
  ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3NlbGV0bXBieWJlYnRuaWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzI4MzIsImV4cCI6MjA2OTIwODgzMn0.47s1IYYCnAVUROsQRWq3qYvozfYU6uMjgRprz4janNo')
  : (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3NlbGV0bXBieWJlYnRuaWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzI4MzIsImV4cCI6MjA2OTIwODgzMn0.47s1IYYCnAVUROsQRWq3qYvozfYU6uMjgRprz4janNo');

// Debug environment variables  
console.log('🔍 Environment:', isServer ? 'Server' : 'Client');
console.log('🔍 supabaseUrl:', supabaseUrl);
console.log('🔍 supabaseAnonKey exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('supabaseUrl:', supabaseUrl)
  console.error('supabaseAnonKey exists:', !!supabaseAnonKey)
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client (for frontend)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = () => {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfoseletmpbybebtnilq.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3NlbGV0bXBieWJlYnRuaWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYzMjgzMiwiZXhwIjoyMDY5MjA4ODMyfQ.NAC5LP6AgJFBAtweQ62O1zIU7h-r0U1IeppL76KfWkQ'
  
  if (!serviceRoleKey || !serverUrl) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(serverUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to get authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}