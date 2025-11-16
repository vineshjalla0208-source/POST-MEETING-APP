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

    const { meetingId, transcript: transcriptContent, tone, hashtagCount, automationId } = await request.json()

    // Support both new format (direct transcript) and old format (fetch from DB)
    let finalTranscript = transcriptContent
    let finalTone = tone || "warm financial advisor"
    let finalHashtagCount = hashtagCount || 3

    if (!finalTranscript && meetingId) {
      // Fallback: fetch from database
      const supabase = createServerSupabaseClient()

      // Get automation settings if provided
      if (automationId) {
        const { data: automation } = await supabase
          .from("automations")
          .select("*")
          .eq("id", automationId)
          .eq("user_id", session.user.id)
          .single()

        if (automation) {
          finalTone = automation.tone
          finalHashtagCount = automation.hashtag_count
        }
      }

      const { data: transcript } = await supabase
        .from("transcripts")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (transcript) {
        finalTranscript = transcript.content
      }
    }

    if (!finalTranscript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      )
    }

    // Verify meeting belongs to user if meetingId provided
    if (meetingId) {
      const supabase = createServerSupabaseClient()
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("id")
        .eq("id", meetingId)
        .eq("user_id", session.user.id)
        .single()

      if (meetingError || !meeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
      }
    }

    // Generate post
    const post = await generateSocialPost(
      finalTranscript,
      finalTone,
      finalHashtagCount
    )

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error: any) {
    console.error("Generate post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate post" },
      { status: 500 }
    )
  }
}

