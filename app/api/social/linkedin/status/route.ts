import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("social_tokens")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("provider", "linkedin")
      .single()

    return NextResponse.json({
      connected: !error && !!data,
    })
  } catch (error) {
    return NextResponse.json({ connected: false })
  }
}

