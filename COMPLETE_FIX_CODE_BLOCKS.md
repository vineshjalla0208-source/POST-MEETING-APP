# Complete Fix - All Code Blocks Ready to Paste

## 1. .env.local Configuration

**File:** `.env.local`

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
NEXTAUTH_SECRET=X1lZp+WiV0y5Rfm0z9VkVug4wP35Yee1v3w8yx80HkM=

# Google OAuth
GOOGLE_CLIENT_ID=1039301733082-5831qh101f7hjgvqhnfkc8ahukfcb4if.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cbwmiccsunmjztmgubwx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid21pY2NzdW5tanp0bWd1Ynd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzY3MTYsImV4cCI6MjA3ODcxMjcxNn0.mF9YxmAzrQSxtp3UEXZvwCBC73gsxSqLKsXGsxA8jGA
SUPABASE_URL=https://cbwmiccsunmjztmgubwx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid21pY2NzdW5tanp0bWd1Ynd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzY3MTYsImV4cCI6MjA3ODcxMjcxNn0.mF9YxmAzrQSxtp3UEXZvwCBC73gsxSqLKsXGsxA8jGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid21pY2NzdW5tanp0bWd1Ynd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzNjcxNiwiZXhwIjoyMDc4NzEyNzE2fQ.d4cyulOYD0YhOzuFhvi3iUlZbdvjDvwtx6LBK9pgFxQ
SUPABASE_JWT_SECRET=fe3S13ag3EZ5robDT+0so/wlKYmN1YdmQUX2VF47e0u1mKcUByz+M2P3l3T/WxSLL9QubpVrIk6BCbiarlLP6g==

# Optional: LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Optional: Facebook OAuth
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Optional: Recall.ai
RECALL_API_KEY=
RECALL_BASE_URL=https://api.recall.ai/v1

# Optional: OpenAI
OPENAI_API_KEY=
```

**Important:** The `NEXTAUTH_SECRET` is now set to a secure 32-byte value. Do NOT change it after users log in.

---

## 2. Database Migration

**File:** `supabase/migrations/008_clean_and_fix_accounts.sql`

```sql
-- Migration: Clean and fix accounts table
-- This migration cleans broken data and ensures accounts table is correct

-- Step 1: Clean all broken authentication data
DELETE FROM accounts;
DELETE FROM user_tokens WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tokens');
-- Note: sessions and verification_tokens are managed by NextAuth JWT strategy, not stored in DB

-- Step 2: Drop user_tokens table if it exists (we use accounts instead)
DROP TABLE IF EXISTS user_tokens CASCADE;

-- Step 3: Ensure accounts table exists with correct schema
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON accounts(user_id, provider);

-- Step 5: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();
```

**Run this in Supabase SQL Editor or via CLI.**

---

## 3. Clean Broken State SQL

**File:** `CLEAN_BROKEN_STATE.sql`

```sql
-- SQL Script to Clean Broken Authentication State
-- Run this in Supabase SQL Editor to reset authentication state

-- Step 1: Clean all accounts (will be recreated on next login)
DELETE FROM accounts;

-- Step 2: Clean user_tokens if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tokens') THEN
    DELETE FROM user_tokens;
  END IF;
END $$;

-- Step 3: Verify accounts table structure
-- This should match the migration schema exactly
DO $$
BEGIN
  -- Check if accounts table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
    RAISE EXCEPTION 'accounts table does not exist. Run migration 008_clean_and_fix_accounts.sql first.';
  END IF;
  
  -- Check required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'provider_account_id'
  ) THEN
    RAISE EXCEPTION 'accounts table is missing required columns. Run migration 008_clean_and_fix_accounts.sql.';
  END IF;
END $$;

-- Step 4: Show current state
SELECT 
  'accounts' as table_name,
  COUNT(*) as row_count
FROM accounts
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users;

-- Note: NextAuth uses JWT strategy, so sessions and verification_tokens
-- are not stored in the database. They are stored in encrypted cookies.
```

**Run this after applying the migration to clean existing broken data.**

---

## 4. NextAuth Configuration

**File:** `lib/auth.ts`

See the file - it's already updated with all fixes.

**Key changes:**
- ✅ Validates NEXTAUTH_SECRET on startup
- ✅ `signIn` callback ensures user exists
- ✅ `jwt` callback saves tokens to accounts table
- ✅ `session` callback sets `session.user.id`
- ✅ Automatic token refresh when expired

---

## 5. Calendar Sync API

**File:** `app/api/calendar/sync/route.ts`

See the file - it's already updated with all fixes.

**Key changes:**
- ✅ Comprehensive logging
- ✅ Proper error messages
- ✅ Token lookup from accounts table
- ✅ Automatic token refresh
- ✅ Better error handling

---

## 6. Setup Steps

### Step 1: Update .env.local

Copy the `.env.local` content above into your `.env.local` file.

### Step 2: Apply Database Migration

Run `supabase/migrations/008_clean_and_fix_accounts.sql` in Supabase SQL Editor.

### Step 3: Clean Broken State (Optional)

Run `CLEAN_BROKEN_STATE.sql` in Supabase SQL Editor.

### Step 4: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 5: Clear Browser Cookies

Clear all cookies for `localhost:3000`.

### Step 6: Test

1. Sign in with Google
2. Check terminal logs for success messages
3. Check Supabase `accounts` table for tokens
4. Click "Sync Calendar" - should work!

---

## ✅ Success Indicators

When everything works, you'll see in terminal:

```
✅ signIn callback - User ensured in database. UUID: ...
🔐 JWT Callback - First sign in: ...
✅ Account tokens saved successfully to accounts table
📋 Session callback - User ID: ... Email: ...
✅ User authenticated. User ID: ...
✅ Account found with access token
📅 Fetching Google Calendar events...
✅ Fetched X events from Google Calendar
✅ Calendar sync complete: X events synced
```

---

**All fixes are complete and ready to use!**

