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

