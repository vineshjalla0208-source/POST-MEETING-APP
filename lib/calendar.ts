import { google } from "googleapis"
import { GoogleAccount } from "@/lib/types"

export async function getGoogleCalendarEvents(account: GoogleAccount) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL
  )

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  // Refresh token if needed
  if (account.expires_at && Date.now() >= account.expires_at) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    // Update token in database (handled by API route)
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  // Get all calendars
  const calendarsResponse = await calendar.calendarList.list()
  const calendars = calendarsResponse.data.items || []

  // Fetch events from all calendars
  const allEvents = []
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  for (const cal of calendars) {
    if (!cal.id) continue

    try {
      const eventsResponse = await calendar.events.list({
        calendarId: cal.id,
        timeMin: oneMonthAgo.toISOString(),
        timeMax: oneMonthFromNow.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      })

      const events = eventsResponse.data.items || []
      allEvents.push(...events)
    } catch (error) {
      console.error(`Error fetching events from calendar ${cal.id}:`, error)
    }
  }

  return allEvents
}

