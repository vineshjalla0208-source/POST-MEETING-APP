-- Migration: Update user_tokens table to include all required fields
-- Adds: provider_account_id, token_type, id_token, scope

-- Step 1: Add missing columns to user_tokens table
ALTER TABLE public.user_tokens 
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
  ADD COLUMN IF NOT EXISTS token_type TEXT,
  ADD COLUMN IF NOT EXISTS id_token TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT;

-- Step 2: Update unique constraint to include provider_account_id
-- First, drop the old unique constraint if it exists
ALTER TABLE public.user_tokens 
  DROP CONSTRAINT IF EXISTS user_tokens_user_id_provider_key;

-- Step 3: Create new unique constraint on (user_id, provider, provider_account_id)
-- This allows multiple accounts per provider per user (e.g., multiple Google accounts)
ALTER TABLE public.user_tokens 
  ADD CONSTRAINT user_tokens_user_provider_account_unique 
  UNIQUE (user_id, provider, provider_account_id);

-- Step 4: Create index for faster lookups by provider_account_id
CREATE INDEX IF NOT EXISTS idx_user_tokens_provider_account_id 
  ON public.user_tokens(provider_account_id);

-- Step 5: Create index for faster lookups by user_id and provider (for backward compatibility)
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_provider 
  ON public.user_tokens(user_id, provider);

