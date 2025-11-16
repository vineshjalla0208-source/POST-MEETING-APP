-- Migration: Clear old OAuth sessions and accounts
-- This migration helps users re-authenticate with updated Google OAuth scopes
-- Run this SQL in Supabase SQL Editor to clear old OAuth data

-- Step 1: Delete all Google accounts (users will need to re-authenticate with new scopes)
-- This removes old tokens that don't have the required calendar permissions
DELETE FROM public.accounts 
WHERE provider = 'google';

-- Step 2: Optional - If you want to keep user data but just clear Google connections
-- Uncomment the line below if you want to keep other provider accounts (LinkedIn, Facebook)
-- DELETE FROM public.accounts WHERE provider = 'google';

-- Step 3: Verify the accounts table is empty for Google (optional check)
-- SELECT COUNT(*) as google_accounts_count FROM public.accounts WHERE provider = 'google';

-- Note: After running this migration, users will need to:
-- 1. Sign out of the application
-- 2. Sign in again with Google
-- 3. Grant the new calendar permissions when prompted
-- 4. The new tokens with updated scopes will be saved to public.accounts

