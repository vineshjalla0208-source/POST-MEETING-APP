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

