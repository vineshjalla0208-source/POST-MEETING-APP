"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Linkedin, Facebook, Loader2, Check } from "lucide-react"

interface PostButtonProps {
  platform: "linkedin" | "facebook"
  text: string
  meetingId?: string
  aiPostId?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PostButton({
  platform,
  text,
  meetingId,
  aiPostId,
  variant = "outline",
  size = "default",
}: PostButtonProps) {
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const { toast } = useToast()

  const handlePost = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "No content to post",
        variant: "destructive",
      })
      return
    }

    setPosting(true)
    setPosted(false)

    try {
      const endpoint = platform === "linkedin" 
        ? "/api/social/linkedin/post" 
        : "/api/social/facebook/post"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          meetingId,
          aiPostId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPosted(true)
        toast({
          title: "Success",
          description: `Successfully posted to ${platform === "linkedin" ? "LinkedIn" : "Facebook"}`,
        })
        // Reset posted state after 3 seconds
        setTimeout(() => setPosted(false), 3000)
      } else {
        // Check if reconnection is required
        if (data.requiresReconnect) {
          toast({
            title: "Connection Required",
            description: data.error || `Please connect your ${platform === "linkedin" ? "LinkedIn" : "Facebook"} account in Settings.`,
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/settings"}
              >
                Go to Settings
              </Button>
            ),
          })
        } else {
          toast({
            title: "Error",
            description: data.error || `Failed to post to ${platform === "linkedin" ? "LinkedIn" : "Facebook"}`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to post to ${platform === "linkedin" ? "LinkedIn" : "Facebook"}`,
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const PlatformIcon = platform === "linkedin" ? Linkedin : Facebook
  const platformName = platform === "linkedin" ? "LinkedIn" : "Facebook"

  return (
    <Button
      onClick={handlePost}
      disabled={posting || !text.trim()}
      variant={variant}
      size={size}
    >
      {posting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Posting...
        </>
      ) : posted ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Posted
        </>
      ) : (
        <>
          <PlatformIcon className="mr-2 h-4 w-4" />
          Post to {platformName}
        </>
      )}
    </Button>
  )
}

