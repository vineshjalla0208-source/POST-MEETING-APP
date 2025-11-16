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

    const { access_token, refresh_token, expires_at } = await request.json()

    if (!access_token) {
      return NextResponse.json(
        { error: "access_token is required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Save or update LinkedIn tokens
    const { data, error } = await supabase
      .from("social_tokens")
      .upsert(
        {
          user_id: session.user.id,
          provider: "linkedin",
          access_token,
          refresh_token: refresh_token || null,
          expires_at: expires_at || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving LinkedIn tokens:", error)
      return NextResponse.json(
        { error: "Failed to save LinkedIn connection" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token: data,
    })
  } catch (error: any) {
    console.error("LinkedIn connect error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to connect LinkedIn" },
      { status: 500 }
    )
  }
}

