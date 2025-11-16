import { createServerSupabaseClient } from "@/lib/supabase/server"

interface FacebookToken {
  access_token: string
  refresh_token: string | null
  expires_at: number | null
}

/**
 * Get Facebook access token from Supabase
 */
export async function getFacebookToken(userId: string): Promise<FacebookToken | null> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from("social_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "facebook")
    .single()

  if (error || !data) {
    return null
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  }
}

/**
 * Check if Facebook token is expired
 */
export function isFacebookTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false // No expiration set, assume valid
  return Date.now() >= expiresAt
}

/**
 * Refresh Facebook access token
 */
export async function refreshFacebookToken(
  userId: string,
  refreshToken: string | null
): Promise<{ access_token: string; expires_at: number | null } | null> {
  if (!refreshToken) {
    // Facebook may not provide refresh tokens for all grant types
    // User needs to re-authenticate
    return null
  }

  try {
    // Facebook token refresh endpoint
    const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_CLIENT_ID || "",
        client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
        fb_exchange_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error("Facebook token refresh failed:", await response.text())
      return null
    }

    const data = await response.json()
    
    // Update token in Supabase
    const supabase = createServerSupabaseClient()
    const expiresAt = data.expires_in 
      ? Date.now() + (data.expires_in * 1000)
      : null

    await supabase
      .from("social_tokens")
      .update({
        access_token: data.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "facebook")

    return {
      access_token: data.access_token,
      expires_at: expiresAt,
    }
  } catch (error) {
    console.error("Error refreshing Facebook token:", error)
    return null
  }
}

/**
 * Get valid Facebook access token (refresh if needed)
 */
export async function getValidFacebookToken(userId: string): Promise<string | null> {
  const token = await getFacebookToken(userId)
  
  if (!token) {
    return null
  }

  // Check if token is expired
  if (isFacebookTokenExpired(token.expires_at)) {
    // Try to refresh
    const refreshed = await refreshFacebookToken(userId, token.refresh_token)
    if (refreshed) {
      return refreshed.access_token
    }
    // Refresh failed, return null (user needs to re-authenticate)
    return null
  }

  return token.access_token
}

/**
 * Get Facebook user pages (for posting to pages)
 */
export async function getFacebookPages(accessToken: string): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )

    if (!response.ok) {
      console.error("Failed to get Facebook pages:", await response.text())
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error getting Facebook pages:", error)
    return []
  }
}

/**
 * Post content to Facebook
 */
export async function postToFacebook(
  accessToken: string,
  text: string,
  pageId?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Use page_id if provided, otherwise post to user's feed
    const targetId = pageId || "me"

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${targetId}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          access_token: accessToken,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Facebook post error:", errorText)
      
      // Parse error message
      let errorMessage = "Failed to post to Facebook"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.error || errorMessage
      } catch {
        // Use default error message
      }
      
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return { success: true, postId: data.id }
  } catch (error: any) {
    console.error("Error posting to Facebook:", error)
    return { success: false, error: error.message || "Failed to post to Facebook" }
  }
}

