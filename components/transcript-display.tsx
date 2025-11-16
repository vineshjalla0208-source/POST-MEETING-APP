"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, FileText } from "lucide-react"

interface TranscriptDisplayProps {
  transcript: any
  recallBot: any
}

export function TranscriptDisplay({ transcript, recallBot }: TranscriptDisplayProps) {
  if (!transcript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>Meeting transcript from Recall.ai</CardDescription>
        </CardHeader>
        <CardContent>
          {recallBot && recallBot.status === 'completed' ? (
            <p className="text-sm text-muted-foreground">
              Transcript is being processed. Please check back in a few minutes.
            </p>
          ) : recallBot ? (
            <p className="text-sm text-muted-foreground">
              Transcript will be available after the meeting is completed and processed.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transcript available. Create a Recall bot to record this meeting.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Meeting transcript from Recall.ai</CardDescription>
          </div>
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Available
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcript.summary && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">{transcript.summary}</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-2">Full Transcript</h4>
          <div className="rounded-md bg-muted p-4 max-h-96 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {transcript.content}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {transcript.duration_seconds && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.floor(transcript.duration_seconds / 60)} minutes
            </div>
          )}
          {transcript.participant_count && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {transcript.participant_count} participant{transcript.participant_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {transcript.participants && transcript.participants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Participants</h4>
            <div className="flex flex-wrap gap-2">
              {transcript.participants.map((participant: string, index: number) => (
                <Badge key={index} variant="outline">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

