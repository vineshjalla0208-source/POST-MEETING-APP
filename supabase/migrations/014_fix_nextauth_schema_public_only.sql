-- Migration: Fix NextAuth schema - Use ONLY public schema
-- This migration:
-- 1. Drops any mistakenly created next_auth schema tables
-- 2. Drops the next_auth schema if it exists
-- 3. Ensures public.accounts exists with correct schema
-- 4. Does NOT create user_tokens (optional, only if app needs it)

-- Step 1: Drop next_auth.accounts table if it exists
DROP TABLE IF EXISTS next_auth.accounts CASCADE;

-- Step 2: Drop next_auth.user_tokens table if it exists
DROP TABLE IF EXISTS next_auth.user_tokens CASCADE;

-- Step 3: Drop the entire next_auth schema if it exists (and all its objects)
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Step 4: Ensure public.accounts table exists with correct NextAuth schema
-- This matches the official NextAuth/Auth.js accounts table structure
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Step 5: Create indexes for faster lookups on public.accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON public.accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON public.accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON public.accounts(user_id, provider);

-- Step 6: Function to update updated_at timestamp for accounts
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Trigger to auto-update updated_at for accounts
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

-- Step 8: Ensure public.users table exists (required by NextAuth)
-- This should already exist from initial migration, but ensure it's there
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 9: Create index on users.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 10: Function and trigger for users updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

-- Note: user_tokens table is NOT created here as it's optional
-- Only create it if your app specifically needs it

