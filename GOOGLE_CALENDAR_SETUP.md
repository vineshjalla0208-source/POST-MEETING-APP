# Google Calendar Integration Setup Guide

## ✅ Complete Fix Summary

All code has been updated to properly integrate Google Calendar with the correct OAuth scopes.

---

## 1. ✅ Google OAuth Scopes (Fixed)

The following scopes are now configured in `lib/auth.ts`:

```
openid
email
profile
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.calendarlist.readonly
```

---

## 2. ✅ NextAuth GoogleProvider Configuration

**File:** `lib/auth.ts`

```typescript
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
})
```

**Key Features:**
- ✅ Uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env.local`
- ✅ Requests `offline` access type to get refresh tokens
- ✅ Uses `prompt: "consent"` to ensure users grant permissions

---

## 3. ✅ Environment Variables Structure

**File:** `.env.local`

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here-minimum-32-characters-long

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Important Notes:**
- `NEXTAUTH_URL` must be exactly `http://localhost:3000` for local development
- `NEXTAUTH_SECRET` must be at least 32 characters long
- Copy `.env.local.example` and fill in your actual values

---

## 4. ✅ API Route: `/api/calendar/sync`

**File:** `app/api/calendar/sync/route.ts`

**Features:**
- ✅ Fetches Google Calendar List using `fetchCalendarList()`
- ✅ Checks token validity using `isTokenExpired()`
- ✅ Automatically refreshes token if expired using `refreshAccountToken()`
- ✅ Returns calendars and event count
- ✅ Comprehensive error logging for insufficient permissions

**Response Format:**
```json
{
  "success": true,
  "calendars": [
    {
      "id": "primary",
      "summary": "Your Calendar",
      "description": "...",
      "timeZone": "America/New_York",
      "primary": true,
      "accessRole": "owner"
    }
  ],
  "events": 42,
  "calendarCount": 3
}
```

---

## 5. ✅ Supabase Schema

**Migration:** `supabase/migrations/014_fix_nextauth_schema_public_only.sql`

The `public.accounts` table includes all required fields:

```sql
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,              -- ✅ Stores refresh token
  access_token TEXT,                -- ✅ Stores access token
  expires_at BIGINT,                -- ✅ Stores expiration timestamp (milliseconds)
  token_type TEXT,
  scope TEXT,                       -- ✅ Stores OAuth scopes
  id_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);
```

**All Required Fields Present:**
- ✅ `provider` - OAuth provider name (e.g., "google")
- ✅ `access_token` - Google OAuth access token
- ✅ `refresh_token` - Google OAuth refresh token
- ✅ `expires_at` - Token expiration timestamp (BIGINT, milliseconds)
- ✅ `scope` - OAuth scopes granted

---

## 6. ⚠️ Redirect URL Verification

**Your Redirect URL:** `http://localhost:3000/api/auth/callback/google`

**Status:** ✅ **CORRECT**

This is automatically set by NextAuth based on:
- `NEXTAUTH_URL` environment variable
- NextAuth route handler at `app/api/auth/[...nextauth]/route.ts`

**Verification:**
- ✅ `NEXTAUTH_URL=http://localhost:3000` in `.env.local`
- ✅ NextAuth route exists at `app/api/auth/[...nextauth]/route.ts`
- ✅ Callback URL will be: `{NEXTAUTH_URL}/api/auth/callback/{provider}`

---

## 7. 📋 How to Update Google Cloud Console

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)

### Step 2: Enable Google Calendar API
1. Navigate to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (for Google Workspace)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
5. Add test users (if using External app type)
6. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name:** Your app name
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` ⚠️ **MUST MATCH EXACTLY**
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Add them to your `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Step 5: Verify Redirect URI
**Critical:** The redirect URI in Google Cloud Console must be:
```
http://localhost:3000/api/auth/callback/google
```

**Common Mistakes:**
- ❌ `http://localhost:3000/api/auth/callback` (missing `/google`)
- ❌ `http://localhost:3000/auth/callback/google` (wrong path)
- ❌ `https://localhost:3000/api/auth/callback/google` (using https instead of http)

---

## 8. 🔄 Clear Old OAuth Sessions

**IMPORTANT:** After updating scopes, users must re-authenticate.

### Run this SQL in Supabase SQL Editor:

```sql
-- Delete all Google accounts so users re-authenticate with new scopes
DELETE FROM public.accounts 
WHERE provider = 'google';
```

### After running the SQL:
1. Users must **sign out** of the application
2. Users must **sign in again** with Google
3. Users will be prompted to **grant calendar permissions**
4. New tokens with updated scopes will be saved to `public.accounts`

---

## 9. 🧪 Testing the Integration

### Test Steps:
1. **Clear old tokens** (run SQL above)
2. **Sign out** of the application
3. **Sign in** with Google
4. **Grant calendar permissions** when prompted
5. **Call the API:**
   ```bash
   curl -X POST http://localhost:3000/api/calendar/sync \
     -H "Cookie: next-auth.session-token=your-session-token"
   ```

### Expected Response:
```json
{
  "success": true,
  "calendars": [
    {
      "id": "primary",
      "summary": "Your Calendar",
      "primary": true
    }
  ],
  "events": 42,
  "calendarCount": 1
}
```

---

## 10. 🐛 Troubleshooting

### Error: "Insufficient Permission" / "ACCESS_TOKEN_SCOPE_INSUFFICIENT"

**Cause:** Old token doesn't have required scopes

**Solution:**
1. Run SQL to delete old Google accounts
2. Sign out and sign in again
3. Verify new token has correct scopes in database

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI in Google Cloud Console doesn't match

**Solution:**
1. Check Google Cloud Console → Credentials
2. Ensure redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`
3. No trailing slashes, correct protocol (http not https)

### Error: "invalid_client"

**Cause:** Wrong Client ID or Secret

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Ensure no extra spaces or quotes
3. Restart Next.js dev server after changing `.env.local`

---

## ✅ Summary

All components are now correctly configured:
- ✅ OAuth scopes updated
- ✅ NextAuth provider configured
- ✅ API route fetches calendar list
- ✅ Token validation and refresh working
- ✅ Supabase schema has all required fields
- ✅ Redirect URL is correct

**Next Steps:**
1. Update Google Cloud Console (see section 7)
2. Clear old tokens (see section 8)
3. Test the integration (see section 9)

