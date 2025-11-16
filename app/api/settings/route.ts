import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bot_join_minutes_before } = await request.json()

    if (bot_join_minutes_before === undefined) {
      return NextResponse.json(
        { error: "bot_join_minutes_before is required" },
        { status: 400 }
      )
    }

    if (bot_join_minutes_before < 0 || bot_join_minutes_before > 60) {
      return NextResponse.json(
        { error: "bot_join_minutes_before must be between 0 and 60" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Upsert user settings
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: session.user.id,
          bot_join_minutes_before: bot_join_minutes_before,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data,
    })
  } catch (error: any) {
    console.error("Settings save error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    )
  }
}

