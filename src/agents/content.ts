import { runAgent } from "@/lib/anthropic"
import { prisma } from "@/lib/prisma"

const TRENDING_HOOKS = [
  "POV: you're at [VENUE] and [ARTIST] drops this",
  "The transition that made the crowd go crazy 🔊",
  "When the DJ reads the room perfectly",
  "This is what Miami sounds like at 2am",
  "The set that changed everything for me",
  "Real ones know this track",
]

export async function generateContentBatch(
  artistId: string,
  count = 7
) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) throw new Error("Artist not found")

  const system = `You are a social media content strategist for ${artist.name}, a ${artist.genre} DJ based in ${artist.city}.
You write content that sounds authentic to DJ/electronic music culture — not corporate, not generic.
The vibe is: confident, minimal, culture-rooted. Think less is more.
No emojis unless they're the right ones. No hashtag spam.
Write in the artist's first-person voice.
Return ONLY a valid JSON array, no other text.`

  const result = await runAgent(
    system,
    `Generate ${count} social media posts for the week ahead.
Mix of: behind-the-scenes, upcoming show promo, music taste, lifestyle, fan engagement.
For each post return: { "platform": "instagram|tiktok|both", "caption": "...", "hook": "first line that stops the scroll", "hashtags": "3-5 relevant tags", "mediaType": "post|reel|story" }
Return as JSON array only.`,
    2000
  )

  let posts: any[] = []
  try {
    const cleaned = result.replace(/```json\n?|\n?```/g, "").trim()
    posts = JSON.parse(cleaned)
  } catch {
    // fallback parse attempt
    const match = result.match(/\[[\s\S]*\]/)
    if (match) posts = JSON.parse(match[0])
  }

  // Save to DB
  const now = new Date()
  const created = await Promise.all(
    posts.map((post: any, i: number) => {
      const scheduled = new Date(now)
      scheduled.setDate(now.getDate() + i)
      scheduled.setHours(18, 0, 0, 0) // 6pm default
      return prisma.contentItem.create({
        data: {
          artistId,
          platform: post.platform || "instagram",
          caption: post.caption || "",
          hook: post.hook || "",
          hashtags: post.hashtags || "",
          mediaType: post.mediaType || "post",
          status: "scheduled",
          scheduledAt: scheduled,
          source: "agent",
        },
      })
    })
  )

  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "content",
      action: `Generated ${created.length} content posts`,
      details: `Weekly batch for ${artist.name}`,
      status: "success",
    },
  })

  return created
}

export async function generateSinglePost(
  artistId: string,
  context: string
) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) throw new Error("Artist not found")

  const system = `You are writing social content for ${artist.name}, a ${artist.genre} DJ.
Write one focused post. Authentic voice. Culture-aware. No fluff.
Return JSON: { "caption": "...", "hook": "...", "hashtags": "...", "platform": "instagram|tiktok|both" }`

  const result = await runAgent(system, `Context for this post: ${context}`, 500)

  try {
    const cleaned = result.replace(/```json\n?|\n?```/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return { caption: result, hook: "", hashtags: "", platform: "instagram" }
  }
}
