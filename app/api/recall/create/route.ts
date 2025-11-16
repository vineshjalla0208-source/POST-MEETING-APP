import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createRecallBot } from "@/lib/recall-api"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meeting_id, meeting_url, meeting_start_time, bot_name } = await request.json()

    if (!meeting_id || !meeting_url) {
      return NextResponse.json(
        { error: "meeting_id and meeting_url are required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify meeting belongs to user
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, user_id, title, start_time')
      .eq('id', meeting_id)
      .eq('user_id', session.user.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    // Check if bot already exists for this meeting
    const { data: existingBot } = await supabase
      .from('recall_bots')
      .select('id, recall_bot_id, status')
      .eq('meeting_id', meeting_id)
      .single()

    if (existingBot) {
      return NextResponse.json({
        success: true,
        message: "Bot already exists for this meeting",
        bot: existingBot,
      })
    }

    // Use meeting start_time if not provided
    const startTime = meeting_start_time || meeting.start_time

    // Create Recall bot
    const recallBot = await createRecallBot(
      meeting_url,
      startTime,
      bot_name || `Bot for ${meeting.title}`
    )

    // Save bot to database
    const { data: savedBot, error: saveError } = await supabase
      .from('recall_bots')
      .insert({
        meeting_id: meeting_id,
        recall_bot_id: recallBot.id,
        status: recallBot.status || 'pending',
        meeting_url: meeting_url,
        started_at: recallBot.recording_started_at ? new Date(recallBot.recording_started_at) : null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving Recall bot:', saveError)
      return NextResponse.json(
        { error: "Failed to save bot to database" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bot: savedBot,
      recall_bot: recallBot,
    })
  } catch (error: any) {
    console.error("Error creating Recall bot:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create Recall bot" },
      { status: 500 }
    )
  }
}

