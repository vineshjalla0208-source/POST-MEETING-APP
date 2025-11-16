import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getRecallBotStatus, getRecallTranscript } from "@/lib/recall-api"

/**
 * Polls Recall.ai for bot status and transcript availability
 * Can be called manually or by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bot_id } = await request.json()

    if (!bot_id) {
      return NextResponse.json(
        { error: "bot_id is required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get bot from database
    const { data: bot, error: botError } = await supabase
      .from('recall_bots')
      .select('*, meetings!inner(user_id)')
      .eq('id', bot_id)
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404 }
      )
    }

    // Verify user owns the meeting
    if (bot.meetings.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get bot status from Recall API
    const recallBot = await getRecallBotStatus(bot.recall_bot_id)

    // Update bot status in database
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'joining': 'joining',
      'recording': 'recording',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
    }

    const newStatus = statusMap[recallBot.status || 'pending'] || 'pending'

    const updateData: any = {
      status: newStatus,
    }

    if (recallBot.recording_started_at) {
      updateData.started_at = new Date(recallBot.recording_started_at)
    }

    if (recallBot.recording_ended_at) {
      updateData.completed_at = new Date(recallBot.recording_ended_at)
    }

    await supabase
      .from('recall_bots')
      .update(updateData)
      .eq('id', bot_id)

    // Check if transcript is available
    let transcriptData = null
    if (newStatus === 'completed' && recallBot.transcript?.id) {
      try {
        const transcript = await getRecallTranscript(bot.recall_bot_id)

        // Check if transcript already exists
        const { data: existingTranscript } = await supabase
          .from('transcripts')
          .select('id')
          .eq('recall_bot_id', bot_id)
          .single()

        if (!existingTranscript && transcript.transcript) {
          // Save transcript to database
          const { data: savedTranscript, error: transcriptError } = await supabase
            .from('transcripts')
            .insert({
              meeting_id: bot.meeting_id,
              recall_bot_id: bot_id,
              content: transcript.transcript,
              summary: transcript.summary || null,
              duration_seconds: transcript.duration_seconds || null,
              participant_count: transcript.participant_count || null,
              participants: transcript.participants || [],
            })
            .select()
            .single()

          if (!transcriptError && savedTranscript) {
            transcriptData = savedTranscript
          }
        } else if (existingTranscript) {
          // Update existing transcript
          const { data: updatedTranscript } = await supabase
            .from('transcripts')
            .update({
              content: transcript.transcript || existingTranscript.content,
              summary: transcript.summary || null,
              duration_seconds: transcript.duration_seconds || null,
              participant_count: transcript.participant_count || null,
              participants: transcript.participants || [],
            })
            .eq('id', existingTranscript.id)
            .select()
            .single()

          if (updatedTranscript) {
            transcriptData = updatedTranscript
          }
        }
      } catch (error: any) {
        console.error('Error fetching transcript:', error)
        // Don't fail the whole request if transcript fetch fails
      }
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        status: newStatus,
        started_at: updateData.started_at,
        completed_at: updateData.completed_at,
      },
      transcript: transcriptData,
    })
  } catch (error: any) {
    console.error("Error polling Recall bot:", error)
    return NextResponse.json(
      { error: error.message || "Failed to poll Recall bot" },
      { status: 500 }
    )
  }
}
