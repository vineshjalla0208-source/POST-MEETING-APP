import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureUserInDatabase } from '@/lib/supabase/auth'
import { saveUserGoogleTokens } from '@/lib/supabase/tokens'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/calendar'

  if (code) {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
    }

    if (data.user) {
      const user = data.user
      
      try {
        await ensureUserInDatabase(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.user_metadata?.name,
          user.user_metadata?.avatar_url || user.user_metadata?.picture
        )

        if (data.session?.provider_token && data.session?.provider_refresh_token) {
          const expiresAt = data.session.expires_at 
            ? Math.floor(data.session.expires_at) 
            : null

          await saveUserGoogleTokens(
            user.id,
            data.session.provider_token,
            data.session.provider_refresh_token,
            expiresAt ? expiresAt * 1000 : null
          )
        }
      } catch (error) {
        console.error('Error saving user data:', error)
      }
    }

    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
