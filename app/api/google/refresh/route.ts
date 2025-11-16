import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserGoogleTokens, updateUserGoogleAccessToken } from "@/lib/supabase/tokens"
import { refreshGoogleAccessToken } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userTokens = await getUserGoogleTokens(session.user.id)
    if (!userTokens || !userTokens.refresh_token) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 400 }
      )
    }

    // Refresh the access token
    const newTokens = await refreshGoogleAccessToken(userTokens.refresh_token)
    // expires_in is in seconds, convert to milliseconds for storage
    const expiresAt = Date.now() + (newTokens.expires_in * 1000)

    // Update in database
    await updateUserGoogleAccessToken(
      session.user.id,
      newTokens.access_token,
      expiresAt
    )

    return NextResponse.json({
      success: true,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
    })
  } catch (error: any) {
    console.error("Error refreshing Google token:", error)
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    )
  }
}

