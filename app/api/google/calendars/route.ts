import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserGoogleTokens, isTokenExpired, updateUserGoogleAccessToken } from "@/lib/supabase/tokens"
import { createGoogleOAuthClient, refreshGoogleAccessToken } from "@/lib/google-calendar"
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Fetch calendars
    const oauth2Client = createGoogleOAuthClient(
      userTokens.access_token,
      userTokens.refresh_token
    )
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const calendarsResponse = await calendar.calendarList.list()
    const calendars = calendarsResponse.data.items || []

    return NextResponse.json({
      success: true,
      calendars: calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary,
      })),
    })
  } catch (error: any) {
    console.error("Error fetching calendars:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendars" },
      { status: 500 }
    )
  }
}

