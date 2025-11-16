import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getRecallTranscript } from "@/lib/recall"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { botId, meetingBotId } = await request.json()

    if (!botId || !meetingBotId) {
      return NextResponse.json(
        { error: "botId and meetingBotId are required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify bot belongs to user's event
    const { data: meetingBot, error: botError } = await supabase
      .from("meeting_bots")
      .select("*, events!inner(user_id, id)")
      .eq("id", meetingBotId)
      .single()

    if (botError || !meetingBot) {
      return NextResponse.json({ error: "Meeting bot not found" }, { status: 404 })
    }

    if (meetingBot.events.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get transcript from Recall API
    const transcriptContent = await getRecallTranscript(botId)

    // Extract attendees (simplified - in production, parse from transcript or API)
    const attendees: string[] = []

    // Save transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .insert({
        event_id: meetingBot.events.id,
        meeting_bot_id: meetingBotId,
        content: transcriptContent,
        attendees: attendees,
      })
      .select()
      .single()

    if (transcriptError || !transcript) {
      return NextResponse.json(
        { error: "Failed to save transcript" },
        { status: 500 }
      )
    }

    // Update meeting bot status
    await supabase
      .from("meeting_bots")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", meetingBotId)

    return NextResponse.json({
      success: true,
      transcript,
    })
  } catch (error: any) {
    console.error("Save transcript error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save transcript" },
      { status: 500 }
    )
  }
}

