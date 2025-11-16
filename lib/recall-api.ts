/**
 * Recall.ai API Integration
 * Documentation: https://docs.recall.ai
 */

const RECALL_API_BASE = process.env.RECALL_API_BASE_URL || 'https://api.recall.ai/api/v1'
const RECALL_API_KEY = process.env.RECALL_API_KEY

export interface RecallBot {
  id: string
  bot_name?: string
  meeting_url: string
  meeting_start_time?: string
  status?: 'pending' | 'joining' | 'recording' | 'processing' | 'completed' | 'failed'
  recording_started_at?: string
  recording_ended_at?: string
  transcript?: {
    id: string
    status: string
  }
}

export interface RecallTranscript {
  id: string
  status: string
  transcript?: string
  summary?: string
  duration_seconds?: number
  participant_count?: number
  participants?: string[]
}

export interface CreateBotRequest {
  meeting_url: string
  bot_name?: string
  meeting_start_time?: string
  auto_join?: boolean
}

/**
 * Creates a Recall bot for a meeting
 */
export async function createRecallBot(
  meetingUrl: string,
  meetingStartTime?: string,
  botName?: string
): Promise<RecallBot> {
  if (!RECALL_API_KEY) {
    throw new Error('RECALL_API_KEY is not configured')
  }

  const requestBody: CreateBotRequest = {
    meeting_url: meetingUrl,
    bot_name: botName || 'Post-Meeting Assistant',
    auto_join: true,
  }

  if (meetingStartTime) {
    requestBody.meeting_start_time = meetingStartTime
  }

  const response = await fetch(`${RECALL_API_BASE}/bots/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${RECALL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create Recall bot: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Gets the status of a Recall bot
 */
export async function getRecallBotStatus(botId: string): Promise<RecallBot> {
  if (!RECALL_API_KEY) {
    throw new Error('RECALL_API_KEY is not configured')
  }

  const response = await fetch(`${RECALL_API_BASE}/bots/${botId}/`, {
    headers: {
      'Authorization': `Token ${RECALL_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get bot status: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Gets the transcript for a Recall bot
 */
export async function getRecallTranscript(botId: string): Promise<RecallTranscript> {
  if (!RECALL_API_KEY) {
    throw new Error('RECALL_API_KEY is not configured')
  }

  const response = await fetch(`${RECALL_API_BASE}/bots/${botId}/transcript/`, {
    headers: {
      'Authorization': `Token ${RECALL_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get transcript: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Lists all bots for the account
 */
export async function listRecallBots(): Promise<RecallBot[]> {
  if (!RECALL_API_KEY) {
    throw new Error('RECALL_API_KEY is not configured')
  }

  const response = await fetch(`${RECALL_API_BASE}/bots/`, {
    headers: {
      'Authorization': `Token ${RECALL_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to list bots: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.results || []
}

