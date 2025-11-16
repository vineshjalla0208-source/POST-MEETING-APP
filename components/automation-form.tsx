"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AutomationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  automation?: {
    id: string
    name: string
    type: string
    prompt_template: string | null
  } | null
  onSuccess: () => void
}

export function AutomationForm({
  open,
  onOpenChange,
  automation,
  onSuccess,
}: AutomationFormProps) {
  const [name, setName] = useState(automation?.name || "")
  const [type, setType] = useState<"email" | "linkedin" | "facebook">(
    (automation?.type as "email" | "linkedin" | "facebook") || "linkedin"
  )
  const [promptTemplate, setPromptTemplate] = useState(
    automation?.prompt_template || ""
  )
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const url = automation
        ? `/api/automations/${automation.id}`
        : "/api/automations"
      const method = automation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          prompt_template: promptTemplate.trim() || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: automation
            ? "Automation updated successfully"
            : "Automation created successfully",
        })
        onSuccess()
        onOpenChange(false)
        // Reset form
        setName("")
        setType("linkedin")
        setPromptTemplate("")
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
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {automation ? "Edit Automation" : "Add Automation"}
          </DialogTitle>
          <DialogDescription>
            {automation
              ? "Update your automation settings"
              : "Create a new automation template for generating content"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., LinkedIn Financial Tips"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: "email" | "linkedin" | "facebook") =>
                  setType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt_template">
                Prompt Template (Optional)
              </Label>
              <Textarea
                id="prompt_template"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder={`Custom prompt template. Use variables:
{transcript} - Meeting transcript
{tone} - Automation tone
{hashtag_count} - Number of hashtags

Example: "Create a ${type === "email" ? "follow-up email" : "social media post"} based on this transcript: {transcript}. Use a {tone} tone."`}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default generation. Use variables:{" "}
                <code className="bg-muted px-1 rounded">{"{transcript}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{tone}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{hashtag_count}"}</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : automation ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

