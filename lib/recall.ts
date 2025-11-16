const RECALL_API_BASE = "https://api.recall.ai/api/v1"

export interface RecallBot {
  id: string
  status: string
  meeting_url: string
}

export async function createRecallBot(meetingUrl: string): Promise<RecallBot> {
  const response = await fetch(`${RECALL_API_BASE}/bot/`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.RECALL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: "Post-Meeting Assistant",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Recall bot: ${error}`)
  }

  return response.json()
}

export async function getRecallBotStatus(botId: string): Promise<RecallBot> {
  const response = await fetch(`${RECALL_API_BASE}/bot/${botId}/`, {
    headers: {
      "Authorization": `Token ${process.env.RECALL_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get bot status: ${response.statusText}`)
  }

  return response.json()
}

export async function getRecallTranscript(botId: string): Promise<string> {
  const response = await fetch(`${RECALL_API_BASE}/bot/${botId}/transcript/`, {
    headers: {
      "Authorization": `Token ${process.env.RECALL_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get transcript: ${response.statusText}`)
  }

  const data = await response.json()
  return data.transcript || ""
}

