-- Migration: Final public.accounts schema (NextAuth default)
-- This ensures public.accounts exists with correct NextAuth schema
-- Removes next_auth schema and ensures all tables are in public schema

-- Step 1: Drop next_auth schema and all its tables (if exists)
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- Step 2: Ensure accounts table exists in public schema (NextAuth default)
-- This matches the official NextAuth schema structure
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Step 3: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON public.accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON public.accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON public.accounts(user_id, provider);

-- Step 4: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

-- Step 6: Ensure user_tokens table exists for refresh token storage (already created in 002, but ensure it exists)
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Step 7: Create indexes for user_tokens (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_provider ON public.user_tokens(provider);

-- Step 8: Function and trigger for user_tokens updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON public.user_tokens;
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON public.user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_user_tokens_updated_at();
