import { createServerSupabaseClient } from '@/lib/supabase/server'
import { refreshGoogleAccessToken } from '@/lib/google-calendar'

export interface Account {
  id: string
  user_id: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  created_at: string
  updated_at: string
}

export interface SaveAccountTokensParams {
  userId: string
  provider: string
  providerAccountId: string
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
  tokenType?: string | null
  scope?: string | null
  idToken?: string | null
}

/**
 * Save or update account tokens in the public.accounts table
 * Uses the correct table name: public.accounts
 */
export async function saveAccountTokens(params: SaveAccountTokensParams): Promise<void> {
  const supabase = createServerSupabaseClient()

  console.log("💾 Saving account tokens to public.accounts table:", {
    userId: params.userId,
    provider: params.provider,
    providerAccountId: params.providerAccountId,
    hasAccessToken: !!params.accessToken,
    hasRefreshToken: !!params.refreshToken,
    expiresAt: params.expiresAt ? new Date(params.expiresAt).toISOString() : null,
  })

  // Ensure user exists in users table (public schema)
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: params.userId,
      email: '', // Will be updated by ensureUserInDatabase
      name: null,
      image: null,
    }, {
      onConflict: 'id',
    })

  if (userError) {
    console.error('⚠️  Error ensuring user exists:', userError)
  } else {
    console.log("✅ User exists in users table")
  }

  // Save or update account tokens in public.accounts
  // Uses UNIQUE constraint on (provider, provider_account_id)
  const { data, error } = await supabase
    .from('accounts')
    .upsert({
      user_id: params.userId,
      provider: params.provider,
      provider_account_id: params.providerAccountId,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: params.expiresAt,
      token_type: params.tokenType,
      scope: params.scope,
      id_token: params.idToken,
    }, {
      onConflict: 'provider,provider_account_id',
    })
    .select()

  if (error) {
    console.error('❌ Error saving account tokens to public.accounts:', error)
    console.error('   UserId:', params.userId)
    console.error('   Provider:', params.provider)
    console.error('   ProviderAccountId:', params.providerAccountId)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    throw new Error(`Failed to save account tokens: ${error.message}`)
  }

  console.log("✅ Account tokens saved successfully to public.accounts table:", {
    id: data?.[0]?.id,
    user_id: data?.[0]?.user_id,
    provider: data?.[0]?.provider,
    provider_account_id: data?.[0]?.provider_account_id,
    has_access_token: !!data?.[0]?.access_token,
    has_refresh_token: !!data?.[0]?.refresh_token,
  })
  console.log("✅ Saving account tokens to accounts successful")
}

/**
 * Get account tokens from the public.accounts table
 * Uses the correct table name: public.accounts
 */
export async function getAccountTokens(
  userId: string,
  provider: string
): Promise<Account | null> {
  const supabase = createServerSupabaseClient()
  
  console.log("🔍 Looking up account in public.accounts table:", {
    userId,
    provider,
    schema: 'public',
    table: 'accounts',
  })
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 = no rows returned (not an error, just no data)
      console.log("ℹ️  No account found in public.accounts for user:", userId, "provider:", provider)
    } else {
      console.error('❌ Error fetching account tokens from public.accounts:', error)
      console.error('   Error code:', error.code)
      console.error('   Error message:', error.message)
    }
    return null
  }

  if (!data) {
    console.log("ℹ️  No account data returned from public.accounts")
    return null
  }

  console.log("✅ Account found in public.accounts:", {
    id: data.id,
    user_id: data.user_id,
    provider: data.provider,
    provider_account_id: data.provider_account_id,
    has_access_token: !!data.access_token,
    has_refresh_token: !!data.refresh_token,
    expires_at: data.expires_at,
  })
  console.log("✅ Account tokens fetched successfully")

  return data as Account
}

/**
 * Update account access token (after refresh)
 * Uses the correct table name: public.accounts
 */
export async function updateAccountAccessToken(
  userId: string,
  provider: string,
  providerAccountId: string,
  accessToken: string,
  expiresAt: number | null
): Promise<void> {
  const supabase = createServerSupabaseClient()

  console.log("🔄 Updating account access token in public.accounts:", {
    userId,
    provider,
    providerAccountId,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
  })

  const { error } = await supabase
    .from('accounts')
    .update({
      access_token: accessToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('provider_account_id', providerAccountId)

  if (error) {
    console.error('❌ Error updating account access token in public.accounts:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    throw new Error(`Failed to update account access token: ${error.message}`)
  }

  console.log("✅ Account access token updated successfully in public.accounts")
}

/**
 * Refresh account token and save back to database
 * Uses the correct table name: public.accounts
 */
export async function refreshAccountToken(
  userId: string,
  provider: string,
  refreshToken: string
): Promise<{ access_token: string; expires_at: number } | null> {
  if (provider !== 'google') {
    console.error('Token refresh only supported for Google provider')
    return null
  }

  try {
    console.log("🔄 Refreshing Google access token...")
    const newTokens = await refreshGoogleAccessToken(refreshToken)
    const expiresAt = Date.now() + (newTokens.expires_in * 1000)

    // Get provider_account_id from existing account
    const account = await getAccountTokens(userId, provider)
    if (!account) {
      console.error('❌ Account not found in public.accounts for token refresh')
      return null
    }

    if (!account.provider_account_id) {
      console.error('❌ Account missing provider_account_id for token refresh')
      return null
    }

    // Update the account with new tokens
    await updateAccountAccessToken(
      userId,
      provider,
      account.provider_account_id,
      newTokens.access_token,
      expiresAt
    )

    console.log("✅ Token refreshed and saved to public.accounts table")

    return {
      access_token: newTokens.access_token,
      expires_at: expiresAt,
    }
  } catch (error: any) {
    console.error('❌ Error refreshing account token:', error)
    console.error('   Error message:', error.message)
    throw error
  }
}

/**
 * Check if token is expired
 * expires_at is stored in milliseconds (bigint)
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) {
    console.log("ℹ️  Token has no expiration time, considering expired")
    return true
  }
  // expiresAt is in milliseconds (bigint)
  const now = Date.now()
  const expired = now >= expiresAt
  if (expired) {
    console.log("⚠️  Token expired:", {
      now: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      diffSeconds: Math.floor((now - expiresAt) / 1000),
    })
  }
  return expired
}
