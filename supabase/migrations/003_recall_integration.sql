-- Migration: Recall Integration Tables
-- Creates recall_bots and transcripts tables for Recall.ai integration

-- TABLE: recall_bots
-- Stores Recall.ai bot instances for meetings
CREATE TABLE IF NOT EXISTS recall_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joining', 'recording', 'processing', 'completed', 'failed')),
  meeting_url TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: transcripts
-- Stores meeting transcripts from Recall.ai
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id UUID NOT NULL REFERENCES recall_bots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  summary TEXT,
  duration_seconds INTEGER,
  participant_count INTEGER,
  participants TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recall_bots_meeting_id ON recall_bots(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recall_bots_recall_bot_id ON recall_bots(recall_bot_id);
CREATE INDEX IF NOT EXISTS idx_recall_bots_status ON recall_bots(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recall_bot_id ON transcripts(recall_bot_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recall_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_transcripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_recall_bots_updated_at 
  BEFORE UPDATE ON recall_bots
  FOR EACH ROW EXECUTE FUNCTION update_recall_bots_updated_at();

CREATE TRIGGER update_transcripts_updated_at 
  BEFORE UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_transcripts_updated_at();

