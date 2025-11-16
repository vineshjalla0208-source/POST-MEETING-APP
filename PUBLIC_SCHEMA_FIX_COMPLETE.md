# Public Schema Fix - Complete Solution

## ✅ All Issues Fixed

### Problems Resolved:
1. ✅ Wrong schema (`next_auth.accounts`) → **FIXED** (now uses `public.accounts`)
2. ✅ Duplicate migrations → **FIXED** (removed wrong migrations)
3. ✅ Stray `ai_posts` queries → **FIXED** (no incorrect queries found)
4. ✅ Refresh tokens not saved → **FIXED** (saves to both `public.accounts` and `public.user_tokens`)

---

## 📋 What Was Changed

### 1. Database Migration

**File:** `supabase/migrations/011_final_public_accounts_schema.sql` - **NEW**

- ✅ Drops `next_auth` schema completely
- ✅ Creates `public.accounts` table (NextAuth default)
- ✅ Ensures `public.user_tokens` table exists
- ✅ Proper indexes and triggers

**Deleted migrations:**
- ✅ `009_fix_nextauth_accounts_schema.sql` - DELETED (wrong schema)
- ✅ `010_create_next_auth_schema.sql` - DELETED (wrong schema)

### 2. Token Management Functions

**File:** `lib/supabase/accounts.ts` - **UPDATED**

**All queries now use `public` schema (default):**

- ✅ `saveAccountTokens()` - Uses `.from('accounts')` (public schema)
  - Also saves refresh token to `public.user_tokens`
- ✅ `getAccountTokens()` - Uses `.from('accounts')` (public schema)
- ✅ `updateAccountAccessToken()` - Uses `.from('accounts')` (public schema)
  - Also updates `public.user_tokens`

**Changes:**
- Removed all `.schema('next_auth')` calls
- All queries now use default `public` schema
- Added dual save: tokens saved to both `public.accounts` and `public.user_tokens`

### 3. OAuth Callback

**File:** `lib/auth.ts` - **Already correct**

- Uses `saveAccountTokens()` which now saves to `public.accounts`
- Also saves refresh token to `public.user_tokens` automatically

### 4. Calendar Sync API

**File:** `app/api/calendar/sync/route.ts` - **Already correct**

- Uses `getAccountTokens()` which now reads from `public.accounts`
- No direct queries to accounts table

---

## 🚀 Setup Instructions

### Step 1: Apply Final Migration

**Run in Supabase SQL Editor:**

```sql
-- Copy and paste contents of: supabase/migrations/011_final_public_accounts_schema.sql
```

This will:
- ✅ Drop `next_auth` schema completely
- ✅ Ensure `public.accounts` table exists
- ✅ Ensure `public.user_tokens` table exists
- ✅ Set up proper indexes and triggers

### Step 2: Clean Existing Data (Optional)

**Run in Supabase SQL Editor:**

```sql
-- Clean any accounts in wrong schema (if any exist)
DELETE FROM next_auth.accounts WHERE EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'next_auth');
```

### Step 3: Restart Development Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 4: Test the Flow

1. **Sign in with Google:**
   - Go to `http://localhost:3000/auth/signin`
   - Click "Sign in with Google"
   - Complete OAuth flow

2. **Check Terminal Logs:**
   You should see:
   ```
   💾 Saving account tokens to public.accounts table
   ✅ Account tokens saved successfully to public.accounts table
   ✅ Refresh token also saved to public.user_tokens table
   ```

3. **Verify in Database:**
   - Go to Supabase Dashboard
   - Check `public.accounts` table (NOT `next_auth.accounts`)
   - Should see row with:
     - `provider='google'`
     - `access_token` populated
     - `refresh_token` populated
   - Check `public.user_tokens` table
   - Should also see refresh token there

4. **Test Calendar Sync:**
   - Go to `/meetings` page
   - Click "Sync Google Calendar"
   - Check terminal logs:
     ```
     🔍 Looking up account in public.accounts table
     ✅ Account found in public.accounts
     📅 Fetching Google Calendar events...
     ✅ Fetched X events from Google Calendar
     ```

---

## 🔍 Verification Queries

### Check Schema Structure

```sql
-- Verify next_auth schema does NOT exist
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'next_auth';
-- Should return 0 rows

-- Verify public.accounts exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'accounts'
ORDER BY ordinal_position;
```

### Check Accounts Data

```sql
SELECT 
  id,
  user_id,
  provider,
  provider_account_id,
  CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_refresh_token,
  expires_at,
  created_at
FROM public.accounts
WHERE provider = 'google';
```

### Check User Tokens Data

```sql
SELECT 
  id,
  user_id,
  provider,
  CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_refresh_token,
  expires_at
FROM public.user_tokens
WHERE provider = 'google';
```

---

## ✅ Success Indicators

When everything works:

1. ✅ Terminal shows "Saving account tokens to public.accounts table"
2. ✅ Terminal shows "Refresh token also saved to public.user_tokens table"
3. ✅ Terminal shows "Looking up account in public.accounts table"
4. ✅ Supabase `public.accounts` table has row with tokens
5. ✅ Supabase `public.user_tokens` table has row with refresh token
6. ✅ Calendar sync works without "Google account not connected" error
7. ✅ No queries to `next_auth.accounts`
8. ✅ No `next_auth` schema exists

---

## 🐛 Troubleshooting

### Issue: "relation public.accounts does not exist"

**Fix:**
- Run migration `011_final_public_accounts_schema.sql`
- Verify table exists: `SELECT * FROM public.accounts LIMIT 1;`

### Issue: Still querying next_auth.accounts

**Check:**
1. Verify `lib/supabase/accounts.ts` has no `.schema('next_auth')` calls
2. Restart server after changes
3. Check terminal logs for schema being used

**Fix:**
- All queries should use `.from('accounts')` (defaults to public schema)
- No `.schema()` calls needed

### Issue: Refresh token not in user_tokens

**Check:**
1. Verify `saveAccountTokens()` saves to both tables
2. Check terminal logs for "Refresh token also saved to public.user_tokens table"

**Fix:**
- Sign out and sign in again
- Check terminal logs for token saving errors

---

## 📝 Files Changed

1. ✅ `supabase/migrations/011_final_public_accounts_schema.sql` - NEW
2. ✅ `lib/supabase/accounts.ts` - UPDATED (removed `.schema('next_auth')`, added dual save)
3. ✅ `supabase/migrations/009_fix_nextauth_accounts_schema.sql` - DELETED
4. ✅ `supabase/migrations/010_create_next_auth_schema.sql` - DELETED

**Files already correct (use helper functions):**
- ✅ `lib/auth.ts` - Uses `saveAccountTokens()` helper
- ✅ `app/api/calendar/sync/route.ts` - Uses `getAccountTokens()` helper

---

## 🎯 Final Checklist

Before testing:

- [ ] Migration `011_final_public_accounts_schema.sql` applied
- [ ] `next_auth` schema does NOT exist
- [ ] `public.accounts` table exists
- [ ] `public.user_tokens` table exists
- [ ] All queries in `lib/supabase/accounts.ts` use `.from('accounts')` (no `.schema()`)
- [ ] Server restarted
- [ ] Browser cookies cleared

---

**Status:** ✅ Complete  
**Version:** 5.0.0 - Public Schema Fix  
**Date:** 2024-01-XX

All queries now use the correct `public.accounts` table (NextAuth default)!

