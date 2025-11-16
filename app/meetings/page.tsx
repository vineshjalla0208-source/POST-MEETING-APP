import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MeetingCard } from "@/components/meeting-card"
import { SyncGoogleCalendarButton } from "@/components/sync-google-calendar-button"

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const supabase = createServerSupabaseClient()

  const userId = (session.user as any).id

  // Get upcoming meetings from meetings table
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(50)

  if (error) {
    console.error("Error fetching meetings:", error)
  }

  const upcomingMeetings = meetings || []

  // Get past meetings (for reference)
  const { data: pastMeetings } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", userId)
    .lt("start_time", new Date().toISOString())
    .order("start_time", { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Meetings</h1>
          <p className="text-muted-foreground">
            View and manage your Google Calendar meetings and enable notetaker
          </p>
        </div>
        <SyncGoogleCalendarButton />
      </div>

      {upcomingMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No upcoming meetings found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Sync your Google Calendar to see your meetings here
            </p>
            <SyncGoogleCalendarButton />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Upcoming Meetings</h2>
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </div>

          {pastMeetings && pastMeetings.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Past Meetings</h2>
              <div className="grid gap-4">
                {pastMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

