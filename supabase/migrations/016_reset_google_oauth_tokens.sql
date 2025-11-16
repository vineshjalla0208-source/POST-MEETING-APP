-- Migration: Complete Google OAuth Token Reset
-- This migration fully resets Google OAuth tokens to force re-authentication with new scopes
-- Run this SQL in Supabase SQL Editor

-- Step 1: Delete all Google OAuth accounts from public.accounts table
-- This removes all old tokens that don't have the required calendar permissions
DELETE FROM public.accounts 
WHERE provider = 'google';

-- Step 2: Verify deletion (optional - uncomment to check)
-- SELECT COUNT(*) as remaining_google_accounts 
-- FROM public.accounts 
-- WHERE provider = 'google';
-- Expected result: 0

-- Step 3: Optional - Clear any related session data if needed
-- Note: NextAuth sessions are stored in JWT tokens, not in database
-- If you're using database sessions, uncomment below:
-- DELETE FROM sessions WHERE provider = 'google';

-- After running this migration:
-- 1. Users must sign out of the application
-- 2. Users must revoke app access in Google Account settings (see guide)
-- 3. Users must sign in again with Google
-- 4. Users will be prompted to grant calendar permissions
-- 5. New tokens with updated scopes will be saved to public.accounts

