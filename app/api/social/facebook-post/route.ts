import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { postToFacebook } from "@/lib/social"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, pageId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get Facebook connection
    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("platform", "facebook")
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Facebook not connected" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (connection.expires_at && Date.now() >= connection.expires_at) {
      return NextResponse.json(
        { error: "Facebook token expired. Please reconnect." },
        { status: 401 }
      )
    }

    // Use pageId if provided, otherwise use profile_id
    const targetPageId = pageId || connection.profile_id

    if (!targetPageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      )
    }

    // Post to Facebook
    const result = await postToFacebook(connection.access_token, targetPageId, text)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to Facebook" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
    })
  } catch (error: any) {
    console.error("Facebook post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post to Facebook" },
      { status: 500 }
    )
  }
}

