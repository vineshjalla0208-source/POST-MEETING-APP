# Complete Authentication & Token Storage Fix

## 🔍 What Was Wrong

### Root Causes:

1. **Wrong Table Schema**: The code was using `user_tokens` table, but NextAuth expects an `accounts` table with a specific schema matching NextAuth's adapter format.

2. **Missing Accounts Table**: The `accounts` table didn't exist in the database, so tokens were never being saved properly.

3. **Token Storage Mismatch**: The token saving logic was trying to save to `user_tokens` but the calendar sync was looking for tokens in a different format.

4. **Missing NEXTAUTH_SECRET**: The secret might have been missing or too short, causing session issues.

5. **No Token Refresh Logic**: When tokens expired, there was no automatic refresh mechanism.

---

## ✅ Complete Fix Applied

### 1. Database Schema Fix

**Created:** `supabase/migrations/007_fix_accounts_table.sql`

- Drops the old `user_tokens` table
- Creates new `accounts` table matching NextAuth schema:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to users)
  - `provider` (text, NOT NULL)
  - `provider_account_id` (text, NOT NULL)
  - `refresh_token` (text, nullable)
  - `access_token` (text, nullable)
  - `expires_at` (bigint, nullable)
  - `token_type` (text, nullable)
  - `scope` (text, nullable)
  - `id_token` (text, nullable)
  - `created_at`, `updated_at` (timestamps)
  - Unique constraint: `(provider, provider_account_id)`

### 2. NextAuth Configuration Fix

**Updated:** `lib/auth.ts`

- Added `signIn` callback to ensure user exists in database
- Updated `jwt` callback to:
  - Save tokens to `accounts` table (not `user_tokens`)
  - Store all token fields (access_token, refresh_token, expires_at, token_type, scope, id_token)
  - Implement automatic token refresh when expired
- Updated `session` callback to expose tokens for debugging

### 3. Token Management Functions

**Created:** `lib/supabase/accounts.ts`

New functions:
- `saveAccountTokens()` - Saves tokens to `accounts` table
- `getAccountTokens()` - Retrieves tokens from `accounts` table
- `updateAccountAccessToken()` - Updates access token after refresh
- `refreshAccountToken()` - Refreshes expired tokens and saves back to database
- `isTokenExpired()` - Checks if token is expired

### 4. Calendar Sync API Fix

**Updated:** `app/api/calendar/sync/route.ts`

- Now reads tokens from `accounts` table (not `user_tokens`)
- Proper error handling for missing tokens
- Automatic token refresh when expired
- Better logging for debugging

### 5. Frontend Sync Button Fix

**Updated:** `components/sync-google-calendar-button.tsx`

- Changed endpoint from `/api/google/events` to `/api/calendar/sync`
- Changed method from GET to POST
- Better error messages

---

## 📋 Step-by-Step Setup

### Step 1: Update Environment Variables

Create or update `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
NEXTAUTH_SECRET=cR07bDZr5wRyybW4Nh0k9V3KWLToU6F0Od9OBWPIUgs=

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
```

**Important:** Replace `NEXTAUTH_SECRET` with the generated value or create your own:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Run Database Migration

Apply the new migration to create the `accounts` table:

```bash
# If using Supabase CLI
supabase migration up

# Or run the SQL directly in Supabase Dashboard
# Copy contents of: supabase/migrations/007_fix_accounts_table.sql
```

### Step 3: Verify Google OAuth Settings

In Google Cloud Console → APIs & Services → Credentials:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

### Step 4: Restart Development Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 5: Clear Browser Cookies

Clear all cookies for `localhost:3000` to start fresh.

### Step 6: Test the Flow

1. **Sign in with Google:**
   - Go to `http://localhost:3000/auth/signin`
   - Click "Sign in with Google"
   - Complete OAuth flow

2. **Verify Session:**
   - Check `http://localhost:3000/api/auth/session`
   - Should return user object with `id` field

3. **Verify Tokens Saved:**
   - Check Supabase Dashboard → `accounts` table
   - Should see a row with `provider='google'` and tokens populated

4. **Test Calendar Sync:**
   - Go to `/meetings` page
   - Click "Sync Google Calendar"
   - Should sync successfully without errors

---

## 🔄 How It Works Now

### Authentication Flow:

1. **User signs in with Google:**
   - NextAuth `signIn` callback ensures user exists in `users` table
   - NextAuth `jwt` callback receives OAuth tokens
   - `saveAccountTokens()` saves tokens to `accounts` table
   - Session is created with user ID

2. **User clicks "Sync Calendar":**
   - API route gets session using `getServerSession()`
   - `getAccountTokens()` retrieves tokens from `accounts` table
   - If token expired, `refreshAccountToken()` refreshes it
   - `fetchGoogleCalendarEvents()` calls Google Calendar API
   - Events are saved to `meetings` table

3. **Token Refresh:**
   - When token expires, `refreshAccountToken()` is called automatically
   - New access token is fetched from Google
   - Updated token is saved back to `accounts` table
   - Calendar sync continues with new token

---

## 🐛 Troubleshooting

### Issue: "Google account not connected"

**Check:**
1. Visit `/api/debug/session` to see current state
2. Check Supabase `accounts` table for your user
3. Verify `provider='google'` row exists

**Fix:**
- Sign out and sign in again
- Check terminal logs for token saving errors
- Verify Google OAuth settings in Google Console

### Issue: "NEXTAUTH_SECRET is missing or too short"

**Fix:**
- Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Add to `.env.local`: `NEXTAUTH_SECRET=your-generated-secret`
- Restart server

### Issue: Session is null after login

**Check:**
1. `NEXTAUTH_URL` is exactly `http://localhost:3000` (no trailing slash)
2. `NEXTAUTH_SECRET` is 32+ characters
3. Browser cookies are enabled

**Fix:**
- Clear cookies and restart server
- Verify environment variables are loaded correctly

### Issue: Token refresh fails

**Check:**
1. `refresh_token` exists in `accounts` table
2. Token hasn't been revoked in Google Console

**Fix:**
- Sign out and sign in again to get new refresh token
- Check Google OAuth consent screen settings

---

## 📊 Database Schema

### accounts table:
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(provider, provider_account_id)
);
```

### users table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## ✅ Success Indicators

When everything works:

1. ✅ `/api/auth/session` returns user with `id` field
2. ✅ Supabase `accounts` table has row with `provider='google'`
3. ✅ `accounts` table has `access_token` and `refresh_token` populated
4. ✅ Calendar sync button works without errors
5. ✅ Meetings appear in `/meetings` page
6. ✅ Terminal shows success logs for token saving

---

## 📝 Files Changed

1. ✅ `supabase/migrations/007_fix_accounts_table.sql` - New migration
2. ✅ `lib/auth.ts` - Updated NextAuth config
3. ✅ `lib/supabase/accounts.ts` - New token management functions
4. ✅ `app/api/calendar/sync/route.ts` - Updated to use accounts table
5. ✅ `components/sync-google-calendar-button.tsx` - Updated endpoint

---

## 🎯 Final Checklist

Before testing:

- [ ] `.env.local` has all required variables
- [ ] `NEXTAUTH_SECRET` is 32+ characters
- [ ] `NEXTAUTH_URL` is exactly `http://localhost:3000`
- [ ] Database migration `007_fix_accounts_table.sql` is applied
- [ ] `accounts` table exists in Supabase
- [ ] Google OAuth redirect URI matches in Google Console
- [ ] Server is restarted
- [ ] Browser cookies are cleared

---

**Last Updated:** 2024-01-XX  
**Version:** 2.0.0 - Complete Authentication Fix

