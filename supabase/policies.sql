-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_cache ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid()::text = id::text);

-- Accounts policies
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Meetings policies
CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Transcripts policies
CREATE POLICY "Users can view transcripts of own meetings"
  ON transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = transcripts.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert transcripts for own meetings"
  ON transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = transcripts.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update transcripts of own meetings"
  ON transcripts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = transcripts.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete transcripts of own meetings"
  ON transcripts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = transcripts.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

-- Summary cache policies
CREATE POLICY "Users can view summaries of own meetings"
  ON summary_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = summary_cache.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert summaries for own meetings"
  ON summary_cache FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = summary_cache.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update summaries of own meetings"
  ON summary_cache FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = summary_cache.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete summaries of own meetings"
  ON summary_cache FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = summary_cache.meeting_id
      AND meetings.user_id::text = auth.uid()::text
    )
  );

