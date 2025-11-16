import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getRecallBotStatus, getRecallTranscript } from "@/lib/recall-api"

/**
 * Background polling service for all active Recall bots
 * This endpoint can be called by a cron job to check all bots
 * 
 * Usage: Set up a cron job to call this endpoint every 5-10 minutes
 * Example: Vercel Cron Job
 */
export async function GET(request: NextRequest) {
  // Verify cron secret if provided
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Get all active bots (not completed or failed)
    const { data: activeBots, error: botsError } = await supabase
      .from('recall_bots')
      .select('*, meetings!inner(user_id)')
      .in('status', ['pending', 'joining', 'recording', 'processing'])

    if (botsError) {
      return NextResponse.json(
        { error: "Failed to fetch active bots" },
        { status: 500 }
      )
    }

    if (!activeBots || activeBots.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active bots to poll",
        processed: 0,
      })
    }

    const results = []
    const errors = []

    // Poll each bot
    for (const bot of activeBots) {
      try {
        // Get bot status from Recall API
        const recallBot = await getRecallBotStatus(bot.recall_bot_id)

        // Update bot status
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
          .eq('id', bot.id)

        // Check if transcript is available
        if (newStatus === 'completed' && recallBot.transcript?.id) {
          try {
            const transcript = await getRecallTranscript(bot.recall_bot_id)

            // Check if transcript already exists
            const { data: existingTranscript } = await supabase
              .from('transcripts')
              .select('id')
              .eq('recall_bot_id', bot.id)
              .single()

            if (!existingTranscript && transcript.transcript) {
              // Save transcript
              await supabase
                .from('transcripts')
                .insert({
                  meeting_id: bot.meeting_id,
                  recall_bot_id: bot.id,
                  content: transcript.transcript,
                  summary: transcript.summary || null,
                  duration_seconds: transcript.duration_seconds || null,
                  participant_count: transcript.participant_count || null,
                  participants: transcript.participants || [],
                })
            } else if (existingTranscript && transcript.transcript) {
              // Update existing transcript
              await supabase
                .from('transcripts')
                .update({
                  content: transcript.transcript,
                  summary: transcript.summary || null,
                  duration_seconds: transcript.duration_seconds || null,
                  participant_count: transcript.participant_count || null,
                  participants: transcript.participants || [],
                })
                .eq('id', existingTranscript.id)
            }

            results.push({
              bot_id: bot.id,
              status: newStatus,
              transcript_saved: !!transcript.transcript,
            })
          } catch (transcriptError: any) {
            errors.push({
              bot_id: bot.id,
              error: `Failed to fetch transcript: ${transcriptError.message}`,
            })
          }
        } else {
          results.push({
            bot_id: bot.id,
            status: newStatus,
            transcript_saved: false,
          })
        }
      } catch (botError: any) {
        errors.push({
          bot_id: bot.id,
          error: botError.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Error polling all Recall bots:", error)
    return NextResponse.json(
      { error: error.message || "Failed to poll bots" },
      { status: 500 }
    )
  }
}

