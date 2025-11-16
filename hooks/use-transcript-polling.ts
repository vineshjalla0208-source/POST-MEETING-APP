"use client"

import { useEffect, useRef } from "react"

interface UseTranscriptPollingOptions {
  botId: string | null | undefined
  enabled: boolean
  onTranscriptReady?: () => void
  interval?: number // in milliseconds
}

/**
 * Hook to automatically poll for transcript updates
 * Polls every 10 seconds by default when bot is active
 */
export function useTranscriptPolling({
  botId,
  enabled,
  onTranscriptReady,
  interval = 10000, // 10 seconds
}: UseTranscriptPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Don't poll if disabled or no bot ID
    if (!enabled || !botId) {
      return
    }

    // Poll immediately on mount
    const poll = async () => {
      try {
        const response = await fetch("/api/recall/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bot_id: botId }),
        })

        const data = await response.json()

        if (data.success) {
          // If transcript is ready, trigger callback
          if (data.transcript && onTranscriptReady) {
            onTranscriptReady()
          }
        }
      } catch (error) {
        console.error("Error polling transcript:", error)
      }
    }

    // Poll immediately
    poll()

    // Set up interval for polling
    intervalRef.current = setInterval(poll, interval)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [botId, enabled, interval, onTranscriptReady])
}

