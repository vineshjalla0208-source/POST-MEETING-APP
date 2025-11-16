-- Migration: Google Calendar Sync Tables
-- Creates meetings and user_tokens tables for Google Calendar integration

-- TABLE: user_tokens
-- Stores OAuth tokens for Google (and potentially other providers)
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- TABLE: meetings
-- Stores calendar events/meetings synced from Google Calendar
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  platform TEXT DEFAULT 'unknown' CHECK (platform IN ('zoom', 'google', 'teams', 'unknown')),
  notetaker_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_provider ON user_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_google_event_id ON meetings(google_event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_notetaker_enabled ON meetings(notetaker_enabled);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_user_tokens_updated_at();

CREATE TRIGGER update_meetings_updated_at 
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_meetings_updated_at();

