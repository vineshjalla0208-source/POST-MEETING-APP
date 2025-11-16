import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meeting_id, enabled } = await request.json()

    if (!meeting_id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: "meeting_id and enabled (boolean) are required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('id, user_id')
      .eq('id', meeting_id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update({ notetaker_enabled: enabled })
      .eq('id', meeting_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update meeting" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    })
  } catch (error: any) {
    console.error("Error toggling Recall bot:", error)
    return NextResponse.json(
      { error: error.message || "Failed to toggle Recall bot" },
      { status: 500 }
    )
  }
}

