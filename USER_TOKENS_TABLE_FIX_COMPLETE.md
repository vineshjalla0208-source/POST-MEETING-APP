# User Tokens Table Fix - Complete

## ✅ All Issues Fixed

### Problems Resolved:
1. ✅ Wrong table (`public.accounts`) → **FIXED** (now uses `public.user_tokens`)
2. ✅ Missing fields in `user_tokens` → **FIXED** (added `provider_account_id`, `token_type`, `id_token`, `scope`)
3. ✅ All queries updated → **FIXED** (all functions now use `user_tokens`)
4. ✅ Log messages updated → **FIXED** (shows correct table name and success messages)

---

## 📋 Changes Made

### 1. Database Migration

**File:** `supabase/migrations/012_update_user_tokens_schema.sql` - **NEW**

Adds missing fields to `user_tokens` table:
- ✅ `provider_account_id` (TEXT)
- ✅ `token_type` (TEXT)
- ✅ `id_token` (TEXT)
- ✅ `scope` (TEXT)
- ✅ Updated unique constraint to `(user_id, provider, provider_account_id)`
- ✅ Added indexes for faster lookups

### 2. Token Management Functions

**File:** `lib/supabase/accounts.ts` - **UPDATED**

**All functions now use `public.user_tokens`:**

- ✅ `saveAccountTokens()` - Uses `.from('user_tokens')`
  - Logs: "Saving account tokens to user_tokens successful"
- ✅ `getAccountTokens()` - Uses `.from('user_tokens')`
  - Logs: "Account tokens fetched successfully"
- ✅ `updateAccountAccessToken()` - Uses `.from('user_tokens')`
- ✅ `refreshAccountToken()` - Uses `getAccountTokens()` and `updateAccountAccessToken()`

**Updated Interface:**
```typescript
export interface Account {
  id: string
  user_id: string
  provider: string
  provider_account_id: string | null  // Added
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null           // Added
  scope: string | null                 // Added
  id_token: string | null              // Added
  created_at: string
  updated_at: string
}
```

### 3. NextAuth Route

**File:** `app/api/auth/[...nextauth]/route.ts` - **UPDATED**

- ✅ Changed `.from("accounts")` → `.from("user_tokens")`
- ✅ Updated `onConflict` to `'user_id,provider,provider_account_id'`
- ✅ Logs: "Saving account tokens to user_tokens successful"

### 4. Calendar Sync API

**File:** `app/api/calendar/sync/route.ts` - **UPDATED**

- ✅ Updated error message: "No account found in user_tokens table"
- ✅ Uses `getAccountTokens()` which now reads from `user_tokens`

---

## 🚀 Setup Instructions

### Step 1: Apply Migration

**Run in Supabase SQL Editor:**

```sql
-- Copy and paste contents of: supabase/migrations/012_update_user_tokens_schema.sql
```

This will:
- ✅ Add missing columns to `user_tokens` table
- ✅ Update unique constraint
- ✅ Add indexes for performance

### Step 2: Restart Development Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 3: Test the Flow

1. **Sign in with Google:**
   - Go to `http://localhost:3000/auth/signin`
   - Click "Sign in with Google"
   - Complete OAuth flow

2. **Check Terminal Logs:**
   You should see:
   ```
   💾 Saving account tokens to public.user_tokens table
   ✅ Account tokens saved successfully to public.user_tokens table
   ✅ Saving account tokens to user_tokens successful
   ```

3. **Verify in Database:**
   - Go to Supabase Dashboard
   - Check `public.user_tokens` table (NOT `public.accounts`)
   - Should see row with:
     - `provider='google'`
     - `provider_account_id` populated
     - `access_token` populated
     - `refresh_token` populated
     - `token_type`, `id_token`, `scope` populated

4. **Test Calendar Sync:**
   - Go to `/meetings` page
   - Click "Sync Google Calendar"
   - Check terminal logs:
     ```
     🔍 Looking up account in public.user_tokens table
     ✅ Account found in public.user_tokens
     ✅ Account tokens fetched successfully
     📅 Fetching Google Calendar events...
     ✅ Fetched X events from Google Calendar
     ```

