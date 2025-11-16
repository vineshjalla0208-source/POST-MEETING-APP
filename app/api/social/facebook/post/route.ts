import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getValidFacebookToken, postToFacebook } from "@/lib/social/facebook"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, page_id, meetingId, aiPostId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    // Get valid Facebook access token (refresh if needed)
    const accessToken = await getValidFacebookToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: "Facebook not connected or token expired. Please reconnect your Facebook account in Settings.",
          requiresReconnect: true
        },
        { status: 401 }
      )
    }

    // Post to Facebook
    const result = await postToFacebook(accessToken, text, page_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to Facebook" },
        { status: 500 }
      )
    }

    // Save to posted_social_content table
    const supabase = createServerSupabaseClient()
    await supabase
      .from("posted_social_content")
      .insert({
        user_id: session.user.id,
        platform: "facebook",
        content: text,
        post_id: result.postId,
        meeting_id: meetingId || null,
        ai_post_id: aiPostId || null,
      })

    return NextResponse.json({
      success: true,
      postId: result.postId,
      message: "Successfully posted to Facebook",
    })
  } catch (error: any) {
    console.error("Facebook post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post to Facebook" },
      { status: 500 }
    )
  }
}

