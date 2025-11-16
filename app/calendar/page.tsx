import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CalendarClient } from '@/components/calendar-client'

export default async function CalendarPage() {
  // Use NextAuth session check only, NOT Supabase Auth
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const supabase = createServerSupabaseClient()

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', (session.user as any).id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching meetings:', error)
  }

  const upcomingMeetings = meetings || []

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage your upcoming meetings. Enable Recall bot to automatically join and transcribe.
        </p>
      </div>

      <CalendarClient initialMeetings={upcomingMeetings} />
    </div>
  )
}
