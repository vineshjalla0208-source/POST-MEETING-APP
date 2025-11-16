import { createServerSupabaseClient } from './server'

export async function saveSocialTokens(
  userId: string,
  provider: 'linkedin' | 'facebook',
  accessToken: string,
  refreshToken: string | null,
  expiresAt: number | null
) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('social_tokens')
    .upsert({
      user_id: userId,
      provider,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

  if (error) throw error
}

export async function getSocialTokens(
  userId: string,
  provider: 'linkedin' | 'facebook'
) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('social_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (error) throw error
  return data
}

