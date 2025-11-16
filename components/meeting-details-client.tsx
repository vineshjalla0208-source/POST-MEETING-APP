"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, Share2, Copy, Check } from "lucide-react"

interface MeetingDetailsClientProps {
  meetingId: string
  transcript?: {
    id: string
    content: string
    participants?: string[]
  }
}

export function MeetingDetailsClient({ meetingId, transcript }: MeetingDetailsClientProps) {
  const [email, setEmail] = useState<string>("")
  const [post, setPost] = useState<string>("")
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateEmail = async () => {
    if (!transcript) {
      toast({
        title: "No transcript",
        description: "Transcript is required to generate email",
        variant: "destructive",
      })
      return
    }

    setLoadingEmail(true)
    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          meetingId,
          transcript: transcript.content,
          participants: transcript.participants || [],
        }),
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
      setLoadingEmail(false)
    }
  }

  const generatePost = async () => {
    if (!transcript) {
      toast({
        title: "No transcript",
        description: "Transcript is required to generate post",
        variant: "destructive",
      })
      return
    }

    setLoadingPost(true)
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          meetingId,
          transcript: transcript.content,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPost(data.post)
        toast({
          title: "Post generated",
          description: "Social media post has been generated successfully.",
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
      setLoadingPost(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const postToLinkedIn = async () => {
    if (!post) return

    setPosting(true)
    try {
      const response = await fetch("/api/social/linkedin-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Posted",
          description: "Successfully posted to LinkedIn",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to post to LinkedIn",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post to LinkedIn",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const postToFacebook = async () => {
    if (!post) return

    setPosting(true)
    try {
      const response = await fetch("/api/social/facebook-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Posted",
          description: "Successfully posted to Facebook",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to post to Facebook",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post to Facebook",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-up Email
          </CardTitle>
          <CardDescription>AI-generated follow-up email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Click 'Generate Email' to create a follow-up email"
            rows={10}
          />
          <div className="flex gap-2">
            <Button onClick={generateEmail} disabled={loadingEmail}>
              {loadingEmail ? "Generating..." : "Generate Email"}
            </Button>
            {email && (
              <Button
                variant="outline"
                onClick={() => copyToClipboard(email)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Post
          </CardTitle>
          <CardDescription>AI-generated social media post (120-180 words)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder="Click 'Generate Post' to create a social media post"
            rows={8}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={generatePost} disabled={loadingPost}>
              {loadingPost ? "Generating..." : "Generate Post"}
            </Button>
            {post && (
              <>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(post)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={postToLinkedIn}
                  disabled={posting}
                >
                  Post to LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={postToFacebook}
                  disabled={posting}
                >
                  Post to Facebook
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

