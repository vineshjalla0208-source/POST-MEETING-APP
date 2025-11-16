# Complete Fix Summary - Public Schema

## ✅ All Issues Fixed

### Problems Resolved:
1. ✅ Wrong schema queries (`next_auth.accounts`) → **FIXED** (now uses `public.accounts`)
2. ✅ Duplicate/old migrations → **FIXED** (removed wrong migrations)
3. ✅ Refresh tokens not saved → **FIXED** (saves to both `public.accounts` and `public.user_tokens`)

---

## 📝 Changes Made

### 1. Database Migration

**File:** `supabase/migrations/011_final_public_accounts_schema.sql` - **NEW**

```sql
-- Drops next_auth schema completely
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Creates public.accounts table (NextAuth default)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
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

-- Also ensures public.user_tokens exists for refresh token backup
```

**Deleted migrations:**
- ❌ `009_fix_nextauth_accounts_schema.sql` - DELETED
- ❌ `010_create_next_auth_schema.sql` - DELETED

### 2. Token Management

**File:** `lib/supabase/accounts.ts` - **UPDATED**

**Before:**
```typescript
supabase.schema('next_auth').from('accounts')  // ❌ Wrong
```

**After:**
```typescript
supabase.from('accounts')  // ✅ Uses public schema (default)
```

**Functions:**
- ✅ `saveAccountTokens()` - Saves to `public.accounts` + `public.user_tokens`
- ✅ `getAccountTokens()` - Reads from `public.accounts`
- ✅ `updateAccountAccessToken()` - Updates both tables

### 3. OAuth Callback

**File:** `lib/auth.ts` - **Already correct**

- Uses `saveAccountTokens()` which saves to `public.accounts`
- Also saves refresh token to `public.user_tokens` automatically

### 4. Calendar Sync

**File:** `app/api/calendar/sync/route.ts` - **Already correct**

- Uses `getAccountTokens()` which reads from `public.accounts`

---

## 🚀 Setup

### Step 1: Apply Migration

```sql
-- Run: supabase/migrations/011_final_public_accounts_schema.sql
```

### Step 2: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 3: Test

1. Sign in with Google
2. Check logs: "Saving account tokens to public.accounts table"
3. Check logs: "Refresh token also saved to public.user_tokens table"
4. Click "Sync Calendar" - should work!

---

## ✅ Success Indicators

**Terminal logs:**
```
💾 Saving account tokens to public.accounts table
✅ Account tokens saved successfully to public.accounts table
✅ Refresh token also saved to public.user_tokens table
🔍 Looking up account in public.accounts table
✅ Account found in public.accounts
```

**Database:**
- ✅ `public.accounts` has row with `provider='google'`
- ✅ `public.user_tokens` has row with refresh token
- ✅ `next_auth` schema does NOT exist

---

**All queries now use `public.accounts` (NextAuth default)!**
