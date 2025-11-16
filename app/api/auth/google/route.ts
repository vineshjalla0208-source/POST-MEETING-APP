import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') || '/calendar'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
}

