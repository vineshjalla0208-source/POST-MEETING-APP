import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getValidLinkedInToken, postToLinkedIn } from "@/lib/social/linkedin"
import { getValidFacebookToken, postToFacebook } from "@/lib/social/facebook"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Unified social media posting endpoint
 * Supports both LinkedIn and Facebook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, platform, page_id, meetingId, aiPostId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    if (!platform || (platform !== "linkedin" && platform !== "facebook")) {
      return NextResponse.json(
        { error: "platform must be 'linkedin' or 'facebook'" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    let result: { success: boolean; postId?: string; error?: string }

    if (platform === "linkedin") {
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
      result = await postToLinkedIn(accessToken, text)
    } else {
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
      result = await postToFacebook(accessToken, text, page_id)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || `Failed to post to ${platform}` },
        { status: 500 }
      )
    }

    // Save to posted_social_content table
    await supabase
      .from("posted_social_content")
      .insert({
        user_id: session.user.id,
        platform: platform,
        content: text,
        post_id: result.postId,
        meeting_id: meetingId || null,
        ai_post_id: aiPostId || null,
      })

    return NextResponse.json({
      success: true,
      postId: result.postId,
      message: `Successfully posted to ${platform === "linkedin" ? "LinkedIn" : "Facebook"}`,
    })
  } catch (error: any) {
    console.error("Social post error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post to social media" },
      { status: 500 }
    )
  }
}

