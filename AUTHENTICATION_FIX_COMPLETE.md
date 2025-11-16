# Complete Authentication & Google Calendar Sync Fix

## ✅ All Issues Fixed

This document provides a complete solution for fixing NextAuth session issues and Google Calendar sync.

---

## PART 1: Environment Variables

### Required `.env.local` Variables

Create or update your `.env.local` file in the project root with these variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-minimum-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Optional: LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Optional: Facebook OAuth
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Optional: Recall.ai
RECALL_API_KEY=
RECALL_BASE_URL=https://api.recall.ai/v1

# Optional: OpenAI
OPENAI_API_KEY=
```

### Generate NEXTAUTH_SECRET

If you need to generate a secure `NEXTAUTH_SECRET`, run:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## PART 2: Google OAuth Console Configuration

### Authorized JavaScript Origins

In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID:

Add:
```
http://localhost:3000
```

### Authorized Redirect URIs

Add:
```
http://localhost:3000/api/auth/callback/google
```

**Important:** Make sure there are no trailing slashes or extra spaces.

---

## PART 3: NextAuth Configuration

### Key Changes Made

1. **JWT Callback** - Properly stores:
   - `token.id` = Database UUID (from `users` table)
   - `token.sub` = Database UUID
   - `token.accessToken` = Google access token
   - `token.refreshToken` = Google refresh token
   - `token.idToken` = Google ID token
   - `token.expiresAt` = Token expiration (milliseconds)

2. **Session Callback** - Properly exposes:
   - `session.user.id` = Database UUID
   - `session.accessToken` = Google access token (for debugging)
   - `session.refreshToken` = Google refresh token (for debugging)
   - `session.provider` = OAuth provider name
   - `session.providerAccountId` = Provider account ID

3. **Token Saving** - Automatically saves to:
   - `user_tokens` table in Supabase
   - Uses `user_id` (UUID) and `provider` ('google')

4. **Debug Mode** - Enabled in development for better logging

### Console Logs Added

The following logs will appear in your terminal:

- `🔐 JWT Callback - First sign in` - When user signs in
- `✅ User ensured in database` - When user is created/found
- `✅ Google tokens saved successfully` - When tokens are saved
- `📋 Session callback - User ID` - When session is created
- `🔄 Calendar sync request received` - When sync starts
- `✅ User authenticated` - When user is verified
- `🔑 Token check` - When checking for tokens
- `📅 Fetching Google Calendar events` - When fetching events

---

## PART 4: Google Calendar Sync API

### Fixed Issues

1. **Session Reading** - Now uses `getServerSession(authOptions)` directly
2. **User ID** - Uses `session.user.id` (UUID) from database
3. **Token Reading** - Reads from `user_tokens` table (not `accounts` table)
4. **Error Handling** - Proper error messages for each failure point
5. **Token Refresh** - Automatically refreshes expired tokens

### API Route: `/api/calendar/sync`

**Method:** `POST`

**Authentication:** Requires NextAuth session

**Response:**
```json
{
  "success": true,
  "synced": 10,
  "total": 10,
  "errors": []
}
```

**Error Responses:**
- `401` - Unauthorized (no session)
- `400` - Google account not connected (no tokens in database)
- `500` - Server error

---

## PART 5: Debugging Tools

### Debug Route: `/api/debug/session`

**Method:** `GET`

**Response:**
```json
{
  "session": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "User Name"
    },
    "accessToken": "***REDACTED***",
    "refreshToken": "***REDACTED***",
    "provider": "google",
    "providerAccountId": "123456789"
  },
  "jwt": {
    "sub": "uuid-here",
    "id": "uuid-here",
    "email": "user@example.com",
    "hasAccessToken": true,
    "hasRefreshToken": true
  },
  "database": {
    "user": { ... },
    "account": null,
    "userTokens": {
      "user_id": "uuid-here",
      "provider": "google",
      "access_token": "***REDACTED***",
      "refresh_token": "***REDACTED***"
    }
  },
  "env": {
    "hasNextAuthUrl": true,
    "hasNextAuthSecret": true,
    "nextAuthUrl": "http://localhost:3000",
    "hasGoogleClientId": true,
    "hasGoogleClientSecret": true
  }
}
```

**Usage:**
1. Sign in with Google
2. Visit `http://localhost:3000/api/debug/session`
3. Check the response to see:
   - If session exists
   - If JWT token exists
   - If tokens are in database
   - If environment variables are set

---

## PART 6: Testing Instructions

### Step 1: Clear Everything

