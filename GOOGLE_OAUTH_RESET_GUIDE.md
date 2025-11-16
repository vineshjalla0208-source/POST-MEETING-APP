# Complete Google OAuth Token Reset Guide

This guide will help you fully reset your Google OAuth tokens, fix scopes, validate your OAuth client ID, ensure the redirect URI is correct, and reset Supabase tables properly.

---

## 🔍 Step 1: Validate Current Configuration

First, let's validate your OAuth configuration:

```bash
node scripts/validate-google-oauth.js
```

This will check:
- ✅ All required environment variables are present
- ✅ NEXTAUTH_URL is correct
- ✅ NEXTAUTH_SECRET is long enough
- ✅ GOOGLE_CLIENT_ID format is correct
- ✅ GOOGLE_CLIENT_SECRET is present
- ✅ Redirect URI is calculated correctly

**Expected Output:**
```
✅ All validations passed!
📍 Redirect URI: http://localhost:3000/api/auth/callback/google
```

---

## 🗄️ Step 2: Reset Supabase Tables

### Run this SQL in Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste this SQL:

```sql
-- Complete Google OAuth Token Reset
-- This deletes all Google OAuth accounts to force re-authentication

-- Delete all Google accounts
DELETE FROM public.accounts 
WHERE provider = 'google';

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining_google_accounts 
FROM public.accounts 
WHERE provider = 'google';
```

5. Click **Run** or press `Ctrl+Enter`
6. Verify the count returns `0`

**Expected Result:**
```
remaining_google_accounts: 0
```

---

## 🔧 Step 3: Verify OAuth Scopes in Code

The scopes are already configured in `lib/auth.ts`. Verify they match:

**File:** `lib/auth.ts` (lines 25-35)

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

**Required Scopes:**
- ✅ `openid`
- ✅ `email`
- ✅ `profile`
- ✅ `https://www.googleapis.com/auth/calendar`
- ✅ `https://www.googleapis.com/auth/calendar.events`
- ✅ `https://www.googleapis.com/auth/calendar.readonly`
- ✅ `https://www.googleapis.com/auth/calendar.events.readonly`
- ✅ `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

---

## 🌐 Step 4: Verify Redirect URI Configuration

### Your Redirect URI Must Be:
```
http://localhost:3000/api/auth/callback/google
```

### How to Verify:

1. **Check your `.env.local`:**
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Calculate redirect URI:**
   ```
   {NEXTAUTH_URL}/api/auth/callback/google
   = http://localhost:3000/api/auth/callback/google
   ```

3. **Verify in Google Cloud Console** (see Step 5)

---

## 🔐 Step 5: Update Google Cloud Console

### 5.1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project

### 5.2: Enable Google Calendar API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click **Enable** (if not already enabled)

### 5.3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (for Google Workspace)
3. Fill in required fields:
   - **App name:** Your app name
   - **User support email:** Your email
   - **Developer contact email:** Your email
4. Click **Save and Continue**

### 5.4: Add Required Scopes

1. In **OAuth consent screen**, go to **Scopes** tab
2. Click **Add or Remove Scopes**
3. Search and add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
4. Click **Update** → **Save and Continue**

### 5.5: Create/Update OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. **If you already have credentials:**
   - Click on your OAuth 2.0 Client ID
   - Scroll to **Authorized redirect URIs**
   - **Remove** any incorrect URIs
   - **Add** this exact URI:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Save**

3. **If you need to create new credentials:**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - **Name:** Your app name
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**
   - **Copy the Client ID and Client Secret**

### 5.6: Update `.env.local`

Update your `.env.local` with the credentials:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Important:**
- No quotes around values
- No trailing spaces
- Restart your Next.js dev server after updating

---

## 🔄 Step 6: Revoke Google Account Permissions

### 6.1: Revoke App Access in Google Account

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** (left sidebar)
3. Scroll to **Third-party apps with account access**
4. Click **Manage third-party access**
5. Find your app (or "Unknown app" if not verified)
6. Click on it
7. Click **Remove access** or **Revoke access**
8. Confirm the removal

### 6.2: Clear Browser Cookies (Optional but Recommended)

1. Open your browser's developer tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Delete all cookies (especially `next-auth.session-token`)
5. Or use incognito/private browsing window

---

## 🚀 Step 7: Re-authenticate

### 7.1: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 7.2: Sign Out (if already signed in)

1. Go to `http://localhost:3000`
2. Sign out if you're logged in
3. Or clear cookies (see Step 6.2)

