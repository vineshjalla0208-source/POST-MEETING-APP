import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import FacebookProvider from "next-auth/providers/facebook"
import { ensureUserInDatabase } from "@/lib/supabase/auth"
import { saveAccountTokens, refreshAccountToken } from "@/lib/supabase/accounts"

// Validate NEXTAUTH_URL
const nextAuthUrl = (process.env.NEXTAUTH_URL || "").trim()
if (!nextAuthUrl || nextAuthUrl !== "http://localhost:3000") {
  console.warn(`⚠️  NEXTAUTH_URL is set to "${nextAuthUrl}" but should be "http://localhost:3000" for local development`)
}

// Validate NEXTAUTH_SECRET
const nextAuthSecret = (process.env.NEXTAUTH_SECRET || "").trim()
if (!nextAuthSecret || nextAuthSecret.length < 32) {
  console.error("❌ NEXTAUTH_SECRET is missing or too short (minimum 32 characters required)")
  console.error("   Current length:", nextAuthSecret.length)
  console.error("   Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"")
  throw new Error("NEXTAUTH_SECRET must be at least 32 characters")
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    LinkedInProvider({
      clientId: (process.env.LINKEDIN_CLIENT_ID || "").trim(),
      clientSecret: (process.env.LINKEDIN_CLIENT_SECRET || "").trim(),
      authorization: {
        params: {
          scope: "openid profile email w_member_social",
        },
      },
    }),
    FacebookProvider({
      clientId: (process.env.FACEBOOK_CLIENT_ID || "").trim(),
      clientSecret: (process.env.FACEBOOK_CLIENT_SECRET || "").trim(),
      authorization: {
        params: {
          scope: "email public_profile pages_manage_posts pages_read_engagement",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure user exists in database before proceeding
      if (user.email) {
        try {
          const userUuid = await ensureUserInDatabase(
            '',
            user.email,
            user.name || undefined,
            user.image || undefined
          )
          console.log("✅ signIn callback - User ensured in database. UUID:", userUuid, "Email:", user.email)
          return true
        } catch (error) {
          console.error("❌ Error ensuring user in database during sign in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      // On first sign in, user and account objects are available
      if (user && account) {
        console.log("🔐 JWT Callback - First sign in:", {
          provider: account.provider,
          email: user.email,
          providerAccountId: account.providerAccountId,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          expiresAt: account.expires_at,
        })

        // Ensure user exists in database and get UUID
        let userUuid: string
        try {
          userUuid = await ensureUserInDatabase(
            '',
            user.email || "",
            user.name || undefined,
            user.image || undefined
          )
          console.log("✅ User ensured in database. UUID:", userUuid, "Email:", user.email)
        } catch (error) {
          console.error("❌ Error ensuring user in database:", error)
          throw error
        }

        // Store UUID in token (this will be used as session.user.id)
        token.sub = userUuid
        token.id = userUuid
        token.userId = userUuid
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId

        // Store tokens in token object (for session access and debugging)
        if (account.access_token) {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token || null
          token.idToken = account.id_token || null
          token.expiresAt = account.expires_at ? account.expires_at * 1000 : null
          token.tokenType = account.token_type || null
          token.scope = account.scope || null
        }

        // Save account tokens to Supabase accounts table
        if (account.access_token && userUuid && account.providerAccountId) {
          try {
            await saveAccountTokens({
              userId: userUuid,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token || null,
              expiresAt: account.expires_at ? account.expires_at * 1000 : null,
              tokenType: account.token_type || null,
              scope: account.scope || null,
              idToken: account.id_token || null,
            })
            console.log("✅ Account tokens saved successfully to accounts table")
            console.log("   User UUID:", userUuid)
            console.log("   Provider:", account.provider)
            console.log("   Provider Account ID:", account.providerAccountId)
          } catch (error: any) {
            console.error("❌ Error saving account tokens to database:", error)
            console.error("   Error details:", error.message)
            // Don't throw - allow login to continue even if token save fails
            // The token is still in the JWT, so we can retry later
          }
        } else {
          console.warn("⚠️  Missing required fields for token save:", {
            hasAccessToken: !!account.access_token,
            hasUserId: !!userUuid,
            hasProviderAccountId: !!account.providerAccountId,
          })
        }
      } else if (token.expiresAt && typeof token.expiresAt === 'number' && Date.now() >= token.expiresAt) {
        // Token expired, try to refresh
        if (token.refreshToken && token.provider === 'google' && token.userId) {
          console.log("🔄 Token expired, attempting refresh...")
          try {
            const refreshed = await refreshAccountToken(
              token.userId as string,
              token.provider as string,
              token.refreshToken as string
            )
            if (refreshed) {
              token.accessToken = refreshed.access_token
              token.expiresAt = refreshed.expires_at
              console.log("✅ Token refreshed successfully")
            }
          } catch (error) {
            console.error("❌ Error refreshing token:", error)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      // Set session.user.id from token.id (which is the UUID from database)
      if (token.id) {
        (session.user as any).id = token.id
      } else if (token.sub) {
        (session.user as any).id = token.sub
      } else if (token.userId) {
        (session.user as any).id = token.userId
      } else {
        console.warn("⚠️  No user ID found in token")
      }
      
      // Expose tokens to session (for debugging, but tokens should be read from database)
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken
      }
      if (token.refreshToken) {
        (session as any).refreshToken = token.refreshToken
      }
      if (token.idToken) {
        (session as any).idToken = token.idToken
      }
      if (token.expiresAt) {
        (session as any).expiresAt = token.expiresAt
      }
      if (token.provider) {
        (session as any).provider = token.provider
      }
      if (token.providerAccountId) {
        (session as any).providerAccountId = token.providerAccountId
      }
      
      console.log("📋 Session callback - User ID:", (session.user as any).id, "Email:", session.user.email)
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // If url is a relative path, resolve it against baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url
      // Otherwise, redirect to baseUrl
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === "development",
}
