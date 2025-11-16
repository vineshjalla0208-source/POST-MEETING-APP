"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit2 } from "lucide-react"
import type { Automation } from "@/lib/types"

interface AutomationsClientProps {
  initialAutomations: Automation[]
}

export function AutomationsClient({ initialAutomations }: AutomationsClientProps) {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [editing, setEditing] = useState<Automation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    platform: "both" as "linkedin" | "facebook" | "both",
    tone: "warm financial advisor",
    hashtag_count: 3,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editing ? `/api/automations/${editing.id}` : "/api/automations"
      const method = editing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        if (editing) {
          setAutomations(
            automations.map((a) => (a.id === editing.id ? data.automation : a))
          )
        } else {
          setAutomations([...automations, data.automation])
        }
        setShowForm(false)
        setEditing(null)
        setFormData({
          name: "",
          platform: "both",
          tone: "warm financial advisor",
          hashtag_count: 3,
        })
        toast({
          title: "Success",
          description: editing ? "Automation updated" : "Automation created",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save automation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save automation",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setAutomations(automations.filter((a) => a.id !== id))
        toast({
          title: "Deleted",
          description: "Automation deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete automation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (automation: Automation) => {
    setEditing(automation)
    setFormData({
      name: automation.name,
      platform: automation.platform,
      tone: automation.tone,
      hashtag_count: automation.hashtag_count,
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Automations</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Automation" : "Create Automation"}</CardTitle>
            <CardDescription>
              Configure automation settings for social media post generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      platform: e.target.value as "linkedin" | "facebook" | "both",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <Label htmlFor="tone">Tone</Label>
                <Input
                  id="tone"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="e.g., warm financial advisor"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hashtag_count">Hashtag Count</Label>
                <Input
                  id="hashtag_count"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.hashtag_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hashtag_count: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(null)
                    setFormData({
                      name: "",
                      platform: "both",
                      tone: "warm financial advisor",
                      hashtag_count: 3,
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {automations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No automations yet</p>
            </CardContent>
          </Card>
        ) : (
          automations.map((automation) => (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{automation.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {automation.tone} • {automation.hashtag_count} hashtags
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(automation)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant={automation.enabled ? "default" : "secondary"}>
                    {automation.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">{automation.platform}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