### 7.3: Sign In with Google

1. Go to `http://localhost:3000/auth/signin`
2. Click **Sign in with Google**
3. You'll be redirected to Google's consent screen
4. **Review the permissions requested:**
   - ✅ See your email address
   - ✅ See your personal info
   - ✅ **See, edit, share, and permanently delete all the calendars you can access using Google Calendar**
   - ✅ **View your calendars**
   - ✅ **View and edit events on all your calendars**
5. Click **Allow** or **Continue**
6. You'll be redirected back to your app

### 7.4: Verify New Token Has Correct Scopes

After signing in, check your Supabase database:

```sql
SELECT 
  id,
  user_id,
  provider,
  provider_account_id,
  scope,
  expires_at,
  created_at
FROM public.accounts
WHERE provider = 'google'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `scope` should include: `https://www.googleapis.com/auth/calendar`
- `scope` should include: `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `access_token` should be present
- `refresh_token` should be present

---

## ✅ Step 8: Test Calendar Sync

### 8.1: Test the API

```bash
# Using curl (replace with your session cookie)
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### 8.2: Expected Response

```json
{
  "success": true,
  "calendars": [
    {
      "id": "primary",
      "summary": "Your Calendar",
      "primary": true,
      "accessRole": "owner"
    }
  ],
  "events": 42,
  "calendarCount": 1
}
```

### 8.3: Check Logs

Look for these in your terminal:
```
✅ Token is valid
📅 Fetching Google Calendar List...
✅ Fetched 3 calendars
✅ Fetched 42 events from Google Calendar
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI in Google Cloud Console doesn't match

**Solution:**
1. Check Google Cloud Console → Credentials
2. Ensure redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`
3. No trailing slashes
4. Use `http` not `https` for localhost

### Error: "invalid_client"

**Cause:** Wrong Client ID or Secret

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Ensure no extra spaces or quotes
3. Restart Next.js dev server

### Error: "Insufficient Permission" / "ACCESS_TOKEN_SCOPE_INSUFFICIENT"

**Cause:** Old token still being used

**Solution:**
1. Run SQL to delete old Google accounts (Step 2)
2. Revoke app access in Google Account (Step 6)
3. Sign out and sign in again
4. Verify new token has correct scopes

### Error: "Token scope: openid email profile" (missing calendar scopes)

**Cause:** User didn't grant calendar permissions

**Solution:**
1. Revoke app access completely
2. Sign in again
3. Make sure to click "Allow" on ALL permission prompts
4. Check that `prompt: "consent"` is in your GoogleProvider config

---

## 📋 Checklist

Use this checklist to ensure everything is done:

- [ ] Validated configuration with `node scripts/validate-google-oauth.js`
- [ ] Ran SQL migration to delete old Google accounts
- [ ] Verified OAuth scopes in `lib/auth.ts`
- [ ] Verified redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Updated Google Cloud Console OAuth consent screen with calendar scopes
- [ ] Updated Google Cloud Console OAuth credentials with correct redirect URI
- [ ] Updated `.env.local` with correct Client ID and Secret
- [ ] Revoked app access in Google Account settings
- [ ] Cleared browser cookies
- [ ] Restarted Next.js dev server
- [ ] Signed out of the application
- [ ] Signed in again with Google
- [ ] Granted all calendar permissions
- [ ] Verified new token has correct scopes in database
- [ ] Tested calendar sync API successfully

---

## 🎉 Success!

If all steps are completed successfully, you should now have:
- ✅ Correct OAuth scopes configured
- ✅ Valid OAuth client ID and secret
- ✅ Correct redirect URI
- ✅ Fresh tokens with calendar permissions
- ✅ Working calendar sync API

Your Google Calendar integration is now fully reset and working!

