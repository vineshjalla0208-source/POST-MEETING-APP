import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateFollowUpEmail(transcript: string, attendees: string[]): Promise<string> {
  const prompt = `You are a professional financial advisor. Based on the following meeting transcript, generate a warm, professional follow-up email.

Meeting Transcript:
${transcript}

Attendees: ${attendees.join(", ")}

Generate a follow-up email that:
- Thanks attendees for their time
- Summarizes key discussion points
- Includes any action items or next steps
- Maintains a warm, professional tone
- Is concise but comprehensive

Email:`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a professional financial advisor assistant. Generate warm, professional follow-up emails based on meeting transcripts.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return response.choices[0]?.message?.content || "Unable to generate email."
}

export async function generateSocialPost(
  transcript: string,
  tone: string = "warm financial advisor",
  hashtagCount: number = 3
): Promise<string> {
  const prompt = `You are a financial advisor creating a social media post. Based on the following meeting transcript, generate a social media post.

Meeting Transcript:
${transcript}

Requirements:
- 120-180 words
- First-person perspective
- ${tone} tone
- Up to ${hashtagCount} relevant hashtags
- Engaging and professional
- Highlights key insights or takeaways

Social Media Post:`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a financial advisor creating engaging social media content. Generate posts that are professional, warm, and valuable to your audience.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 300,
  })

  return response.choices[0]?.message?.content || "Unable to generate post."
}

