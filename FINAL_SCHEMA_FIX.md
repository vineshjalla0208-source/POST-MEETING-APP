# Final Schema Fix - Complete Solution

## ✅ All Queries Fixed to Use `public.accounts`

### Problem
Code was querying `next_auth.accounts` but database has `public.accounts` (NextAuth default).

### Solution
Removed all `.schema('next_auth')` calls. All queries now use default `public` schema.

---

## 📝 Files Updated

### 1. `lib/supabase/accounts.ts` - **UPDATED**

**All functions now use `public` schema (default):**

```typescript
// Before:
supabase.schema('next_auth').from('accounts')  // ❌ Wrong schema

// After:
supabase.from('accounts')  // ✅ Uses public schema (default)
```

**Functions updated:**
- ✅ `saveAccountTokens()` - Saves to `public.accounts` AND `public.user_tokens`
- ✅ `getAccountTokens()` - Reads from `public.accounts`
- ✅ `updateAccountAccessToken()` - Updates `public.accounts` AND `public.user_tokens`

**Dual storage:**
- Access tokens → `public.accounts` (NextAuth standard)
- Refresh tokens → `public.accounts` AND `public.user_tokens` (backup)

### 2. Database Migration

**File:** `supabase/migrations/011_final_public_accounts_schema.sql` - **NEW**

- ✅ Drops `next_auth` schema completely
- ✅ Ensures `public.accounts` table exists
- ✅ Ensures `public.user_tokens` table exists
- ✅ Proper indexes and triggers

**Deleted migrations:**
- ✅ `009_fix_nextauth_accounts_schema.sql` - DELETED
- ✅ `010_create_next_auth_schema.sql` - DELETED

### 3. Other Files - **Already Correct**

These files use helper functions, so they automatically use the correct schema:
- ✅ `lib/auth.ts` - Uses `saveAccountTokens()` helper
- ✅ `app/api/calendar/sync/route.ts` - Uses `getAccountTokens()` helper

---

## 🚀 Quick Setup

### Step 1: Apply Migration

```sql
-- Run in Supabase SQL Editor:
-- Copy: supabase/migrations/011_final_public_accounts_schema.sql
```

### Step 2: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 3: Test

1. Sign in with Google
2. Check terminal: "Saving account tokens to public.accounts table"
3. Check terminal: "Refresh token also saved to public.user_tokens table"
4. Click "Sync Calendar" - should work!

---

## ✅ Verification

**Check terminal logs for:**
```
💾 Saving account tokens to public.accounts table
✅ Account tokens saved successfully to public.accounts table
✅ Refresh token also saved to public.user_tokens table
🔍 Looking up account in public.accounts table
✅ Account found in public.accounts
```

**Check database:**
```sql
-- Verify public.accounts has data
SELECT * FROM public.accounts WHERE provider = 'google';

-- Verify public.user_tokens has refresh token
SELECT * FROM public.user_tokens WHERE provider = 'google';

-- Verify next_auth schema does NOT exist
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'next_auth';
-- Should return 0 rows
```

---

## 📋 Final Schema Structure

**Required tables:**
- ✅ `public.users` - User accounts
- ✅ `public.accounts` - OAuth account tokens (NextAuth default)
- ✅ `public.user_tokens` - Refresh token backup storage
- ✅ `public.meetings` - Calendar events

**Removed:**
- ❌ `next_auth` schema (does not exist)
- ❌ `next_auth.accounts` (does not exist)

---

**All queries now use the correct `public.accounts` table!**

