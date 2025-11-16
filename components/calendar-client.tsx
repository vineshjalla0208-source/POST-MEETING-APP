'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Calendar, Video, RefreshCw, LogIn } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  meeting_url: string | null
  platform: 'zoom' | 'google' | 'teams' | 'unknown'
  notetaker_enabled: boolean
  google_event_id: string
}

interface CalendarClientProps {
  initialMeetings: Meeting[]
}

export function CalendarClient({ initialMeetings }: CalendarClientProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [syncing, setSyncing] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  const syncCalendar = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync calendar')
      }

      toast({
        title: 'Calendar synced',
        description: `Synced ${data.synced} meetings from Google Calendar`,
      })

      window.location.reload()
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync calendar events',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const toggleRecallBot = async (meetingId: string, enabled: boolean) => {
    setToggling(meetingId)
    try {
      const response = await fetch('/api/calendar/toggle-recall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          enabled,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update meeting')
      }

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId ? { ...m, notetaker_enabled: enabled } : m
        )
      )

      toast({
        title: enabled ? 'Recall bot enabled' : 'Recall bot disabled',
        description: `The bot will ${enabled ? 'join' : 'not join'} this meeting`,
      })
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update meeting',
        variant: 'destructive',
      })
    } finally {
      setToggling(null)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '🔵'
      case 'google':
        return '🟢'
      case 'teams':
        return '🟣'
      default:
        return '⚪'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'bg-blue-100 text-blue-800'
      case 'google':
        return 'bg-green-100 text-green-800'
      case 'teams':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No upcoming meetings found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Sync your Google Calendar to see your meetings here
          </p>
          <Button onClick={syncCalendar} disabled={syncing}>
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={syncCalendar} disabled={syncing} variant="outline">
          {syncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Calendar
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => {
          const startDate = new Date(meeting.start_time)
          const endDate = new Date(meeting.end_time)
          const isPast = endDate < new Date()

          return (
            <Card key={meeting.id} className={isPast ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{meeting.title}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(startDate, 'EEE, MMM d, yyyy')} at{' '}
                          {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                        </span>
                      </div>
                      {meeting.meeting_url && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <a
                            href={meeting.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getPlatformColor(meeting.platform)}>
                    {getPlatformIcon(meeting.platform)} {meeting.platform}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`recall-${meeting.id}`}
                      checked={meeting.notetaker_enabled}
                      onCheckedChange={(checked) =>
                        toggleRecallBot(meeting.id, checked)
                      }
                      disabled={toggling === meeting.id || isPast}
                    />
                    <Label
                      htmlFor={`recall-${meeting.id}`}
                      className="cursor-pointer"
                    >
                      Send Recall bot to this meeting
                    </Label>
                  </div>
                  {meeting.notetaker_enabled && (
                    <Badge variant="secondary" className="ml-4">
                      <LogIn className="mr-1 h-3 w-3" />
                      Bot Enabled
                    </Badge>
                  )}
                </div>
                {isPast && (
                  <p className="text-sm text-muted-foreground mt-2">
                    This meeting has already ended
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

