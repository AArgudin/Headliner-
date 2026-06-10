import { runAgent } from "@/lib/anthropic"
import { prisma } from "@/lib/prisma"
import { getRevenueStats } from "./revenue"
import { getBookingStats } from "./booking"
import { startOfWeek, format } from "date-fns"

export async function generateWeeklyBrief(artistId: string) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) throw new Error("Artist not found")

  const [
    revenueStats,
    bookingStats,
    recentLogs,
    pendingContent,
    activeCampaigns,
    overdueInvoices,
    upcomingBookings,
  ] = await Promise.all([
    getRevenueStats(artistId),
    getBookingStats(artistId),
    prisma.agentLog.findMany({
      where: { artistId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.contentItem.count({ where: { artistId, status: "scheduled" } }),
    prisma.prCampaign.count({ where: { artistId, status: "active" } }),
    prisma.invoice.count({ where: { artistId, status: "overdue" } }),
    prisma.booking.findMany({
      where: { artistId, status: "confirmed", eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 3,
    }),
  ])

  const systemContext = {
    artist: artist.name,
    genre: artist.genre,
    city: artist.city,
    revenue: revenueStats,
    bookings: bookingStats,
    pendingContent,
    activeCampaigns,
    overdueInvoices,
    upcomingBookings: upcomingBookings.map(b => ({
      venue: b.venue,
      date: new Date(b.eventDate).toLocaleDateString(),
      fee: b.fee,
    })),
    agentActivity: recentLogs.length,
  }

  const system = `You are the Intel Agent for ROSTER — an AI operations platform for music artists.
You write weekly briefings that are sharp, specific, and actionable.
No fluff. Lead with what matters most. Write like a sharp manager who respects the artist's time.
Format: plain text with clear sections. Use numbers. Be direct about problems.`

  const brief = await runAgent(
    system,
    `Generate the weekly brief for ${artist.name}.
Here's everything that happened this week:
${JSON.stringify(systemContext, null, 2)}

Structure the brief with:
1. WEEK AT A GLANCE (3 key numbers)
2. WHAT YOUR AGENTS DID (bullet list)
3. REVENUE UPDATE (specific numbers + any issues)
4. UPCOMING SHOWS (next bookings)
5. THIS WEEK'S PRIORITY (single most important action)

Be specific. Use real numbers from the data. Keep total under 300 words.`,
    1500
  )

  const highlightsResult = await runAgent(
    "Extract 3 key highlights from this brief as a JSON array of short strings (max 10 words each). Return ONLY the JSON array, no other text.",
    brief,
    200
  )

  let highlights = ["Agent activity this week", "Revenue tracking updated", "Content pipeline active"]
  try {
    const cleaned = highlightsResult.replace(/```json\n?|\n?```/g, "").trim()
    highlights = JSON.parse(cleaned)
  } catch {}

  const weekOf = startOfWeek(new Date())

  // Delete old brief for this week if exists, then create fresh
  await prisma.weeklyBrief.deleteMany({ where: { artistId, weekOf } })
  await prisma.weeklyBrief.create({
    data: {
      artistId,
      weekOf,
      content: brief,
      highlights: JSON.stringify(highlights),
    },
  })

  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "intel",
      action: "Generated weekly brief",
      details: `Week of ${format(weekOf, "MMM d, yyyy")}`,
      status: "success",
    },
  })

  return { brief, highlights, weekOf }
}
