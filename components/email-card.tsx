"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, Copy, Check, RefreshCw } from "lucide-react"
import { useState } from "react"

interface EmailCardProps {
  meetingId: string
  initialEmail?: string | null
}

export function EmailCard({ meetingId, initialEmail }: EmailCardProps) {
  const [email, setEmail] = useState<string>(initialEmail || "")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      })

      const data = await response.json()

      if (data.success) {
        setEmail(data.email)
        toast({
          title: "Email generated",
          description: "Follow-up email has been generated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!email) return
    navigator.clipboard.writeText(email)
    setCopied(true)
    toast({
      title: "Copied",
      description: "Email copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Follow-up Email
        </CardTitle>
        <CardDescription>AI-generated follow-up email from meeting transcript</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Click 'Generate Email' to create a follow-up email from the meeting transcript"
          rows={12}
          className="font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button onClick={generateEmail} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate Email
              </>
            )}
          </Button>
          {email && (
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

