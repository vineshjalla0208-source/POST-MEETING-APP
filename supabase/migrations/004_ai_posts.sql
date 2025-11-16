-- Migration: AI Posts Table
-- Stores AI-generated content (emails, social posts, automation posts)

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

