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

// Get the current domain for redirect URLs
const getRedirectUrl = () => {
  if (!isServer && typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }
  return 'https://arinote.vercel.app'; // Default fallback
};

// Client-side Supabase client (for frontend)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: !isServer ? window.localStorage : undefined,
    storageKey: 'arinote-auth'
  }
})

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = () => {
  // Prefer explicit env vars but fall back to the public anon key to keep local/dev
  // environments working even when a service-role key is not available.
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;

  // We try the service-role key first because some privileged RPC calls might need it.
  // If it is not defined we gracefully fall back to the anon key which is sufficient
  // for verifying user JWTs via `supabase.auth.getUser(token)`.
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    supabaseAnonKey;

  if (!serverUrl) {
    throw new Error('Missing Supabase URL – please set NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found – falling back to anon key');
  }

  return createClient<Database>(serverUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper to get authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}