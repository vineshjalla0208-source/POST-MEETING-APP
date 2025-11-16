# NextAuth Schema Fix - Summary

## ✅ All Queries Fixed

### Problem
Code was querying `public.accounts` but tokens are stored in `next_auth.accounts`.

### Solution
Updated all queries to use `.schema('next_auth').from('accounts')`.

---

## 📝 Files Updated

### 1. `lib/supabase/accounts.ts` - **UPDATED**

**All functions now use `next_auth` schema:**

```typescript
// Before:
supabase.from('accounts')

// After:
supabase.schema('next_auth').from('accounts')
```

**Functions updated:**
- ✅ `saveAccountTokens()` - Line 67
- ✅ `getAccountTokens()` - Line 120
- ✅ `updateAccountAccessToken()` - Line 177

### 2. `supabase/migrations/010_create_next_auth_schema.sql` - **NEW**

Creates:
- `next_auth` schema
- `next_auth.accounts` table
- Proper indexes and triggers

### 3. Other Files - **Already Correct**

These files use helper functions, so they automatically use the correct schema:
- ✅ `lib/auth.ts` - Uses `saveAccountTokens()` helper
- ✅ `app/api/calendar/sync/route.ts` - Uses `getAccountTokens()` helper

---

## 🚀 Quick Setup

### Step 1: Apply Migration

```sql
-- Run in Supabase SQL Editor:
-- Copy: supabase/migrations/010_create_next_auth_schema.sql
```

### Step 2: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 3: Test

1. Sign in with Google
2. Check terminal: "Saving account tokens to next_auth.accounts table"
3. Click "Sync Calendar" - should work!

---

## ✅ Verification

**Check terminal logs for:**
```
💾 Saving account tokens to next_auth.accounts table
✅ Account tokens saved successfully to next_auth.accounts table
🔍 Looking up account in next_auth.accounts table
✅ Account found in next_auth.accounts
```

**Check database:**
```sql
SELECT * FROM next_auth.accounts WHERE provider = 'google';
```

---

**All queries now use the correct `next_auth.accounts` table!**

