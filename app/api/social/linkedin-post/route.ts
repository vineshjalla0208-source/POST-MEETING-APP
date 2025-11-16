import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { postToLinkedIn } from "@/lib/social"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get LinkedIn connection
    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("platform", "linkedin")
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "LinkedIn not connected" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (connection.expires_at && Date.now() >= connection.expires_at) {
      return NextResponse.json(
        { error: "LinkedIn token expired. Please reconnect." },
        { status: 401 }
      )
    }

    // Post to LinkedIn
    const result = await postToLinkedIn(connection.access_token, text)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to LinkedIn" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
    })
  } catch (error: any) {
    console.error("LinkedIn post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post to LinkedIn" },
      { status: 500 }
    )
  }
}

