"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Mail, Linkedin, Facebook, Loader2 } from "lucide-react"
import { AutomationForm } from "@/components/automation-form"

interface Automation {
  id: string
  name: string
  type: string
  prompt_template: string | null
  enabled: boolean
  created_at: string
}

interface AutomationListProps {
  initialAutomations?: Automation[]
}

export function AutomationList({ initialAutomations = [] }: AutomationListProps) {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const { toast } = useToast()

  const fetchAutomations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/automations")
      const data = await response.json()
      if (data.success) {
        setAutomations(data.automations || [])
      }
    } catch (error) {
      console.error("Failed to fetch automations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAutomations()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) {
      return
    }

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Automation deleted successfully",
        })
        fetchAutomations()
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
    setEditingAutomation(automation)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    fetchAutomations()
    setEditingAutomation(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      case "facebook":
        return <Facebook className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automations</CardTitle>
              <CardDescription>
                Manage your automation templates for content generation
              </CardDescription>
            </div>
            <Button onClick={() => {
              setEditingAutomation(null)
              setFormOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No automations yet
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingAutomation(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Automation
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(automation.type)}
                    <div>
                      <p className="font-medium">{automation.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{automation.type}</Badge>
                        {automation.enabled ? (
                          <Badge variant="default">Enabled</Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                        {automation.prompt_template && (
                          <Badge variant="outline">Custom Template</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(automation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AutomationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingAutomation(null)
          }
        }}
        automation={editingAutomation}
        onSuccess={handleFormSuccess}
      />
    </>
  )
}

