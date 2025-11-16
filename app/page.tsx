import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Calendar, MessageSquare, Zap, Share2 } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Post-Meeting Social Media Generator</h1>
        <p className="text-muted-foreground text-lg">
          Automatically generate and post social media content from your meetings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Sync
            </CardTitle>
            <CardDescription>
              Connect your Google Calendar to automatically detect meetings
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Transcription
            </CardTitle>
            <CardDescription>
              Automatically join meetings and generate transcripts
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Generation
            </CardTitle>
            <CardDescription>
              Generate follow-up emails and social media posts
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Posting
            </CardTitle>
            <CardDescription>
              Post directly to LinkedIn and Facebook
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/calendar">
          <Button size="lg">View Calendar</Button>
        </Link>
        <Link href="/meetings">
          <Button variant="outline" size="lg">View Meetings</Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" size="lg">Settings</Button>
        </Link>
        <Link href="/automations">
          <Button variant="outline" size="lg">Automations</Button>
        </Link>
      </div>
    </div>
  )
}
