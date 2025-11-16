import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Video, Users, Mail, Share2, Clock, Calendar } from "lucide-react"
import { RecallBotControl } from "@/components/recall-bot-control"
import { TranscriptDisplay } from "@/components/transcript-display"
import { EmailCard } from "@/components/email-card"
import { SocialPostCard } from "@/components/social-post-card"
import { AutomationPostCard } from "@/components/automation-post-card"

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const supabase = createServerSupabaseClient()

  // Get meeting from meetings table
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (meetingError || !meeting) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Meeting not found</h1>
          <p className="text-muted-foreground">The meeting you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  // Get Recall bot for this meeting
  const { data: recallBot } = await supabase
    .from("recall_bots")
    .select("*")
    .eq("meeting_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Get transcript
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("meeting_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Get existing AI posts
  const { data: aiPosts } = await supabase
    .from("ai_posts")
    .select("*")
    .eq("meeting_id", params.id)
    .order("created_at", { ascending: false })

  // Organize AI posts by type
  const emailPost = aiPosts?.find(p => p.type === 'email')
  const linkedinPost = aiPosts?.find(p => p.type === 'linkedin')
  const facebookPost = aiPosts?.find(p => p.type === 'facebook')
  const automationPosts = aiPosts?.filter(p => p.type === 'automation') || []

  // Get automation details for automation posts
  const automationIds = automationPosts
    .map(p => p.automation_id)
    .filter((id): id is string => id !== null)

  let automationsMap: Record<string, any> = {}
  if (automationIds.length > 0) {
    const { data: automations } = await supabase
      .from("automations")
      .select("*")
      .in("id", automationIds)

    if (automations) {
      automationsMap = automations.reduce((acc, auto) => {
        acc[auto.id] = auto
        return acc
      }, {} as Record<string, any>)
    }
  }

  // Format automation posts for component
  const formattedAutomationPosts = automationPosts.map(post => {
    const automation = post.automation_id ? automationsMap[post.automation_id] : null
    return {
      automation: {
        id: post.automation_id || '',
        name: automation?.name || 'Automation',
        tone: automation?.tone || 'warm financial advisor',
        hashtag_count: automation?.hashtag_count || 3,
      },
      platform: post.platform || 'linkedin',
      post: {
        id: post.id,
        content: post.content,
        platform: post.platform || 'linkedin',
        created_at: post.created_at,
      },
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{meeting.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(meeting.start_time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(meeting.end_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {meeting.platform && meeting.platform !== 'unknown' && (
            <Badge variant="secondary">
              <Video className="h-3 w-3 mr-1" />
              {meeting.platform.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Bot Control & Meeting Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recall Bot</CardTitle>
              <CardDescription>Manage the notetaker bot for this meeting</CardDescription>
            </CardHeader>
            <CardContent>
              <RecallBotControl 
                meetingId={meeting.id}
                meetingUrl={meeting.meeting_url}
                meetingStartTime={meeting.start_time}
                recallBot={recallBot}
              />
            </CardContent>
          </Card>

          {meeting.meeting_url && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Link</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {meeting.meeting_url}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column: Transcript */}
        <div className="space-y-6">
          <TranscriptDisplay 
            transcript={transcript}
            recallBot={recallBot}
          />
        </div>

        {/* Right Column: AI Generated Content */}
        <div className="space-y-6">
          {transcript ? (
            <>
              <EmailCard 
                meetingId={meeting.id}
                initialEmail={emailPost?.content || null}
              />

              <SocialPostCard
                meetingId={meeting.id}
                platform="linkedin"
                initialPost={linkedinPost?.content || null}
                aiPostId={linkedinPost?.id || undefined}
              />

              <SocialPostCard
                meetingId={meeting.id}
                platform="facebook"
                initialPost={facebookPost?.content || null}
                aiPostId={facebookPost?.id || undefined}
              />

              <AutomationPostCard
                meetingId={meeting.id}
                initialPosts={formattedAutomationPosts}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Transcript is required to generate AI content.
                  Please wait for the meeting to be recorded.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

