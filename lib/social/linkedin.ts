import { createServerSupabaseClient } from "@/lib/supabase/server"

interface LinkedInToken {
  access_token: string
  refresh_token: string | null
  expires_at: number | null
}

/**
 * Get LinkedIn access token from Supabase
 */
export async function getLinkedInToken(userId: string): Promise<LinkedInToken | null> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from("social_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "linkedin")
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
 * Check if LinkedIn token is expired
 */
export function isLinkedInTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false // No expiration set, assume valid
  return Date.now() >= expiresAt
}

/**
 * Refresh LinkedIn access token
 * Note: LinkedIn OAuth 2.0 doesn't provide refresh tokens in the same way as Google.
 * Users may need to re-authenticate. This function attempts to refresh if possible.
 */
export async function refreshLinkedInToken(
  userId: string,
  refreshToken: string | null
): Promise<{ access_token: string; expires_at: number | null } | null> {
  if (!refreshToken) {
    // LinkedIn doesn't always provide refresh tokens
    // User needs to re-authenticate
    return null
  }

  try {
    // LinkedIn token refresh endpoint
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    })

    if (!response.ok) {
      console.error("LinkedIn token refresh failed:", await response.text())
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
      .eq("provider", "linkedin")

    return {
      access_token: data.access_token,
      expires_at: expiresAt,
    }
  } catch (error) {
    console.error("Error refreshing LinkedIn token:", error)
    return null
  }
}

/**
 * Get valid LinkedIn access token (refresh if needed)
 */
export async function getValidLinkedInToken(userId: string): Promise<string | null> {
  const token = await getLinkedInToken(userId)
  
  if (!token) {
    return null
  }

  // Check if token is expired
  if (isLinkedInTokenExpired(token.expires_at)) {
    // Try to refresh
    const refreshed = await refreshLinkedInToken(userId, token.refresh_token)
    if (refreshed) {
      return refreshed.access_token
    }
    // Refresh failed, return null (user needs to re-authenticate)
    return null
  }

  return token.access_token
}

/**
 * Get LinkedIn user profile ID (person URN)
 */
export async function getLinkedInProfileId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Failed to get LinkedIn profile:", await response.text())
      return null
    }

    const profile = await response.json()
    // LinkedIn returns id in format like "abc123" or URN format
    // We need to extract the ID part
    const id = profile.id || profile.sub
    return id
  } catch (error) {
    console.error("Error getting LinkedIn profile:", error)
    return null
  }
}

/**
 * Post content to LinkedIn
 */
export async function postToLinkedIn(
  accessToken: string,
  text: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Get user's profile ID
    const profileId = await getLinkedInProfileId(accessToken)
    if (!profileId) {
      return { success: false, error: "Failed to get LinkedIn profile" }
    }

    // LinkedIn UGC API requires person URN format
    const personUrn = profileId.startsWith("urn:li:person:") 
      ? profileId 
      : `urn:li:person:${profileId}`

    // Post to LinkedIn using UGC API
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("LinkedIn post error:", errorText)
      
      // Parse error message
      let errorMessage = "Failed to post to LinkedIn"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Use default error message
      }
      
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return { success: true, postId: data.id }
  } catch (error: any) {
    console.error("Error posting to LinkedIn:", error)
    return { success: false, error: error.message || "Failed to post to LinkedIn" }
  }
}

