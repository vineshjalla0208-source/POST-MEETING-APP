"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Linkedin, Facebook, CheckCircle2, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"

interface SocialConnectSectionProps {
  initialLinkedInConnected?: boolean
  initialFacebookConnected?: boolean
}

export function SocialConnectSection({
  initialLinkedInConnected = false,
  initialFacebookConnected = false,
}: SocialConnectSectionProps) {
  const [linkedInConnected, setLinkedInConnected] = useState(initialLinkedInConnected)
  const [facebookConnected, setFacebookConnected] = useState(initialFacebookConnected)
  const [loading, setLoading] = useState<"linkedin" | "facebook" | null>(null)
  const { toast } = useToast()

  const handleConnect = async (provider: "linkedin" | "facebook") => {
    setLoading(provider)
    try {
      // Use NextAuth signIn for OAuth flow
      await signIn(provider, {
        callbackUrl: "/settings",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to connect ${provider}`,
        variant: "destructive",
      })
      setLoading(null)
    }
  }

  const handleDisconnect = async (provider: "linkedin" | "facebook") => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/social/${provider}/disconnect`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `${provider} disconnected successfully`,
        })
        if (provider === "linkedin") {
          setLinkedInConnected(false)
        } else {
          setFacebookConnected(false)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to disconnect ${provider}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to disconnect ${provider}`,
        variant: "destructive",
      })
    }
  }

  // Check connection status on mount
  useEffect(() => {
    const checkConnections = async () => {
      try {
        const [linkedInRes, facebookRes] = await Promise.all([
          fetch("/api/social/linkedin/status"),
          fetch("/api/social/facebook/status"),
        ])

        if (linkedInRes.ok) {
          const linkedInData = await linkedInRes.json()
          setLinkedInConnected(linkedInData.connected || false)
        }

        if (facebookRes.ok) {
          const facebookData = await facebookRes.json()
          setFacebookConnected(facebookData.connected || false)
        }
      } catch (error) {
        // Silently fail - use initial values
      }
    }

    checkConnections()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to post directly from the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* LinkedIn */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Linkedin className="h-5 w-5 text-[#0077b5]" />
            <div>
              <p className="font-medium">LinkedIn</p>
              <p className="text-sm text-muted-foreground">
                Post directly to your LinkedIn profile
              </p>
            </div>
          </div>
          {linkedInConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect("linkedin")}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect("linkedin")}
              disabled={loading === "linkedin"}
            >
              {loading === "linkedin" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-4 w-4" />
                  Connect LinkedIn
                </>
              )}
            </Button>
          )}
        </div>

        {/* Facebook */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Facebook className="h-5 w-5 text-[#1877f2]" />
            <div>
              <p className="font-medium">Facebook</p>
              <p className="text-sm text-muted-foreground">
                Post directly to your Facebook page
              </p>
            </div>
          </div>
          {facebookConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect("facebook")}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect("facebook")}
              disabled={loading === "facebook"}
            >
              {loading === "facebook" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Facebook className="mr-2 h-4 w-4" />
                  Connect Facebook
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

