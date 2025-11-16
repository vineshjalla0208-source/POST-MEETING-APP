export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  created_at: string
}

export interface GoogleAccount {
  id: string
  user_id: string
  email: string
  access_token: string
  refresh_token: string | null
  expires_at: number | null
  created_at: string
}

export interface Event {
  id: string
  user_id: string
  google_account_id: string | null
  title: string
  description: string | null
  start_time: string
  end_time: string
  meeting_link: string | null
  meeting_platform: 'zoom' | 'meet' | 'teams' | null
  location: string | null
  calendar_event_id: string | null
  created_at: string
  updated_at: string
}

export interface MeetingBot {
  id: string
  event_id: string
  status: 'pending' | 'joined' | 'recording' | 'completed' | 'failed'
  recall_bot_id: string | null
  joined_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  event_id: string
  meeting_bot_id: string
  content: string
  attendees: string[]
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface SocialConnection {
  id: string
  user_id: string
  platform: 'linkedin' | 'facebook'
  access_token: string
  refresh_token: string | null
  expires_at: number | null
  profile_id: string | null
  profile_name: string | null
  created_at: string
  updated_at: string
}

export interface Automation {
  id: string
  user_id: string
  name: string
  platform: 'linkedin' | 'facebook' | 'both'
  tone: string
  hashtag_count: number
  type: 'generate_post'
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  bot_join_minutes_before: number
  default_automation_id: string | null
  created_at: string
  updated_at: string
}

