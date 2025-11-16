import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getValidLinkedInToken, postToLinkedIn } from "@/lib/social/linkedin"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, meetingId, aiPostId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    // Get valid LinkedIn access token (refresh if needed)
    const accessToken = await getValidLinkedInToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: "LinkedIn not connected or token expired. Please reconnect your LinkedIn account in Settings.",
          requiresReconnect: true
        },
        { status: 401 }
      )
    }

    // Post to LinkedIn
    const result = await postToLinkedIn(accessToken, text)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to LinkedIn" },
        { status: 500 }
      )
    }

    // Save to posted_social_content table
    const supabase = createServerSupabaseClient()
    await supabase
      .from("posted_social_content")
      .insert({
        user_id: session.user.id,
        platform: "linkedin",
        content: text,
        post_id: result.postId,
        meeting_id: meetingId || null,
        ai_post_id: aiPostId || null,
      })

    return NextResponse.json({
      success: true,
      postId: result.postId,
      message: "Successfully posted to LinkedIn",
    })
  } catch (error: any) {
    console.error("LinkedIn post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post to LinkedIn" },
      { status: 500 }
    )
  }
}

