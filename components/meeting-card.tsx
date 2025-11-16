"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Video, Calendar, Clock, ExternalLink, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface MeetingCardProps {
  meeting: {
    id: string
    title: string
    start_time: string
    end_time: string
    meeting_url: string | null
    platform: 'zoom' | 'google' | 'teams' | 'unknown'
    notetaker_enabled: boolean
  }
  onToggle?: () => void
}

export function MeetingCard({ meeting, onToggle }: MeetingCardProps) {
  const [enabled, setEnabled] = useState(meeting.notetaker_enabled)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    try {
      const response = await fetch('/api/google/toggle-notetaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meeting.id,
          enabled: checked,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEnabled(checked)
        toast({
          title: checked ? "Notetaker enabled" : "Notetaker disabled",
          description: `Notetaker ${checked ? 'will' : 'will not'} join this meeting.`,
        })
        onToggle?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update notetaker setting",
          variant: "destructive",
        })
        setEnabled(!checked) // Revert on error
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notetaker setting",
        variant: "destructive",
      })
      setEnabled(!checked) // Revert on error
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = () => {
    switch (meeting.platform) {
      case 'zoom':
        return <Video className="h-4 w-4 text-blue-600" />
      case 'google':
        return <Video className="h-4 w-4 text-green-600" />
      case 'teams':
        return <Video className="h-4 w-4 text-purple-600" />
      default:
        return <Video className="h-4 w-4 text-gray-600" />
    }
  }

  const getPlatformBadge = () => {
    switch (meeting.platform) {
      case 'zoom':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Zoom</Badge>
      case 'google':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Google Meet</Badge>
      case 'teams':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Teams</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/meetings/${meeting.id}`}>
              <CardTitle className="mb-2 hover:text-primary transition-colors cursor-pointer">
                {meeting.title}
              </CardTitle>
            </Link>
            <CardDescription className="flex flex-wrap gap-4 items-center">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(meeting.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(meeting.end_time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getPlatformIcon()}
            {getPlatformBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id={`notetaker-${meeting.id}`}
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
            <Label htmlFor={`notetaker-${meeting.id}`} className="cursor-pointer">
              Enable notetaker
            </Label>
          </div>
          <div className="flex items-center gap-3">
            {meeting.meeting_url && (
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Join meeting
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Link href={`/meetings/${meeting.id}`}>
              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

