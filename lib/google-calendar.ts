import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Creates a Google OAuth2 client with the provided tokens
 */
export function createGoogleOAuthClient(
  accessToken: string,
  refreshToken?: string | null
): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL || 'http://localhost:3000'
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return oauth2Client
}

/**
 * Refreshes the Google access token using refresh token
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL || 'http://localhost:3000'
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  
  return {
    access_token: credentials.access_token!,
    expires_in: credentials.expiry_date 
      ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
      : 3600,
  }
}

/**
 * Fetches the user's calendar list
 */
export async function fetchCalendarList(
  accessToken: string,
  refreshToken?: string | null
) {
  const oauth2Client = createGoogleOAuthClient(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    const calendarsResponse = await calendar.calendarList.list({
      minAccessRole: 'reader',
    })
    return calendarsResponse.data.items || []
  } catch (error: any) {
    console.error("❌ Error fetching calendar list:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorDetails: error.response?.data,
    })
    throw error
  }
}

/**
 * Fetches all calendar events for a user
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  refreshToken?: string | null,
  timeMin?: Date,
  timeMax?: Date
) {
  const oauth2Client = createGoogleOAuthClient(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Get all calendars
  const calendars = await fetchCalendarList(accessToken, refreshToken)

  const allEvents: any[] = []
  const defaultTimeMin = timeMin || new Date()
  const defaultTimeMax = timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead

  // Fetch events from all calendars
  for (const cal of calendars) {
    if (!cal.id) continue

    try {
      const eventsResponse = await calendar.events.list({
        calendarId: cal.id,
        timeMin: defaultTimeMin.toISOString(),
        timeMax: defaultTimeMax.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = eventsResponse.data.items || []
      allEvents.push(...events.map(event => ({
        ...event,
        calendarId: cal.id,
        calendarName: cal.summary,
      })))
    } catch (error) {
      console.error(`Error fetching events from calendar ${cal.id}:`, error)
    }
  }

  return allEvents
}

/**
 * Detects meeting platform from event location or description
 */
export function detectMeetingPlatform(event: any): 'zoom' | 'google' | 'teams' | 'unknown' {
  const location = (event.location || '').toLowerCase()
  const description = (event.description || '').toLowerCase()
  const hangoutLink = event.hangoutLink || ''
  const text = `${location} ${description} ${hangoutLink}`.toLowerCase()

  if (text.includes('zoom.us') || text.includes('zoom.us/')) {
    return 'zoom'
  }
  
  if (text.includes('meet.google.com') || text.includes('google.com/hangouts')) {
    return 'google'
  }
  
  if (text.includes('teams.microsoft.com') || text.includes('teams.live.com')) {
    return 'teams'
  }

  return 'unknown'
}

/**
 * Extracts meeting URL from event
 */
export function extractMeetingUrl(event: any): string | null {
  // Check hangoutLink first (Google Meet)
  if (event.hangoutLink) {
    return event.hangoutLink
  }

  const location = event.location || ''
  const description = event.description || ''
  const text = `${location} ${description}`.toLowerCase()

  // Extract Zoom URL
  const zoomMatch = text.match(/https?:\/\/[a-z0-9-]+\.zoom\.us\/[a-z]\/[0-9]+(?:\?pwd=[\w-]+)?/i)
  if (zoomMatch) {
    return zoomMatch[0]
  }

  // Extract Google Meet URL
  const meetMatch = text.match(/https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i)
  if (meetMatch) {
    return meetMatch[0]
  }

  // Extract Teams URL
  const teamsMatch = text.match(/https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i)
  if (teamsMatch) {
    return teamsMatch[0]
  }

  return null
}

