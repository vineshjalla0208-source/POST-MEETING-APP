"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Zap, RefreshCw, Linkedin, Facebook, Copy, Check } from "lucide-react"
import { useState } from "react"
import { PostButton } from "@/components/post-button"

interface AutomationPost {
  automation: {
    id: string
    name: string
    tone: string
    hashtag_count: number
  }
  platform: string
  post: {
    id: string
    content: string
    platform: string
    created_at: string
  }
}

interface AutomationPostCardProps {
  meetingId: string
  initialPosts?: AutomationPost[]
}

export function AutomationPostCard({ meetingId, initialPosts = [] }: AutomationPostCardProps) {
  const [posts, setPosts] = useState<AutomationPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const generateAutomationPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      })

      const data = await response.json()

      if (data.success) {
        setPosts(data.posts || [])
        toast({
          title: "Posts generated",
          description: `Generated ${data.count || 0} post(s) from automations.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate automation posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate automation posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (content: string, postId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(postId)
    toast({
      title: "Copied",
      description: "Post copied to clipboard",
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation Posts
            </CardTitle>
            <CardDescription>
              AI-generated posts based on your automation templates
            </CardDescription>
          </div>
          <Button onClick={generateAutomationPosts} disabled={loading} size="sm">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No automation posts generated yet
            </p>
            <p className="text-xs text-muted-foreground">
              Click "Generate All" to create posts based on your enabled automations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((item) => {
              const PlatformIcon = item.platform === "linkedin" ? Linkedin : Facebook
              const platformName = item.platform === "linkedin" ? "LinkedIn" : "Facebook"
              const isCopied = copiedId === item.post.id

              return (
                <Card key={item.post.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <PlatformIcon className="h-4 w-4" />
                          {platformName}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Automation: {item.automation.name} • {item.automation.tone}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{platformName}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(item.post.content, item.post.id)}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {item.post.content}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.automation.hashtag_count} hashtags</span>
                        <span>•</span>
                        <span>{new Date(item.post.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <PostButton
                          platform={item.platform as "linkedin" | "facebook"}
                          text={item.post.content}
                          meetingId={meetingId}
                          aiPostId={item.post.id}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