```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear browser cookies
# In Chrome: DevTools → Application → Cookies → Delete all for localhost:3000
```

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Test Authentication Flow

1. **Navigate to sign-in page:**
   ```
   http://localhost:3000/auth/signin
   ```

2. **Click "Sign in with Google"**

3. **Complete Google OAuth:**
   - Select Google account
   - Click "Continue" on unverified app screen
   - Should redirect back to app

4. **Check session:**
   ```
   http://localhost:3000/api/auth/session
   ```
   Should return:
   ```json
   {
     "user": {
       "id": "uuid-here",
       "email": "your-email@gmail.com",
       "name": "Your Name"
     }
   }
   ```

5. **Check debug route:**
   ```
   http://localhost:3000/api/debug/session
   ```
   Should show:
   - `session` is not null
   - `jwt` is not null
   - `database.userTokens` is not null

6. **Test Calendar Sync:**
   - Navigate to `/calendar` or `/meetings`
   - Click "Sync Calendar" button
   - Should see success message
   - Check terminal for logs

---

## PART 7: Troubleshooting

### Issue: Session is null after login

**Check:**
1. `NEXTAUTH_SECRET` is set and at least 32 characters
2. `NEXTAUTH_URL` is exactly `http://localhost:3000` (no trailing slash)
3. Browser cookies are enabled
4. Check `/api/debug/session` for detailed info

**Fix:**
- Regenerate `NEXTAUTH_SECRET`
- Clear browser cookies
- Restart server

### Issue: "Google account not connected"

**Check:**
1. Visit `/api/debug/session`
2. Check if `database.userTokens` is null
3. Check terminal logs for token saving errors

**Fix:**
- Sign out and sign in again
- Check Supabase `user_tokens` table manually
- Verify `user_id` matches `session.user.id`

### Issue: "Unauthorized" error

**Check:**
1. Session exists: `/api/auth/session`
2. `session.user.id` is not null
3. User exists in `users` table

**Fix:**
- Clear cookies and sign in again
- Check middleware is not blocking API routes

### Issue: Token refresh fails

**Check:**
1. `refresh_token` exists in `user_tokens` table
2. Token is not revoked in Google Console

**Fix:**
- Sign out and sign in again to get new refresh token
- Check Google OAuth consent screen settings

---

## PART 8: Database Schema

### Required Tables

1. **users** - User accounts
   - `id` (UUID, primary key)
   - `email` (unique)
   - `name`, `image`

2. **user_tokens** - OAuth tokens
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to users)
   - `provider` ('google', 'linkedin', 'facebook')
   - `access_token` (text)
   - `refresh_token` (text, nullable)
   - `expires_at` (bigint, milliseconds)
   - Unique constraint: `(user_id, provider)`

### Migration Files

All migrations are in `supabase/migrations/`:
- `001_initial_schema.sql` - Creates `users` table
- `002_google_calendar_sync.sql` - Creates `user_tokens` and `meetings` tables

---

## PART 9: File Structure

```
/app/api/auth/[...nextauth]/route.ts    # NextAuth handler
/app/api/calendar/sync/route.ts          # Calendar sync API
/app/api/debug/session/route.ts          # Debug route
/lib/auth.ts                             # NextAuth configuration
/lib/supabase/tokens.ts                  # Token management
/lib/supabase/auth.ts                    # User management
```

---

## PART 10: Final Checklist

Before testing, ensure:

- [ ] `.env.local` has all required variables
- [ ] `NEXTAUTH_SECRET` is at least 32 characters
- [ ] `NEXTAUTH_URL` is exactly `http://localhost:3000`
- [ ] Google OAuth redirect URI matches in Google Console
- [ ] Supabase migrations are applied
- [ ] `users` table exists
- [ ] `user_tokens` table exists
- [ ] Server is restarted
- [ ] Browser cookies are cleared

---

## Success Indicators

When everything works correctly:

1. ✅ `/api/auth/session` returns user object with `id`
2. ✅ `/api/debug/session` shows all data populated
3. ✅ Terminal shows successful token saving logs
4. ✅ Calendar sync button works without errors
5. ✅ Meetings appear in `/meetings` page
6. ✅ No "Unauthorized" or "Google account not connected" errors

---

## Support

If issues persist:

1. Check terminal logs for error messages
2. Visit `/api/debug/session` to see current state
3. Check Supabase dashboard for data in tables
4. Verify Google OAuth settings in Google Cloud Console
5. Clear all cookies and try again

---

**Last Updated:** 2024-01-XX
**Version:** 1.0.0

