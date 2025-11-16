import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get NextAuth session
    const session = await getServerSession(authOptions)
    
    // Get JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    const supabase = createServerSupabaseClient()
    
    let accountRow = null
    let userTokensRow = null
    let userRow = null

    if (session?.user?.email) {
      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single()
      
      userRow = user

      if (user) {
        // Get account row (if accounts table exists)
        try {
          const { data: account } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .single()
          
          accountRow = account
        } catch (error) {
          // accounts table might not exist (we're using JWT strategy)
          console.log("accounts table not found or no data")
        }

        // Get user_tokens row
        const { data: tokens } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single()
        
        userTokensRow = tokens
      }
    }

    return NextResponse.json({
      session: session ? {
        user: {
          id: (session.user as any).id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
        accessToken: (session as any).accessToken ? "***REDACTED***" : null,
        refreshToken: (session as any).refreshToken ? "***REDACTED***" : null,
        idToken: (session as any).idToken ? "***REDACTED***" : null,
        expiresAt: (session as any).expiresAt,
        provider: (session as any).provider,
        providerAccountId: (session as any).providerAccountId,
      } : null,
      jwt: token ? {
        sub: token.sub,
        id: (token as any).id,
        email: token.email,
        name: token.name,
        provider: (token as any).provider,
        providerAccountId: (token as any).providerAccountId,
        hasAccessToken: !!(token as any).accessToken,
        hasRefreshToken: !!(token as any).refreshToken,
        expiresAt: (token as any).expiresAt,
      } : null,
      database: {
        user: userRow,
        account: accountRow,
        userTokens: userTokensRow ? {
          ...userTokensRow,
          access_token: userTokensRow.access_token ? "***REDACTED***" : null,
          refresh_token: userTokensRow.refresh_token ? "***REDACTED***" : null,
        } : null,
      },
      env: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      },
    })
  } catch (error: any) {
    console.error("Debug session error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get debug info" },
      { status: 500 }
    )
  }
}

