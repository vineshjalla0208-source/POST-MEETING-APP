"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Share2, Copy, Check, RefreshCw, Linkedin, Facebook } from "lucide-react"
import { useState } from "react"
import { PostButton } from "@/components/post-button"

interface SocialPostCardProps {
  meetingId: string
  platform: "linkedin" | "facebook"
  initialPost?: string | null
  aiPostId?: string
}

export function SocialPostCard({ meetingId, platform, initialPost, aiPostId }: SocialPostCardProps) {
  const [post, setPost] = useState<string>(initialPost || "")
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generatePost = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, platform }),
      })

      const data = await response.json()

      if (data.success) {
        setPost(data.post)
        toast({
          title: "Post generated",
          description: `${platform === "linkedin" ? "LinkedIn" : "Facebook"} post has been generated successfully.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate post",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate post",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!post) return
    navigator.clipboard.writeText(post)
    setCopied(true)
    toast({
      title: "Copied",
      description: "Post copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }


  const PlatformIcon = platform === "linkedin" ? Linkedin : Facebook
  const platformName = platform === "linkedin" ? "LinkedIn" : "Facebook"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlatformIcon className="h-5 w-5" />
              {platformName} Post
            </CardTitle>
            <CardDescription>AI-generated social media post (120-180 words)</CardDescription>
          </div>
          <Badge variant="secondary">{platformName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder={`Click 'Generate ${platformName} Post' to create a social media post from the meeting transcript`}
          rows={10}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={generatePost} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Generate {platformName} Post
              </>
            )}
          </Button>
          {post && (
            <>
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
              <PostButton
                platform={platform}
                text={post}
                meetingId={meetingId}
                aiPostId={aiPostId}
                variant="outline"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

