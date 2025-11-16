-- Migration: Fix accounts table - Final version
-- Deletes user_tokens table and ensures only public.accounts exists with correct schema

-- Step 1: Drop user_tokens table if it exists
DROP TABLE IF EXISTS public.user_tokens CASCADE;

-- Step 2: Drop accounts table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS public.accounts CASCADE;

-- Step 3: Create public.accounts table exactly as specified
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(provider, provider_account_id),
  FOREIGN KEY(user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON public.accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON public.accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON public.accounts(user_id, provider);

-- Step 5: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Trigger to auto-update updated_at
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

