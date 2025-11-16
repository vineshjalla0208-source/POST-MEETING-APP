import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserGoogleTokens, isTokenExpired, updateUserGoogleAccessToken } from "@/lib/supabase/tokens"
import { fetchGoogleCalendarEvents, detectMeetingPlatform, extractMeetingUrl, refreshGoogleAccessToken } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user's Google tokens
    let userTokens = await getUserGoogleTokens(session.user.id)
    if (!userTokens) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      )
    }

    // Refresh token if expired
    if (isTokenExpired(userTokens.expires_at) && userTokens.refresh_token) {
      try {
        const newTokens = await refreshGoogleAccessToken(userTokens.refresh_token)
        // expires_in is in seconds, convert to milliseconds for storage
        const expiresAt = Date.now() + (newTokens.expires_in * 1000)
        
        await updateUserGoogleAccessToken(
          session.user.id,
          newTokens.access_token,
          expiresAt
        )
        
        userTokens = await getUserGoogleTokens(session.user.id)
        if (!userTokens) {
          return NextResponse.json(
            { error: "Failed to refresh token" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Error refreshing token:", error)
        return NextResponse.json(
          { error: "Failed to refresh Google token" },
          { status: 500 }
        )
      }
    }

    // Fetch calendar events
    const events = await fetchGoogleCalendarEvents(
      userTokens.access_token,
      userTokens.refresh_token
    )

    // Process and save events
    const syncedEvents = []
    const errors = []

    for (const event of events) {
      try {
        if (!event.id || !event.summary) continue

        const startTime = event.start?.dateTime || event.start?.date
        const endTime = event.end?.dateTime || event.end?.date

        if (!startTime || !endTime) continue

        const platform = detectMeetingPlatform(event)
        const meetingUrl = extractMeetingUrl(event)

        // Upsert meeting
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .upsert({
            user_id: session.user.id,
            google_event_id: event.id,
            title: event.summary,
            start_time: startTime,
            end_time: endTime,
            meeting_url: meetingUrl,
            platform: platform,
          }, {
            onConflict: 'user_id,google_event_id',
          })
          .select()
          .single()

        if (meetingError) {
          errors.push(`Failed to save event ${event.id}: ${meetingError.message}`)
        } else if (meeting) {
          syncedEvents.push(meeting)
        }
      } catch (error: any) {
        errors.push(`Error processing event ${event.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedEvents.length,
      total: events.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Error syncing Google Calendar events:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync calendar events" },
      { status: 500 }
    )
  }
}

