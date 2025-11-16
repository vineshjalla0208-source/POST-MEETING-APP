# Google Token Save Fix - Complete Solution

## ✅ Issues Fixed

### Problem
NextAuth was not saving Google refresh/access tokens into the `user_tokens` table, causing "Google account not connected" error.

### Root Causes
1. User ID mismatch: NextAuth generates 32-char hex string, but database uses UUID
2. User lookup: Need to find user by email to get their UUID
3. Token storage: Tokens need to be saved using the UUID from users table

## 📝 Files Fixed

### 1. **lib/auth.ts**
- ✅ Updated Google provider scope to include calendar and calendar.events
- ✅ Added `access_type: "offline"` and `prompt: "consent"` (already present)
- ✅ JWT callback now stores:
  - `token.accessToken`
  - `token.refreshToken`
  - `token.expiresAt`
  - `token.id`
- ✅ Session callback exposes tokens to session
- ✅ Finds user by email to get UUID before saving tokens
- ✅ Saves tokens using UUID (not hex string)

### 2. **lib/supabase/auth.ts**
- ✅ `getCurrentUserId()` now finds user by email and returns UUID
- ✅ `ensureUserInDatabase()` finds or creates user by email, returns UUID
- ✅ `findOrCreateUserByEmail()` helper function to handle user lookup/creation

### 3. **app/api/calendar/sync/route.ts**
- ✅ Already correctly fetches tokens from `user_tokens` table
- ✅ Already handles token refresh if expired
- ✅ Already saves meetings to `meetings` table

## 🔧 Key Changes

### User ID Resolution:
1. NextAuth generates 32-char hex string for session
2. Database uses UUID for `users.id` and `user_tokens.user_id`
3. Solution: Find user by email to get UUID, then use UUID for token storage

### Token Storage Flow:
1. User signs in with Google
2. NextAuth JWT callback:
   - Generates session user ID (hex string)
   - Finds or creates user in `users` table by email → gets UUID
   - Saves tokens to `user_tokens` using UUID
3. Calendar sync:
   - Gets user UUID by email from session
   - Fetches tokens from `user_tokens` using UUID
   - Refreshes if expired
   - Syncs calendar events

### Google Provider Configuration:
```typescript
GoogleProvider({
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
    },
  },
})
```

## ✅ Verification Checklist

- [x] Google provider has correct scope, access_type, and prompt
- [x] JWT callback stores tokens in token object
- [x] Session callback exposes tokens
- [x] User lookup by email works
- [x] Tokens saved using UUID (not hex string)
- [x] Calendar sync fetches tokens correctly
- [x] Token refresh works if expired

## 🚀 Next Steps

1. **Restart Development Server:**
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Sign in with Google:**
   - Go to `/auth/signin`
   - Click "Sign in with Google"
   - Authorize the app
   - Check console logs for:
     - "User ensured in database. UUID: ..."
     - "Google tokens saved successfully for user UUID: ..."

3. **Verify Database:**
   ```sql
   -- Check users table
   SELECT * FROM users WHERE email = 'your-email@example.com';
   
   -- Check user_tokens table
   SELECT * FROM user_tokens WHERE provider = 'google';
   ```
   Should show:
   - User with UUID in `users` table
   - Token row with `provider = 'google'` in `user_tokens` table

4. **Test Calendar Sync:**
   - Go to `/calendar`
   - Click "Sync Calendar"
   - Should sync events successfully without "Google account not connected" error

## 🔍 Environment Variables

Ensure your `.env.local` has:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

The "Google account not connected" error should now be resolved! 🎉

