import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAccountTokens, isTokenExpired, refreshAccountToken } from '@/lib/supabase/accounts'
import { fetchCalendarList, fetchGoogleCalendarEvents } from '@/lib/google-calendar'

/**
 * POST /api/calendar/sync
 * Fetches Google Calendar List and Events
 * - Checks token validity
 * - Refreshes token if expired
 * - Returns calendars and events
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Calendar sync request received")
    
    // 1. Authenticate user
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.error("❌ Unauthorized: No session or user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    
    if (!userId) {
      console.error("❌ Unauthorized: User ID not found in session")
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 })
    }

    console.log("✅ User authenticated. User ID:", userId)

    // 2. Get Google account tokens from database
    console.log("🔍 Looking up Google account in public.accounts...")
    let account = await getAccountTokens(userId, 'google')
    
    if (!account) {
      console.error("❌ Google account not connected")
      return NextResponse.json(
        { error: "Google account not connected. Please sign in with Google first." },
        { status: 400 }
      )
    }

    if (!account.access_token) {
      console.error("❌ Google account has no access token")
      return NextResponse.json(
        { error: "Google account access token is missing. Please sign in again." },
        { status: 400 }
      )
    }

    // 3. Check token validity and refresh if expired
    console.log("🔍 Checking token validity...")
    console.log("   Token scope:", account.scope || "not stored")
    console.log("   Expires at:", account.expires_at ? new Date(account.expires_at).toISOString() : "null")
    console.log("   Current time:", new Date().toISOString())
    console.log("   Is expired:", isTokenExpired(account.expires_at))
    
    if (isTokenExpired(account.expires_at)) {
      if (!account.refresh_token) {
        console.error("❌ Token expired but no refresh token available")
        return NextResponse.json(
          { error: "Google token expired and no refresh token available. Please sign in again." },
          { status: 400 }
        )
      }

      console.log("🔄 Token expired, refreshing...")
      try {
        const refreshed = await refreshAccountToken(
          userId,
          'google',
          account.refresh_token
        )
        
        if (refreshed) {
          account.access_token = refreshed.access_token
          account.expires_at = refreshed.expires_at
          console.log("✅ Token refreshed successfully")
          console.log("   New expires at:", refreshed.expires_at ? new Date(refreshed.expires_at).toISOString() : "null")
        } else {
          console.error("❌ Failed to refresh token")
          return NextResponse.json(
            { error: "Failed to refresh Google token. Please sign in again." },
            { status: 500 }
          )
        }
      } catch (error: any) {
        console.error("❌ Error refreshing token:", error)
        return NextResponse.json(
          { error: "Failed to refresh Google token. Please sign in again." },
          { status: 500 }
        )
      }
    } else {
      console.log("✅ Token is valid")
    }

    // 4. Fetch Google Calendar List
    console.log("📅 Fetching Google Calendar List...")
    let calendars
    try {
      calendars = await fetchCalendarList(
        account.access_token,
        account.refresh_token
      )
      console.log(`✅ Fetched ${calendars.length} calendars`)
    } catch (error: any) {
      console.error("❌ Error fetching calendar list:", error)
      console.error("   Error message:", error.message)
      console.error("   Error code:", error.code)
      console.error("   Error status:", error.response?.status)
      console.error("   Error details:", JSON.stringify(error.response?.data, null, 2))
      
      // Check for insufficient permissions
      if (error.code === 403 || error.response?.status === 403) {
        const errorMessage = error.response?.data?.error?.message || error.message
        const requiredScopes = error.response?.headers?.['www-authenticate'] || 'unknown'
        console.error("❌ INSUFFICIENT PERMISSIONS DETECTED")
        console.error("   Required scopes:", requiredScopes)
        console.error("   Current token scope:", account.scope || "not stored")
        console.error("   Solution: User must re-authenticate with updated scopes")
        
        return NextResponse.json(
          { 
            error: "Insufficient permissions. Please sign out and sign in again with Google to grant calendar access.",
            details: errorMessage,
            code: "INSUFFICIENT_PERMISSIONS",
            currentScope: account.scope || "not stored"
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch calendar list: ${error.message}` },
        { status: 500 }
      )
    }

    // 5. Fetch calendar events (optional - can be done separately)
    console.log("📅 Fetching Google Calendar events...")
    let events = []
    try {
      events = await fetchGoogleCalendarEvents(
        account.access_token,
        account.refresh_token
      )
      console.log(`✅ Fetched ${events.length} events from Google Calendar`)
    } catch (error: any) {
      console.error("⚠️  Error fetching calendar events (non-fatal):", error.message)
      // Don't fail the request if events fail, calendars are more important
    }

    // 6. Return calendars and events
    return NextResponse.json({
      success: true,
      calendars: calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        timeZone: cal.timeZone,
        primary: cal.primary,
        accessRole: cal.accessRole,
      })),
      events: events.length,
      calendarCount: calendars.length,
    })
  } catch (error: any) {
    console.error("❌ Error syncing Google Calendar:", error)
    console.error("   Error message:", error.message)
    console.error("   Error stack:", error.stack)
    return NextResponse.json(
      { error: error.message || "Failed to sync calendar" },
      { status: 500 }
    )
  }
}
