import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from './server'

/**
 * Get current user from NextAuth session
 * Uses NextAuth only, NOT Supabase Auth
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }
  
  // Return a user-like object compatible with existing code
  return {
    id: (session.user as any).id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name || null,
    image: session.user.image || null,
  }
}

/**
 * Get current user UUID from database by email
 * This is needed because user_tokens table uses UUID, not the NextAuth user ID
 */
export async function getCurrentUserUuid(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return null
  }
  
  const supabase = createServerSupabaseClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()
  
  if (error || !user) {
    return null
  }
  
  return user.id
}

/**
 * Get current user ID from NextAuth session
 * Uses NextAuth only, NOT Supabase Auth
 */
export async function getCurrentUserId(): Promise<string | null> {
  // For database operations, we need the UUID from the users table
  return await getCurrentUserUuid()
}

/**
 * Find or create user by email and return their UUID
 */
async function findOrCreateUserByEmail(email: string, name?: string, image?: string): Promise<string> {
  const supabase = createServerSupabaseClient()
  
  // First, try to find user by email
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  
  if (existingUser && !findError) {
    return existingUser.id
  }
  
  // User doesn't exist, create new one with UUID
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      name,
      image,
    })
    .select('id')
    .single()
  
  if (createError || !newUser) {
    console.error('Error creating user:', createError)
    throw new Error(`Failed to create user in database: ${createError?.message || 'Unknown error'}`)
  }
  
  return newUser.id
}

/**
 * Ensure user exists in database (called after OAuth callback)
 * Finds user by email or creates new user, returns UUID
 */
export async function ensureUserInDatabase(userId: string, email: string, name?: string, image?: string): Promise<string> {
  const supabase = createServerSupabaseClient()
  
  // Find or create user by email (returns UUID)
  const userUuid = await findOrCreateUserByEmail(email, name, image)
  
  // Update user record if needed (name, image might have changed)
  const { error: updateError } = await supabase
    .from('users')
    .update({
      name: name || null,
      image: image || null,
    })
    .eq('id', userUuid)
  
  if (updateError) {
    console.error('Error updating user:', updateError)
    // Don't throw - user exists, update is optional
  }
  
  return userUuid
}

export function getSupabaseAuthUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return supabaseUrl
}