---

## 🔍 Verification Queries

### Check user_tokens Table Structure

```sql
-- Verify all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_tokens'
ORDER BY ordinal_position;
```

**Expected columns:**
- id
- user_id
- provider
- provider_account_id ✅ (NEW)
- access_token
- refresh_token
- expires_at
- token_type ✅ (NEW)
- id_token ✅ (NEW)
- scope ✅ (NEW)
- created_at
- updated_at

### Check user_tokens Data

```sql
SELECT 
  id,
  user_id,
  provider,
  provider_account_id,
  CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_refresh_token,
  token_type,
  scope,
  CASE WHEN id_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_id_token,
  expires_at,
  created_at
FROM public.user_tokens
WHERE provider = 'google';
```

### Verify Unique Constraint

```sql
-- Check unique constraint exists
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'user_tokens'
  AND constraint_type = 'UNIQUE';
```

**Expected:** `user_tokens_user_provider_account_unique` on `(user_id, provider, provider_account_id)`

---

## ✅ Success Indicators

When everything works:

1. ✅ Terminal shows "Saving account tokens to user_tokens successful"
2. ✅ Terminal shows "Account tokens fetched successfully"
3. ✅ Supabase `public.user_tokens` table has row with all fields populated
4. ✅ Calendar sync works without "Google account not connected" error
5. ✅ No queries to `public.accounts` table
6. ✅ All token fields (`provider_account_id`, `token_type`, `id_token`, `scope`) are saved

---

## 🐛 Troubleshooting

### Issue: "column provider_account_id does not exist"

**Fix:**
- Run migration `012_update_user_tokens_schema.sql`
- Verify column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_tokens' AND column_name = 'provider_account_id';`

### Issue: Still querying public.accounts

**Check:**
1. Verify `lib/supabase/accounts.ts` uses `.from('user_tokens')`
2. Verify `app/api/auth/[...nextauth]/route.ts` uses `.from('user_tokens')`
3. Restart server after changes
4. Check terminal logs for table name being used

**Fix:**
- All queries should use `.from('user_tokens')`
- No `.from('accounts')` calls should exist

### Issue: "unique constraint violation"

**Check:**
1. Verify unique constraint is `(user_id, provider, provider_account_id)`
2. Check if multiple rows exist with same `(user_id, provider)` but different `provider_account_id`

**Fix:**
- Run migration to update constraint
- Clean duplicate data if needed

### Issue: Calendar sync still says "Google account not connected"

**Check:**
1. Verify tokens are saved to `user_tokens` table
2. Check terminal logs for "Account tokens fetched successfully"
3. Verify `user_id` in session matches `user_id` in `user_tokens`

**Fix:**
- Sign out and sign in again
- Check terminal logs for token saving errors
- Verify `session.user.id` is set correctly

---

## 📝 Files Changed

1. ✅ `supabase/migrations/012_update_user_tokens_schema.sql` - NEW
2. ✅ `lib/supabase/accounts.ts` - UPDATED (all queries use `user_tokens`)
3. ✅ `app/api/auth/[...nextauth]/route.ts` - UPDATED (saves to `user_tokens`)
4. ✅ `app/api/calendar/sync/route.ts` - UPDATED (error messages)

**Files already correct (use helper functions):**
- ✅ All other API routes use `getAccountTokens()` helper (automatically fixed)

---

## 🎯 Final Checklist

Before testing:

- [ ] Migration `012_update_user_tokens_schema.sql` applied
- [ ] `user_tokens` table has all required columns
- [ ] All queries in `lib/supabase/accounts.ts` use `.from('user_tokens')`
- [ ] NextAuth route saves to `user_tokens`
- [ ] Server restarted
- [ ] Browser cookies cleared

---

**Status:** ✅ Complete  
**Version:** 6.0.0 - User Tokens Table Fix  
**Date:** 2024-01-XX

All queries now use the correct `public.user_tokens` table!

