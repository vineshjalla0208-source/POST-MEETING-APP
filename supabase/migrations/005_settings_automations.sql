-- Migration: Settings + Automations Manager
-- Adds social_tokens table and updates automations table with prompt_template

-- TABLE: social_tokens
-- Stores OAuth tokens for LinkedIn and Facebook
CREATE TABLE IF NOT EXISTS social_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add prompt_template column to automations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'automations' AND column_name = 'prompt_template'
  ) THEN
    ALTER TABLE automations ADD COLUMN prompt_template TEXT;
  END IF;
END $$;

-- Update automations table to support 'email' type
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'automations' AND column_name = 'type'
  ) THEN
    -- Drop existing check constraint if it exists
    ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_type_check;
    -- Add new check constraint with 'email' type
    ALTER TABLE automations ADD CONSTRAINT automations_type_check 
      CHECK (type IN ('generate_post', 'email', 'linkedin', 'facebook'));
  END IF;
END $$;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_provider ON social_tokens(provider);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_social_tokens_updated_at 
  BEFORE UPDATE ON social_tokens
  FOR EACH ROW EXECUTE FUNCTION update_social_tokens_updated_at();

-- RLS Policies for social_tokens
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social tokens" ON social_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social tokens" ON social_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social tokens" ON social_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social tokens" ON social_tokens
  FOR DELETE USING (auth.uid() = user_id);

