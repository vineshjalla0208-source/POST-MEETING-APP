import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createRecallBot } from "@/lib/recall"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, meetingUrl } = await request.json()

    if (!eventId || !meetingUrl) {
      return NextResponse.json(
        { error: "eventId and meetingUrl are required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify event belongs to user
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", session.user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Create Recall bot
    const bot = await createRecallBot(meetingUrl)

    // Create meeting bot record
    const { data: meetingBot, error: botError } = await supabase
      .from("meeting_bots")
      .insert({
        event_id: eventId,
        status: "pending",
        recall_bot_id: bot.id,
      })
      .select()
      .single()

    if (botError || !meetingBot) {
      return NextResponse.json(
        { error: "Failed to create meeting bot" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bot: meetingBot,
    })
  } catch (error: any) {
    console.error("Recall join error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to join meeting" },
      { status: 500 }
    )
  }
}

