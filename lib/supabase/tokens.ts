import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface UserToken {
  id: string
  user_id: string
  provider: 'google' | 'linkedin' | 'facebook'
  access_token: string
  refresh_token: string | null
  expires_at: number | null
  created_at: string
  updated_at: string
}

/**
 * Get user's Google tokens from Supabase
 */
export async function getUserGoogleTokens(userId: string): Promise<UserToken | null> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (error || !data) {
    return null
  }

  return data as UserToken
}

/**
 * Save or update user's Google tokens
 * Ensures user exists in users table first, then saves tokens
 */
export async function saveUserGoogleTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: number | null
): Promise<void> {
  const supabase = createServerSupabaseClient()

  console.log("💾 Saving Google tokens to user_tokens table:", {
    userId,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
  })

  // First, ensure user exists in users table
  // This is needed because user_tokens has a foreign key constraint
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: '', // Will be updated by ensureUserInDatabase
      name: null,
      image: null,
    }, {
      onConflict: 'id',
    })

  if (userError) {
    console.error('⚠️  Error ensuring user exists:', userError)
    // Continue anyway - user might already exist
  } else {
    console.log("✅ User exists in users table")
  }

  // Save or update tokens with proper ON CONFLICT handling
  const { data, error } = await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    }, {
      onConflict: 'user_id,provider',
    })
    .select()

  if (error) {
    console.error('❌ Error saving Google tokens:', error)
    console.error('UserId:', userId)
    console.error('Provider:', 'google')
    throw new Error(`Failed to save Google tokens: ${error.message}`)
  }

  console.log("✅ Google tokens saved successfully to user_tokens table:", {
    id: data?.[0]?.id,
    user_id: data?.[0]?.user_id,
    provider: data?.[0]?.provider,
  })
}

/**
 * Update user's Google access token
 */
export async function updateUserGoogleAccessToken(
  userId: string,
  accessToken: string,
  expiresAt: number | null
): Promise<void> {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('user_tokens')
    .update({
      access_token: accessToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google')

  if (error) {
    console.error('Error updating Google access token:', error)
    throw new Error('Failed to update Google access token')
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true
  // expiresAt is in milliseconds (bigint)
  return Date.now() >= expiresAt
}
