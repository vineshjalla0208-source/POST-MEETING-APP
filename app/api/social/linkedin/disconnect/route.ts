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

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("social_tokens")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "linkedin")

    if (error) {
      return NextResponse.json(
        { error: "Failed to disconnect LinkedIn" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "LinkedIn disconnected successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disconnect LinkedIn" },
      { status: 500 }
    )
  }
}

