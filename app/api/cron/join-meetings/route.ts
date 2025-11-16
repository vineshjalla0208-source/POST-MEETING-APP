import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/client"
import { createRecallBot } from "@/lib/recall"

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createSupabaseServerClient()
    const now = new Date()

    // Get user settings to determine join time
    const { data: settings } = await supabase
      .from("user_settings")
      .select("user_id, bot_join_minutes_before")

    const userJoinTimes = new Map(
      settings?.map((s) => [s.user_id, s.bot_join_minutes_before || 5]) || []
    )

    // Get upcoming events with meeting links that don't have bots yet
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*, meeting_bots(id)")
      .not("meeting_link", "is", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", new Date(now.getTime() + 60 * 60 * 1000).toISOString()) // Next hour

    if (eventsError || !events) {
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      )
    }

    const joinedBots = []

    for (const event of events) {
      // Skip if bot already exists
      if (event.meeting_bots && event.meeting_bots.length > 0) {
        continue
      }

      const joinMinutesBefore = userJoinTimes.get(event.user_id) || 5
      const joinTime = new Date(
        new Date(event.start_time).getTime() - joinMinutesBefore * 60 * 1000
      )

      // Only join if it's time (within 5 minutes of join time)
      if (Math.abs(now.getTime() - joinTime.getTime()) > 5 * 60 * 1000) {
        continue
      }

      try {
        // Create Recall bot
        const bot = await createRecallBot(event.meeting_link!)

        // Create meeting bot record
        await supabase.from("meeting_bots").insert({
          event_id: event.id,
          status: "pending",
          recall_bot_id: bot.id,
        })

        joinedBots.push({
          eventId: event.id,
          botId: bot.id,
        })
      } catch (error: any) {
        console.error(`Failed to join meeting for event ${event.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      joined: joinedBots.length,
      bots: joinedBots,
    })
  } catch (error: any) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: error.message || "Cron job failed" },
      { status: 500 }
    )
  }
}

