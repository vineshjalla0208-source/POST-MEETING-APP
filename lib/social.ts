export async function postToLinkedIn(
  accessToken: string,
  text: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // First, get the user's profile
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error("Failed to get LinkedIn profile")
    }

    const profile = await profileResponse.json()

    // Post to LinkedIn
    const postResponse = await fetch(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: `urn:li:person:${profile.sub}`,
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
      }
    )

    if (!postResponse.ok) {
      const error = await postResponse.text()
      throw new Error(`LinkedIn API error: ${error}`)
    }

    const result = await postResponse.json()
    return { success: true, postId: result.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function postToFacebook(
  accessToken: string,
  pageId: string,
  text: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
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
      const error = await response.text()
      throw new Error(`Facebook API error: ${error}`)
    }

    const result = await response.json()
    return { success: true, postId: result.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

