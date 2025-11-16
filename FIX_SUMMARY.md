# Complete Authentication Fix - Summary

## 🎯 What Was Fixed

### Problem Analysis

The authentication system had multiple critical issues:

1. **Wrong Database Schema**: Using `user_tokens` table instead of NextAuth's standard `accounts` table
2. **Missing Accounts Table**: The `accounts` table didn't exist, so tokens were never saved
3. **Token Storage Mismatch**: Code was saving to one table but reading from another
4. **Missing NEXTAUTH_SECRET**: Secret was missing or too short
5. **No Token Refresh**: No automatic refresh when tokens expired

---

## ✅ Complete Solution

### 1. Database Migration

**File:** `supabase/migrations/007_fix_accounts_table.sql`

- Drops old `user_tokens` table
- Creates new `accounts` table matching NextAuth schema exactly
- Includes all required fields: `access_token`, `refresh_token`, `expires_at`, `token_type`, `scope`, `id_token`
- Unique constraint on `(provider, provider_account_id)`

### 2. NextAuth Configuration

**File:** `lib/auth.ts`

**Changes:**
- Added `signIn` callback to ensure user exists
- Updated `jwt` callback to save tokens to `accounts` table
- Implemented automatic token refresh when expired
- Stores all token fields properly

**Key Features:**
- Saves tokens on first sign-in
- Automatically refreshes expired tokens
- Proper error handling and logging

### 3. Token Management

**File:** `lib/supabase/accounts.ts` (NEW)

**Functions:**
- `saveAccountTokens()` - Saves tokens to accounts table
- `getAccountTokens()` - Retrieves tokens from accounts table
- `updateAccountAccessToken()` - Updates token after refresh
- `refreshAccountToken()` - Refreshes expired tokens
- `isTokenExpired()` - Checks token expiration

### 4. Calendar Sync API

**File:** `app/api/calendar/sync/route.ts`

**Changes:**
- Reads tokens from `accounts` table (not `user_tokens`)
- Proper error handling for missing tokens
- Automatic token refresh when expired
- Better logging for debugging

### 5. Frontend Components

**Files Updated:**
- `components/sync-google-calendar-button.tsx` - Updated to use `/api/calendar/sync`
- `app/meetings/page.tsx` - Fixed user ID access

---

## 📋 Setup Instructions

### Step 1: Environment Variables

Update `.env.local` with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cR07bDZr5wRyybW4Nh0k9V3KWLToU6F0Od9OBWPIUgs=
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
# ... (see .env.local.example for full list)
```

**Generate new NEXTAUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Run Migration

Apply the database migration:

```bash
# Using Supabase CLI
supabase migration up

# Or run SQL directly in Supabase Dashboard
# Copy: supabase/migrations/007_fix_accounts_table.sql
```

### Step 3: Verify Google OAuth

In Google Cloud Console:
- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

### Step 4: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 5: Test

1. Sign in with Google
2. Check `/api/auth/session` - should return user with `id`
3. Check Supabase `accounts` table - should have row with tokens
4. Click "Sync Calendar" - should work without errors

---

## 🔄 How It Works Now

### Authentication Flow:

```
1. User clicks "Sign in with Google"
   ↓
2. NextAuth redirects to Google OAuth
   ↓
3. User authorizes app
   ↓
4. Google redirects back with tokens
   ↓
5. NextAuth signIn callback → ensures user exists
   ↓
6. NextAuth jwt callback → saves tokens to accounts table
   ↓
7. Session created with user.id (UUID)
```

### Calendar Sync Flow:

```
1. User clicks "Sync Calendar"
   ↓
2. API route gets session
   ↓
3. Reads tokens from accounts table
   ↓
4. If expired → refreshes token automatically
   ↓
5. Calls Google Calendar API
   ↓
6. Saves events to meetings table
```

---

## 📊 Database Schema

### accounts table (NextAuth standard):

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

---

## ✅ Success Criteria

When everything works:

- ✅ `/api/auth/session` returns user with `id` field
- ✅ Supabase `accounts` table has row with `provider='google'`
- ✅ `accounts` table has `access_token` and `refresh_token`
- ✅ Calendar sync works without "Google account not connected" error
- ✅ Meetings appear in `/meetings` page
- ✅ Terminal shows success logs

---

## 🐛 Troubleshooting

### "Google account not connected"

**Check:**
- Visit `/api/debug/session`
- Check Supabase `accounts` table
- Verify `provider='google'` row exists

**Fix:**
- Sign out and sign in again
- Check terminal logs for errors

### "NEXTAUTH_SECRET is missing"

**Fix:**
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Add to `.env.local`
- Restart server

### Session is null

**Check:**
- `NEXTAUTH_URL=http://localhost:3000` (no trailing slash)
- `NEXTAUTH_SECRET` is 32+ characters
- Browser cookies enabled

**Fix:**
- Clear cookies
- Restart server

---

## 📝 Files Changed

1. ✅ `supabase/migrations/007_fix_accounts_table.sql` - NEW
2. ✅ `lib/auth.ts` - UPDATED
3. ✅ `lib/supabase/accounts.ts` - NEW
4. ✅ `app/api/calendar/sync/route.ts` - UPDATED
5. ✅ `components/sync-google-calendar-button.tsx` - UPDATED
6. ✅ `app/meetings/page.tsx` - UPDATED
7. ✅ `.env.local.example` - NEW

---

## 🎯 Next Steps

1. Apply database migration
2. Update `.env.local` with proper values
3. Restart server
4. Test authentication flow
5. Test calendar sync

---

**Status:** ✅ Complete  
**Version:** 2.0.0  
**Date:** 2024-01-XX

