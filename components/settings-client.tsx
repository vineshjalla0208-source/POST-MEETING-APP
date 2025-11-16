"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface SettingsClientProps {
  initialSettings: any
  botJoinMinutesBefore: number
}

export function SettingsClient({ initialSettings, botJoinMinutesBefore: initialMinutes }: SettingsClientProps) {
  const [minutes, setMinutes] = useState(initialMinutes)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_join_minutes_before: minutes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Your settings have been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot Settings</CardTitle>
        <CardDescription>Configure when the meeting bot joins meetings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="minutes">Join minutes before meeting</Label>
          <Input
            id="minutes"
            type="number"
            min="0"
            max="60"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            The bot will join meetings this many minutes before they start (0-60)
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}

