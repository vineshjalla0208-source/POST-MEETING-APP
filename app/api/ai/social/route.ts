import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateSocialPost } from "@/lib/openai"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId, platform } = await request.json()

    if (!meetingId || !platform) {
      return NextResponse.json(
        { error: "meetingId and platform are required" },
        { status: 400 }
      )
    }

    if (platform !== "linkedin" && platform !== "facebook") {
      return NextResponse.json(
        { error: "platform must be 'linkedin' or 'facebook'" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify meeting belongs to user
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id, title")
      .eq("id", meetingId)
      .eq("user_id", session.user.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Get transcript for the meeting
    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transcriptError || !transcript) {
      return NextResponse.json(
        { error: "Transcript not found. Please ensure the meeting has been recorded." },
        { status: 404 }
      )
    }

    // Platform-specific tone and rules
    const platformRules: Record<string, { tone: string; hashtagCount: number }> = {
      linkedin: {
        tone: "professional and engaging financial advisor",
        hashtagCount: 3,
      },
      facebook: {
        tone: "warm and friendly financial advisor",
        hashtagCount: 2,
      },
    }

    const rules = platformRules[platform]

    // Generate social post
    const postContent = await generateSocialPost(
      transcript.content,
      rules.tone,
      rules.hashtagCount
    )

    // Save to ai_posts table
    const { data: savedPost, error: saveError } = await supabase
      .from("ai_posts")
      .insert({
        meeting_id: meetingId,
        type: platform,
        content: postContent,
        platform: platform,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving AI post:", saveError)
      // Still return the generated content even if save fails
    }

    return NextResponse.json({
      success: true,
      post: postContent,
      savedPost: savedPost || null,
    })
  } catch (error: any) {
    console.error("Generate social post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate social post" },
      { status: 500 }
    )
  }
}

