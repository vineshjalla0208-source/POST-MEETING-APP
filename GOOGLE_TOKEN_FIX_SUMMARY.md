# Google OAuth Token Storage Fix

## ✅ Issues Fixed

### Problem
Calendar sync was showing "Google account not connected" because tokens were not being saved to the `user_tokens` table correctly.

### Root Causes
1. User must exist in `users` table before saving tokens (foreign key constraint)
2. Token expiration times were being converted incorrectly (seconds vs milliseconds)
3. User ID format needed to match between NextAuth and database

## 📝 Files Fixed

### 1. **lib/supabase/tokens.ts**
- ✅ `saveUserGoogleTokens()` now ensures user exists in `users` table first
- ✅ Provider value is exactly `"google"` (string literal)
- ✅ ON CONFLICT uses `user_id,provider` (matches UNIQUE constraint)
- ✅ Proper error logging with user ID and provider for debugging
- ✅ `isTokenExpired()` correctly handles milliseconds

### 2. **lib/auth.ts**
- ✅ Calls `ensureUserInDatabase()` BEFORE saving tokens
- ✅ Converts `expires_at` from seconds to milliseconds (NextAuth provides seconds)
- ✅ Added console.log for successful token saves
- ✅ Better error handling

### 3. **app/api/calendar/sync/route.ts**
- ✅ Fixed token refresh expiration calculation (milliseconds)
- ✅ Uses `getCurrentUserId()` which returns NextAuth user ID

### 4. **app/api/google/events/route.ts**
- ✅ Fixed token refresh expiration calculation (milliseconds)

### 5. **app/api/google/refresh/route.ts**
- ✅ Fixed token refresh expiration calculation (milliseconds)

### 6. **app/api/google/calendars/route.ts**
- ✅ Fixed token refresh expiration calculation (milliseconds)

## 🔧 Key Changes

### Token Storage Flow:
1. User signs in with Google via NextAuth
2. NextAuth JWT callback:
   - Generates consistent user ID (32-char hash)
   - Ensures user exists in `users` table
   - Saves Google tokens to `user_tokens` table with:
     - `user_id`: NextAuth user ID
     - `provider`: `"google"` (exact string)
     - `access_token`: From NextAuth account
     - `refresh_token`: From NextAuth account
     - `expires_at`: Converted from seconds to milliseconds

### Database Schema:
```sql
user_tokens (
  user_id UUID REFERENCES users(id),
  provider TEXT CHECK (provider IN ('google', 'linkedin', 'facebook')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,  -- milliseconds since epoch
  UNIQUE(user_id, provider)
)
```

### ON CONFLICT Handling:
- Supabase automatically handles ON CONFLICT with `onConflict: 'user_id,provider'`
- Updates: `access_token`, `refresh_token`, `expires_at`
- `updated_at` is auto-updated by trigger

## ✅ Verification

After these fixes:
1. Sign in with Google → Tokens should be saved to `user_tokens` table
2. Click "Sync Calendar" → Should work without "Google account not connected" error
3. Check database:
   ```sql
   SELECT * FROM user_tokens WHERE provider = 'google';
   ```
   Should show:
   - `user_id`: 32-character hash
   - `provider`: `"google"`
   - `access_token`: Valid token
   - `refresh_token`: Valid refresh token
   - `expires_at`: Timestamp in milliseconds

## 🚀 Next Steps

1. **Restart development server:**
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Sign in with Google again** (to save tokens with new logic)

3. **Test calendar sync:**
   - Go to `/calendar`
   - Click "Sync Calendar"
   - Should sync events successfully

The "Google account not connected" error should now be resolved! 🎉

