import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateFollowUpEmail } from "@/lib/openai"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId, transcript: transcriptContent, participants } = await request.json()

    const supabase = createServerSupabaseClient()

    // Support both new format (direct transcript) and old format (fetch from DB)
    let finalTranscript = transcriptContent
    let finalParticipants = participants || []

    if (!finalTranscript && meetingId) {
      // Fallback: fetch from database
      const { data: transcript } = await supabase
        .from("transcripts")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (transcript) {
        finalTranscript = transcript.content
        finalParticipants = transcript.participants || []
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

    // Generate email
    const email = await generateFollowUpEmail(
      finalTranscript,
      finalParticipants
    )

    return NextResponse.json({
      success: true,
      email,
    })
  } catch (error: any) {
    console.error("Generate email error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate email" },
      { status: 500 }
    )
  }
}

