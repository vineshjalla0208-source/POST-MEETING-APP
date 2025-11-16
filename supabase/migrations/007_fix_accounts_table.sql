-- Migration: Fix accounts table to match NextAuth schema
-- This replaces the user_tokens table with NextAuth's standard accounts table

-- Drop user_tokens table if it exists (we'll use accounts instead)
DROP TABLE IF EXISTS user_tokens CASCADE;

-- Create accounts table matching NextAuth schema
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON accounts(provider, provider_account_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

