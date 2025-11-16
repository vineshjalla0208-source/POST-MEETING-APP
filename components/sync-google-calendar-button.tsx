"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, RefreshCw } from "lucide-react"

export function SyncGoogleCalendarButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Calendar synced",
          description: `Synced ${data.synced} meeting${data.synced !== 1 ? 's' : ''} from Google Calendar`,
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "Sync failed",
          description: data.error || "Failed to sync calendar",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading}>
      {loading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <Calendar className="mr-2 h-4 w-4" />
          Sync Google Calendar
        </>
      )}
    </Button>
  )
}

