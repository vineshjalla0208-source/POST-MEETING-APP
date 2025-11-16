"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function SyncCalendarButton() {
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
          description: `Synced ${data.synced} new events`,
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sync calendar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync calendar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading}>
      {loading ? "Syncing..." : "Sync Calendar"}
    </Button>
  )
}

