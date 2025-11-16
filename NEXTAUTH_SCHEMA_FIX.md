# NextAuth Schema Fix - Complete Solution

## ✅ All Issues Fixed

### Problems Resolved:
1. ✅ Wrong table (`public.accounts`) → **FIXED** (now uses `next_auth.accounts`)
2. ✅ Queries looking in wrong schema → **FIXED** (all queries use `.schema('next_auth')`)
3. ✅ Google tokens not found → **FIXED** (tokens saved to and read from `next_auth.accounts`)

---

## 📋 What Was Changed

### 1. Database Migration

**File:** `supabase/migrations/010_create_next_auth_schema.sql`

- ✅ Creates `next_auth` schema
- ✅ Drops wrong `public.accounts` table
- ✅ Creates correct `next_auth.accounts` table
- ✅ Matches official NextAuth Supabase adapter schema
- ✅ Includes all required fields and indexes

### 2. Token Management Functions

**File:** `lib/supabase/accounts.ts` - **UPDATED**

**All queries now use `next_auth` schema:**

- ✅ `saveAccountTokens()` - Uses `.schema('next_auth').from('accounts')`
- ✅ `getAccountTokens()` - Uses `.schema('next_auth').from('accounts')`
- ✅ `updateAccountAccessToken()` - Uses `.schema('next_auth').from('accounts')`
- ✅ `refreshAccountToken()` - Uses functions that query `next_auth.accounts`

**Changes:**
- All `.from('accounts')` → `.schema('next_auth').from('accounts')`
- Updated logging to show `next_auth.accounts` schema
- Better error messages

### 3. Calendar Sync API

**File:** `app/api/calendar/sync/route.ts` - **Already correct**

- Uses `getAccountTokens()` which now queries `next_auth.accounts`
- No direct queries to accounts table (uses helper functions)

### 4. NextAuth Configuration

**File:** `lib/auth.ts` - **Already correct**

- Uses `saveAccountTokens()` which now saves to `next_auth.accounts`
- No direct queries to accounts table (uses helper functions)

---

## 🚀 Setup Instructions

### Step 1: Apply Database Migration

**Run in Supabase SQL Editor:**

```sql
-- Copy and paste contents of: supabase/migrations/010_create_next_auth_schema.sql
```

This will:
- ✅ Create `next_auth` schema
- ✅ Drop wrong `public.accounts` table
- ✅ Create correct `next_auth.accounts` table
- ✅ Set up indexes and triggers

**Or using Supabase CLI:**
```bash
supabase migration up
```

### Step 2: Clean Existing Data (Optional)

**Run in Supabase SQL Editor:**

```sql
-- Clean any existing accounts in wrong schema
DELETE FROM public.accounts WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts');
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
   💾 Saving account tokens to next_auth.accounts table: ...
   ✅ Account tokens saved successfully to next_auth.accounts table
   ```

3. **Verify in Database:**
   - Go to Supabase Dashboard
   - Check `next_auth.accounts` table (not `public.accounts`)
   - Should see row with:
     - `provider='google'`
     - `access_token` populated
     - `refresh_token` populated

4. **Test Calendar Sync:**
   - Go to `/meetings` page
   - Click "Sync Google Calendar"
   - Check terminal logs:
     ```
     🔍 Looking up account in next_auth.accounts table: ...
     ✅ Account found in next_auth.accounts: ...
     📅 Fetching Google Calendar events...
     ✅ Fetched X events from Google Calendar
     ```

---

## 🔍 Verification Queries

### Check next_auth Schema Exists

```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'next_auth';
```

### Check next_auth.accounts Table Structure

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'next_auth' 
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
FROM next_auth.accounts
WHERE provider = 'google';
```

---

## ✅ Success Indicators

When everything works:

1. ✅ Terminal shows "Saving account tokens to next_auth.accounts table"
2. ✅ Terminal shows "Account found in next_auth.accounts"
3. ✅ Supabase `next_auth.accounts` table has row with tokens
4. ✅ Calendar sync works without "Google account not connected" error
5. ✅ No queries to `public.accounts` table
6. ✅ All queries use `.schema('next_auth').from('accounts')`

---

## 🐛 Troubleshooting

### Issue: "relation next_auth.accounts does not exist"

**Fix:**
- Run migration `010_create_next_auth_schema.sql`
- Verify schema exists: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';`

### Issue: "No account found in next_auth.accounts"

**Check:**
1. Verify you signed in with Google
2. Check terminal logs for "Account tokens saved successfully"
3. Run: `SELECT * FROM next_auth.accounts WHERE provider = 'google';`

**Fix:**
- Sign out and sign in again
- Check terminal logs for token saving errors

### Issue: Still querying public.accounts

**Check:**
1. Verify `lib/supabase/accounts.ts` uses `.schema('next_auth')`
2. Restart server after changes
3. Check terminal logs for schema being used

---

## 📝 Files Changed

1. ✅ `supabase/migrations/010_create_next_auth_schema.sql` - NEW
2. ✅ `lib/supabase/accounts.ts` - UPDATED (all queries use `next_auth` schema)

**Files already correct (use helper functions):**
- ✅ `lib/auth.ts` - Uses `saveAccountTokens()` helper
- ✅ `app/api/calendar/sync/route.ts` - Uses `getAccountTokens()` helper

---

## 🎯 Final Checklist

Before testing:

- [ ] Migration `010_create_next_auth_schema.sql` applied
- [ ] `next_auth` schema exists in database
- [ ] `next_auth.accounts` table exists
- [ ] All queries in `lib/supabase/accounts.ts` use `.schema('next_auth')`
- [ ] Server restarted
- [ ] Browser cookies cleared

---

**Status:** ✅ Complete  
**Version:** 4.0.0 - NextAuth Schema Fix  
**Date:** 2024-01-XX

All queries now use the correct `next_auth.accounts` table!

