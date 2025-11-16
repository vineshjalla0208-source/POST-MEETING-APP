import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateSocialPost, generateFollowUpEmail } from "@/lib/openai"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId } = await request.json()

    if (!meetingId) {
      return NextResponse.json(
        { error: "meetingId is required" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify meeting belongs to user
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id, title")
      .eq("id", meetingId)
      .eq("user_id", session.user.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Get transcript for the meeting
    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transcriptError || !transcript) {
      return NextResponse.json(
        { error: "Transcript not found. Please ensure the meeting has been recorded." },
        { status: 404 }
      )
    }

    // Get all enabled automations for the user
    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("enabled", true)

    if (automationsError) {
      return NextResponse.json(
        { error: "Failed to fetch automations" },
        { status: 500 }
      )
    }

    if (!automations || automations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No enabled automations found",
        posts: [],
      })
    }

    // Generate posts for each automation
    const generatedPosts = []

    for (const automation of automations) {
      try {
        // Handle different automation types
        if (automation.type === "email") {
          // Generate email using automation prompt template if available
          const emailContent = await generateFollowUpEmail(
            transcript.content,
            transcript.participants || []
          )

          // Save to ai_posts table
          const { data: savedPost, error: saveError } = await supabase
            .from("ai_posts")
            .insert({
              meeting_id: meetingId,
              type: "automation",
              content: emailContent,
              automation_id: automation.id,
            })
            .select()
            .single()

          if (!saveError && savedPost) {
            generatedPosts.push({
              automation: {
                id: automation.id,
                name: automation.name,
                type: automation.type,
              },
              post: savedPost,
            })
          }
          continue
        }

        // For social media automations, determine which platforms to generate for
        const platforms: string[] = []
        if (automation.type === "linkedin" || automation.platform === "linkedin" || automation.platform === "both") {
          platforms.push("linkedin")
        }
        if (automation.type === "facebook" || automation.platform === "facebook" || automation.platform === "both") {
          platforms.push("facebook")
        }

        for (const platform of platforms) {
          // Use custom prompt template if available, otherwise use default generation
          let postContent: string
          
          if (automation.prompt_template) {
            // Use custom prompt template
            const customPrompt = automation.prompt_template
              .replace("{transcript}", transcript.content)
              .replace("{tone}", automation.tone)
              .replace("{hashtag_count}", automation.hashtag_count.toString())
            
            // Generate using OpenAI with custom prompt
            const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You are a financial advisor creating engaging social media content.",
                },
                {
                  role: "user",
                  content: customPrompt,
                },
              ],
              temperature: 0.8,
              max_tokens: 300,
            })
            postContent = response.choices[0]?.message?.content || "Unable to generate post."
          } else {
            // Use default generation
            postContent = await generateSocialPost(
              transcript.content,
              automation.tone,
              automation.hashtag_count
            )
          }

          // Save to ai_posts table
          const { data: savedPost, error: saveError } = await supabase
            .from("ai_posts")
            .insert({
              meeting_id: meetingId,
              type: "automation",
              content: postContent,
              automation_id: automation.id,
              platform: platform,
            })
            .select()
            .single()

          if (!saveError && savedPost) {
            generatedPosts.push({
              automation: {
                id: automation.id,
                name: automation.name,
                tone: automation.tone,
                hashtag_count: automation.hashtag_count,
              },
              platform,
              post: savedPost,
            })
          }
        }
      } catch (error: any) {
        console.error(`Error generating post for automation ${automation.id}:`, error)
        // Continue with other automations
      }
    }

    return NextResponse.json({
      success: true,
      posts: generatedPosts,
      count: generatedPosts.length,
    })
  } catch (error: any) {
    console.error("Generate automation posts error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate automation posts" },
      { status: 500 }
    )
  }
}

