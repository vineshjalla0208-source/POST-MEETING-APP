"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranscriptPolling } from "@/hooks/use-transcript-polling"
import { Bot, Play, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"

interface RecallBotControlProps {
  meetingId: string
  meetingUrl: string | null
  meetingStartTime: string
  recallBot: any
}

export function RecallBotControl({ 
  meetingId, 
  meetingUrl, 
  meetingStartTime,
  recallBot 
}: RecallBotControlProps) {
  const [bot, setBot] = useState(recallBot)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setBot(recallBot)
  }, [recallBot])

  // Auto-poll for transcript when bot is active
  const shouldPoll = bot && 
    bot.status !== 'completed' && 
    bot.status !== 'failed' && 
    bot.status !== null

  useTranscriptPolling({
    botId: bot?.id,
    enabled: shouldPoll || false,
    onTranscriptReady: () => {
      // Refresh page when transcript is ready
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    interval: 10000, // Poll every 10 seconds
  })

  const handleCreateBot = async () => {
    if (!meetingUrl) {
      toast({
        title: "Error",
        description: "No meeting URL available for this meeting",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/recall/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          meeting_url: meetingUrl,
          meeting_start_time: meetingStartTime,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBot(data.bot)
        toast({
          title: "Bot created",
          description: "Recall bot has been created and will join the meeting.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create bot",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bot",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePollBot = async () => {
    if (!bot) return

    setPolling(true)
    try {
      const response = await fetch('/api/recall/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: bot.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBot((prev: any) => ({
          ...prev,
          status: data.bot.status,
          started_at: data.bot.started_at,
          completed_at: data.bot.completed_at,
        }))

        if (data.transcript) {
          toast({
            title: "Transcript available",
            description: "The meeting transcript has been saved.",
          })
          // Refresh page to show transcript
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          toast({
            title: "Status updated",
            description: `Bot status: ${data.bot.status}`,
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to poll bot",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to poll bot",
        variant: "destructive",
      })
    } finally {
      setPolling(false)
    }
  }

  const getStatusBadge = () => {
    if (!bot) return null

    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      joining: { label: 'Joining', variant: 'secondary', icon: RefreshCw },
      recording: { label: 'Recording', variant: 'default', icon: Play },
      processing: { label: 'Processing', variant: 'secondary', icon: RefreshCw },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
      failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
    }

    const config = statusConfig[bot.status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (!bot) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No Recall bot has been created for this meeting yet.
        </p>
        <Button 
          onClick={handleCreateBot} 
          disabled={loading || !meetingUrl}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating bot...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Create Recall Bot
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Bot Status</p>
          <div className="mt-1">
            {getStatusBadge()}
          </div>
        </div>
        <Button
          onClick={handlePollBot}
          disabled={polling || bot.status === 'completed'}
          variant="outline"
          size="sm"
        >
          {polling ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </>
          )}
        </Button>
      </div>

      {bot.started_at && (
        <div className="text-sm text-muted-foreground">
          Started: {new Date(bot.started_at).toLocaleString()}
        </div>
      )}

      {bot.completed_at && (
        <div className="text-sm text-muted-foreground">
          Completed: {new Date(bot.completed_at).toLocaleString()}
        </div>
      )}

      {bot.error_message && (
        <div className="text-sm text-destructive">
          Error: {bot.error_message}
        </div>
      )}

      {bot.status !== 'completed' && bot.status !== 'failed' && (
        <p className="text-xs text-muted-foreground">
          The bot will automatically join the meeting and start recording. 
          Check back later or click &quot;Check Status&quot; to update.
        </p>
      )}
    </div>
  )
}

