-- =====================================================
-- Post-Meeting App - All Migrations Combined
-- Run this file in Supabase SQL Editor
-- =====================================================

-- Migration 001: Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by NextAuth, but we'll have our own for additional data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google accounts table (supports multiple accounts per user)
CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Events table (calendar events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_account_id UUID REFERENCES google_accounts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  meeting_platform TEXT CHECK (meeting_platform IN ('zoom', 'meet', 'teams')),
  location TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting bots table
CREATE TABLE IF NOT EXISTS meeting_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'recording', 'completed', 'failed')),
  recall_bot_id TEXT,
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  meeting_bot_id UUID NOT NULL REFERENCES meeting_bots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  profile_id TEXT,
  profile_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'both')),
  tone TEXT NOT NULL,
  hashtag_count INTEGER NOT NULL DEFAULT 3 CHECK (hashtag_count >= 0 AND hashtag_count <= 10),
  type TEXT NOT NULL DEFAULT 'generate_post' CHECK (type IN ('generate_post')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bot_join_minutes_before INTEGER NOT NULL DEFAULT 5 CHECK (bot_join_minutes_before >= 0 AND bot_join_minutes_before <= 60),
  default_automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id ON google_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_bots_event_id ON meeting_bots(event_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_event_id ON transcripts(event_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_accounts_updated_at BEFORE UPDATE ON google_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_bots_updated_at BEFORE UPDATE ON meeting_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration 002: Google Calendar Sync
-- =====================================================

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  google_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  platform TEXT DEFAULT 'unknown' NOT NULL, -- 'zoom', 'google', 'teams', 'unknown'
  notetaker_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'google'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT, -- Unix timestamp in milliseconds
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, provider)
);

-- Add RLS policies for meetings table
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own meetings." ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meetings." ON meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings." ON meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings." ON meetings FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for user_tokens table
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tokens." ON user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens." ON user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens." ON user_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tokens." ON user_tokens FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Migration 003: Recall Integration
-- =====================================================

-- Create recall_bots table
CREATE TABLE IF NOT EXISTS recall_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joining', 'recording', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update transcripts table to reference meetings instead of events
-- First, check if the column exists and update accordingly
DO $$ 
BEGIN
  -- Add meeting_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'meeting_id'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE;
  END IF;

  -- Add recall_bot_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'recall_bot_id'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN recall_bot_id UUID REFERENCES recall_bots(id) ON DELETE SET NULL;
  END IF;

  -- Add new columns for Recall transcript data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'summary'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN summary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN duration_seconds INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'participant_count'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN participant_count INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcripts' AND column_name = 'participants'
  ) THEN
    ALTER TABLE transcripts ADD COLUMN participants TEXT[];
  END IF;
END $$;

-- Indexes for recall_bots
CREATE INDEX IF NOT EXISTS idx_recall_bots_meeting_id ON recall_bots(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recall_bots_status ON recall_bots(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recall_bot_id ON transcripts(recall_bot_id);

-- Trigger for recall_bots updated_at
CREATE TRIGGER update_recall_bots_updated_at BEFORE UPDATE ON recall_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration 004: AI Posts
-- =====================================================

-- TABLE: ai_posts
-- Stores all AI-generated content for meetings
CREATE TABLE IF NOT EXISTS ai_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'linkedin', 'facebook', 'automation')),
  content TEXT NOT NULL,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'facebook', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_posts_meeting_id ON ai_posts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_type ON ai_posts(type);
CREATE INDEX IF NOT EXISTS idx_ai_posts_automation_id ON ai_posts(automation_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_created_at ON ai_posts(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ai_posts_updated_at 
  BEFORE UPDATE ON ai_posts
  FOR EACH ROW EXECUTE FUNCTION update_ai_posts_updated_at();

-- =====================================================
-- Migration 005: Settings + Automations Manager
-- =====================================================

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

-- =====================================================
-- Migration 006: Posted Social Content
-- =====================================================

-- TABLE: posted_social_content
-- Stores records of content posted to social media platforms
CREATE TABLE IF NOT EXISTS posted_social_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook')),
  content TEXT NOT NULL,
  post_id TEXT, -- External post ID from LinkedIn/Facebook
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  ai_post_id UUID REFERENCES ai_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posted_social_content_user_id ON posted_social_content(user_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_platform ON posted_social_content(platform);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_meeting_id ON posted_social_content(meeting_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_created_at ON posted_social_content(created_at);

-- RLS Policies
ALTER TABLE posted_social_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posted content" ON posted_social_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posted content" ON posted_social_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posted content" ON posted_social_content
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Migration Complete!
-- =====================================================

